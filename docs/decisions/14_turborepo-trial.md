# ADR 14: Turborepo trial on a single-package repo

## Status

**Proposed — trial.** This is explicitly a time-boxed experiment, not an
adopted decision. It is measured for two weeks from merge against the median CI
wall time of the previous two weeks, and kept only if that median drops. If it
does not, it is reverted (see **How to revert**).

Amends **ADR 12 (GitHub Actions CI/CD)** and **ADR 13 (oxc Toolchain
Modernization)**. Supersedes neither.

## Context

This repo is a single package. Turborepo is a monorepo task runner, so the usual
reason to adopt it — orchestrating tasks across workspaces — does not apply here
at all. The only thing on offer is its **content-addressed task cache**: hash the
inputs of a task, and if that hash has been seen before, skip the task and replay
its logs (and restore its outputs) instead of re-running it.

The question is whether that caching is worth a config file and a layer of
indirection in `package.json` on a repo with one package.

Two facts make it plausibly worth testing:

1. **CI re-runs the same work often.** A Dependabot PR that touches only
   `package-lock.json` still runs lint, format, typecheck, test, and build. A
   docs-only PR does the same. A push to `main` immediately after a PR merged
   green re-runs the identical tree. Each of those is a full ~3-minute CI cycle
   spent proving something already proven.
2. **The local `verify` loop repeats too.** `npm run verify` runs the full suite
   even when nothing relevant changed since the last run.

Against that: the wins are capped. The suite is already fast — this repo is on
the oxc toolchain (ADR 13), so lint is ~0.5s and typecheck ~1s. Most of CI's
three minutes is checkout, `npm ci`, and Playwright browser install, none of
which Turborepo touches. So the honest prior is that the caching helps the
**build** job and the local loop meaningfully, and the other jobs marginally.

That uncertainty is the reason this is a measured trial rather than an adoption.

## Decision

Add Turborepo (pinned exact, `2.10.12`) as a dev dependency and route the five
CI-facing scripts through it, keeping the raw commands intact underneath.

### Script shape

In a single-package `turbo.json`, a task named `lint` runs the `lint` script —
so naming the turbo task `lint` and the wrapper script `lint` would recurse.
The scripts are therefore split:

| Script             | Runs                               |
| ------------------ | ---------------------------------- |
| `lint`             | `turbo run lint:raw`               |
| `lint:raw`         | `react-router typegen && oxlint …` |
| `format:check`     | `turbo run format:check:raw`       |
| `format:check:raw` | `oxfmt --check .`                  |
| `typecheck`        | `turbo run typecheck:raw`          |
| `typecheck:raw`    | `react-router typegen && tsc`      |
| `test`             | `turbo run test:raw`               |
| `test:raw`         | `vitest run`                       |
| `build`            | `turbo run build:raw`              |
| `build:raw`        | `react-router build`               |

Every caller — CI, Netlify, `npm run verify`, muscle memory — keeps using the
same five names it used before. Nothing outside this repo needs to know.

`lint:fix`, `lint:fast`, `format`, `test:watch`, `test:ui`, `test:coverage`,
`test:e2e`, `dev` and `start` are deliberately **not** routed through turbo.
They are interactive or write-in-place; caching them buys nothing and would only
add a layer between the terminal and the tool.

### Cache scoping

Each task declares narrowed `inputs` so an unrelated edit does not invalidate it.
`package.json`, `package-lock.json`, `tsconfig.json` and `.nvmrc` are
`globalDependencies` — a change to any of them invalidates every task, which is
the correct behaviour for a toolchain or dependency change.

`format:check:raw` is the exception: `oxfmt --check .` walks the whole repo,
Markdown and YAML included, so it uses `$TURBO_DEFAULT$` (every git-tracked,
non-ignored file, ~122 here). Narrowing it to `app/**` would let an unformatted
doc slip past a cache hit — a wrong green, which is worse than a slow green.

Only `build:raw` declares `outputs` (`build/**`, `.react-router/**`) and `env`
(`JVV_*`, `NODE_ENV`). The other four produce nothing but an exit code, so they
declare none. Listing `JVV_*` matters: those values are compiled into the client
bundle, so a build cached under one value must not be replayed under another.
Verified — flipping `JVV_ALLOW_EMAILS` produces a cache miss.

### CI

`.github/workflows/ci.yml` sets `turbo-cache: true` on the fleet-ci `node-ci`
call. That input (added in JimmayVV/fleet-ci#4) adds an `actions/cache` step for
`.turbo` to all four jobs, keyed `turbo-<os>-<sha>` with a `turbo-<os>-` restore
prefix, and sets `TURBO_TELEMETRY_DISABLED=1`. The restore prefix is what makes
this work at all: an exact-SHA key never hits on a new commit, so every run
restores the newest cache for that runner and then re-saves under its own SHA.

Remote caching (Vercel) is **not** enabled. It would mean a `TURBO_TOKEN` in
repository secrets and a third-party dependency in the CI path, for a repo where
the local cache is untested. If the trial succeeds, remote caching is the
follow-up question, not part of this.

## Rationale

### Pros

- Local `npm run verify` drops from ~6.3s cold to ~0.7s warm — four cache hits,
  `>>> FULL TURBO`.
- `npm run build` drops from ~7.7s to ~26ms when the tree is unchanged, with
  `build/` and `.react-router/` restored from cache rather than rebuilt.
- Dependabot and docs-only PRs — a large share of this repo's PR volume — are
  exactly the case where a restored cache should skip nearly everything.
- Reversible in one commit. Nothing about the actual lint/test/build commands
  changes; they are the same strings, one script name down.

### Cons

- A whole task runner for a repo with one package. That is the central
  objection and it is a fair one.
- `inputs` are now a correctness surface. Under-declare them and CI goes green
  on work it did not do. This is a new class of bug the repo did not have.
- Two scripts per task instead of one. `package.json` is noisier, and there is
  one more hop to read through when debugging a CI failure.
- Turbo 2.10 requires a `devEngines.packageManager` version, which re-introduces
  a second version pin next to `.nvmrc` — precisely the drift surface ADR 13 set
  out to eliminate. Mitigated by keeping it a loose range (`11.x`) with
  `onFail: "warn"` rather than a hard pin, so it is advisory and cannot fail an
  install. Noted as a genuine cost of this trial, not a neutral detail.

## Alternatives Considered

### Do nothing

- **Pros**: zero config, zero new failure modes, and the suite is already fast.
- **Cons**: keeps paying full CI on PRs that change nothing relevant.
- **Why rejected**: not rejected so much as held as the fallback. If the
  measurement does not show a drop, this is what the repo returns to.

### `actions/cache` on `build/` and `.react-router/` directly, no turbo

- **Pros**: no new dependency; uses the caching primitive already in fleet-ci.
- **Cons**: caches artifacts but cannot skip the task — `react-router build`
  still runs. Hand-rolled `hashFiles()` keys drift out of sync with what the
  build actually reads, and there is no equivalent for lint or test.
- **Why rejected**: it caches the wrong thing. The cost here is running the
  task, not writing the output.

### Nx

- **Pros**: the same caching model, arguably more mature, with better task-graph
  tooling.
- **Cons**: markedly heavier for a single package — plugin system, project
  graph, generators, and a `nx.json` with far more surface to get wrong.
- **Why rejected**: if a single-package repo cannot justify Turborepo, it
  certainly cannot justify Nx. Turborepo is the smaller bet, which is the right
  shape for a trial.

### Vercel remote caching from the start

- **Pros**: cache shared across CI runners and the local machine — the case
  where caching pays most.
- **Cons**: a secret in the repo and a third-party service in the CI path.
- **Why rejected**: sequencing. Prove the local cache helps before adding a
  network dependency to CI.

## Tradeoffs

### What We Gained

- A near-instant warm `verify` loop, and CI that can skip work it has already
  done on the same tree.

### What We Sacrificed

- Simplicity — a task runner, a config file, and doubled script names on a
  one-package repo. Plus the `devEngines` pin, which cuts against ADR 13's
  single-source-of-truth principle.

## Dependencies

- ADR 12 (GitHub Actions CI/CD) — CI runs through fleet-ci's `node-ci.yml`.
- ADR 13 (oxc Toolchain) — the scripts being wrapped, and the `.nvmrc`
  version-SSOT principle this trial partially compromises.
- External: `turbo@2.10.12` (exact), `JimmayVV/fleet-ci@v1` with the
  `turbo-cache` input.

## Implementation Notes

- `turbo` pinned exact — a task runner whose entire job is hashing inputs should
  not itself float, or cache behaviour changes under you between installs.
- `.turbo/` is gitignored.
- `turbo.json` uses `"cache": true` explicitly on every task. It is the default,
  but during a trial about caching, the config should say what it is doing.
- `TURBO_TELEMETRY_DISABLED=1` is set by fleet-ci in CI. Locally, run
  `npx turbo telemetry disable` once.
- Resolution verified with `npx turbo run lint:raw --dry`: the task maps to the
  `lint:raw` script, considers 71 input files, and declares no outputs.

## Success Metrics

The single criterion: **the median wall time of successful CI runs over the two
weeks after merge is lower than the median over the two weeks before.**

Baseline, measured 2026-09-14 over successful `CI` runs from 2026-09-01 to
2026-09-14 (n = 15, via `gh api .../actions/runs/<id>/timing`):

|           |                         |
| --------- | ----------------------- |
| Median    | **3m 12s** (192,000 ms) |
| p25 / p75 | 3m 06s / 3m 14s         |
| Min / max | 2m 53s / 3m 51s         |

The distribution is tight, which helps — a real improvement should be legible
against a p25–p75 spread of eight seconds, and a median that moves by seconds
rather than tens of seconds is noise, not a win.

Re-measure on **2026-09-28** with the same command over the following 14 days.
No drop, no keep.

Secondary observations, not criteria on their own:

- Local `npm run verify` warm: ~0.7s against ~6.3s cold.
- `npm run build` warm: ~26ms against ~7.7s cold, outputs restored.

## How to revert

One commit, no migration:

1. Delete `turbo.json`.
2. In `package.json`, delete the five wrapper scripts and rename `lint:raw` →
   `lint`, `format:check:raw` → `format:check`, `typecheck:raw` → `typecheck`,
   `test:raw` → `test`, `build:raw` → `build`.
3. `npm uninstall turbo`, and drop the `devEngines` block added for it.
4. Remove `turbo-cache: true` from `.github/workflows/ci.yml`.
5. Drop `.turbo/` from `.gitignore`.
6. Mark this ADR **Deprecated** with the measured result and the reason.

Nothing outside this repo changes. The `turbo-cache` input in fleet-ci defaults
to `false` and stays available for other repos regardless of the outcome here.

## Risks and Mitigation

- **A false cache hit — CI green on work it never ran.** The failure mode that
  matters, since it is silent. Mitigated by declaring `inputs` generously rather
  than minimally (`config/**` and `server/**` wholesale, `$TURBO_DEFAULT$` for
  the formatter) and by `globalDependencies` covering the lockfile and tsconfig.
  If a green CI is ever contradicted by a red local run, suspect `inputs` first.
- **Cache-key churn makes it a net loss.** Every `package-lock.json` change
  invalidates everything via `globalDependencies` — and Dependabot PRs are
  exactly the ones where a hit would be most valuable. This is the most likely
  way the trial fails, and the measurement is designed to catch it.
- **Cache restore costs more than it saves.** `.turbo` up/download is not free
  against a ~3-minute baseline. Also caught by the measurement.
- **`devEngines` blocks an install on a future npm major.** Mitigated by
  `onFail: "warn"` and a `11.x` range; worst case it prints a warning.

## Future Considerations

- If the trial succeeds, the next question is Vercel remote caching — which
  would also share the cache between CI and the local machine.
- If it succeeds here, `turbo-cache: true` is worth considering for other fleet
  repos; the fleet-ci input already exists for them.
- If this repo ever gains a second package, this stops being a trial and becomes
  the obvious answer.

## Related ADRs

- ADR 12 (GitHub Actions CI/CD) — amended.
- ADR 13 (oxc Toolchain Modernization) — amended; its version-SSOT principle is
  partially compromised by `devEngines`.

## Related Documentation

- [Development Workflow](../architecture/development-workflow.md)
- [JimmayVV/fleet-ci](https://github.com/JimmayVV/fleet-ci) — `turbo-cache`
  input, added in fleet-ci#4.
