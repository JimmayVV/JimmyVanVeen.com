# ADR 13: oxc Toolchain + TypeScript 7 Modernization

## Status

Accepted (built and merged 2026-07-24). The **Decision** section below records the
original plan; see **As-built deviations** for what actually shipped (npm 11, RR
8.2.0/preview pins, `pedantic` off, test `as` exemption kept, E2E-on-PR deferred).

Supersedes **ADR 10 (ESLint & Prettier)**. Amends **ADR 01 (TypeScript)** and
**ADR 12 (GitHub Actions CI/CD)**.

## As-built deviations (2026-07-24)

- **Preview pins** (sandbox registry frozen ~3 days behind): `oxlint@1.74`,
  `oxlint-tsgolint@0.25`, `oxfmt@0.59`, `react-router@8.2.0`. Bump to stable
  (`oxlint-tsgolint@7.0.x`, `oxfmt@0.60`, `react-router@8.3.0`) on a live registry.
- **npm 11** (bundled with Node 24) rather than npm 12 — no Node release bundles
  npm 12 (see npm 12 note below).
- **oxlint `pedantic` left off**, not error/warn — its pedantic set bundles
  counterproductive rules (`prefer-readonly-parameter-types`, `no-inline-comments`,
  `max-lines-per-function`). Error tier = correctness + suspicious + perf + all
  type-aware + the any/as bans; `nursery` = warn.
- **Test `as`/type-aware exemption kept (#381 deferred)** — the shoehorn migration
  wasn't done to keep this PR's blast radius sane. Production code is fully strict.
- RR8 needed `--legacy-peer-deps` (framework major bump) and a `server/app.ts`
  RouterContextProvider + server-build boundary fix.
- **E2E-on-PR (item 8b) deferred** — the Playwright `test-e2e` job stays gated to
  `main` for now; running it on PRs against the deploy preview is a fast-follow.

## Context

The stack is healthy but the toolchain is mid-generation: ESLint 9 +
typescript-eslint 8 (type-aware, `as` banned) for linting, Prettier 3 for
formatting, TypeScript 6.0, Node 22 / npm 11, React Router 7. The goal of this
modernization is to jump the whole environment to the current bleeding edge in a
single coordinated pass. This is a personal, non-revenue project, so the risk
budget is deliberately high — we optimise for "most modern, strictest possible"
over conservative stability.

The root ask, verbatim intent:

- Node 24, npm 12, latest of the whole stack — "modern everything"
- All linting and formatting standardised
- TypeScript 7
- Typed linting with strict rules banning `any` and `as`
- CI/CD robust enough to stop the recurring green-locally / red-in-CI failures

Two facts discovered during planning reshaped the approach (all versions as of
2026-07-23):

1. **`typescript-eslint` does not support TypeScript 7** and closed the request
   as "not planned"; ESLint core is blocked behind it. Staying on
   ESLint + typescript-eslint would force a dual-TypeScript-version workaround
   (TS 7 for `tsc`, TS 6 pinned for the linter). **Oxlint's type-aware linting
   went stable on 2026-07-22** via `tsgolint` (59 of 61 typescript-eslint
   type-aware rules, running on `typescript-go` / TS 7). Moving the linter to
   the oxc stack therefore _removes_ the TS 7 conflict rather than working
   around it.
2. Every CI failure this project has hit is a **version-drift** failure: Node
   pinned in four places (`.nvmrc`, `netlify.toml`, `engines`, `ci.yml`), and a
   local Prettier 3.8.4 vs CI 3.9.5 mismatch that passed locally and failed in
   CI. The durable fix is a single source of truth per tool, not better manual
   syncing.

## Decision

Adopt the **oxc toolchain** (oxlint + oxfmt + tsgolint) on **TypeScript 7** and
**Node 24** (with the npm it bundles — see note), at maximal strictness, landed
as **one PR** structured in verifiable layers.

> **npm 12 note (2026-07-23):** The original ask named npm 12, but **no Node
> release bundles npm 12** — even Node 26.5.0 (2026-07-08) ships npm 11.17.0 —
> and corepack deliberately will not shim the bare `npm` command (only
> `corepack npm …` reaches it). Chasing npm 12 would mean a per-environment
> global install and a lockfile regenerated in npm 12's format, i.e. _more_
> drift surface, against the "robust CI" goal. Decision: **stay on the npm
> bundled with Node 24 (11.x)**. `.nvmrc` then drives Node _and_ npm from one
> file, and the existing lockfile stays valid (no regeneration). Revisit if/when
> a Node release bundles npm 12.

1. **Linter:** replace ESLint + typescript-eslint entirely with **oxlint** +
   **tsgolint** type-aware linting. Delete `eslint`, `@eslint/js`,
   `typescript-eslint`, all `eslint-plugin-*`, `eslint-config-prettier`,
   `@stylistic/eslint-plugin`, `@types/eslint__js`.
2. **Formatter:** replace **Prettier** with **oxfmt** (Prettier survives only as
   oxfmt's internal delegation for formats it doesn't yet own, e.g. Markdown).
   Drop `@trivago/prettier-plugin-sort-imports` (oxfmt does import sorting).
3. **TypeScript:** upgrade 6.0 → **7.0** (native Go compiler, `tsc` entry
   point). Enable the **full strict superset** beyond `strict: true`:
   `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`,
   `noFallthroughCasesInSwitch`, `noImplicitOverride`,
   `noPropertyAccessFromIndexSignature`, `noUncheckedSideEffectImports`,
   `allowUnreachableCode: false`. Modernise `target`/`lib` to ES2024.
4. **Lint strictness:** oxlint `correctness` + `suspicious` + `pedantic` + `perf`
   → **error**; all ~59 tsgolint type-aware rules → **error**; `restriction`
   → cherry-picked (`no-explicit-any`, `consistent-type-assertions: never`,
   `no-unsafe-type-assertion`, …); `style` → deferred to oxfmt; `nursery` →
   **warn** (unstable rules must never break CI).
5. **`any` / `as` ban is project-wide, including tests.** Drop the test-file
   exemption and close #381. Sanctioned escape valves, in order of preference:
   `@ts-expect-error` **with a mandatory description** (via `ban-ts-comment`)
   for expected-type-error tests; `@total-typescript/shoehorn`
   (`fromPartial`/`fromAny`) for partial mocks; a justified
   `// oxlint-disable-next-line` with a reason for the rare unavoidable case.
6. **Version single source of truth:** make **`.nvmrc` the sole Node pin** —
   `actions/setup-node` (via `node-version-file`) and Netlify both read it, and
   it fixes the bundled npm too — then delete the hardcoded `NODE_VERSION` in
   `netlify.toml` and the Node version in `ci.yml`; `engines` requires
   `>=24.15.0`. No corepack, no `packageManager` pin, no lockfile regeneration
   (npm stays on the bundled 11.x, so the existing lockfile remains valid). npm
   11 runs install scripts by default, so no `allowScripts` allowlist is needed.
7. **Latest of the whole stack:** three breaking majors — **TypeScript 6→7**,
   **React Router 7→8** (baselines already met: Node 22+, React 19+, Vite 8,
   ESM; migrate via the `v8_*` future flags then bump to 8.3.0), **nodemailer
   8→9** (touches the contact form — verify) — plus ~20 safe minor/patch bumps.
8. **CI robustness:** (a) root-cause the flaky vitest teardown
   (`EnvironmentTeardownError` — an un-awaited async log in the analytics tests)
   and add `retry: 1` as a backstop; (b) run **Playwright E2E on PRs against the
   Netlify deploy preview**; (c) add **`npm run verify`** (+ optional
   `pre-push`) that runs the exact CI suite through the lockfile-pinned tools so
   "green local" structurally means "green CI."

## Rationale

### Pros

- One fast Rust/Go-native toolchain (oxlint + oxfmt + tsgolint) replaces a
  many-package ESLint/Prettier config; the dependency tree shrinks.
- Type-aware lint runtime drops from ~minutes to <10s (typescript-go).
- TS 7 + tsgolint dissolves the TS7/typescript-eslint conflict — strict typed
  linting _and_ TS 7, no dual-version hack.
- Strict superset + project-wide `any`/`as` ban delivers the exact strictness
  asked for, with `@ts-expect-error`/shoehorn keeping tests expressible.
- `.nvmrc` single source of truth (Node + its bundled npm) makes version drift
  — the root cause of every past CI failure — structurally impossible.

### Cons

- Bleeding edge: oxfmt is pre-1.0 (beta); tsgolint stabilised only 2026-07-22.
  Expect rough edges.
- One-time migration cost: fix all new strict-flag errors, migrate test `as`
  usages to shoehorn, re-express the ESLint config as `.oxlintrc.json`.
- Three breaking majors in one PR raises blast radius (mitigated by layered
  commits + local verify-before-push).

## Alternatives Considered

### Sequenced roadmap (adopt-ready-now, gate-risky-later)

- **Pros**: lowest risk; each change isolated.
- **Cons**: slow; leaves the stack mid-generation for longer.
- **Why rejected**: non-revenue project with an explicit high risk budget; owner
  chose the all-in-one bleeding-edge pass.

### Keep ESLint + typescript-eslint, adopt TS 7 with dual-version workaround

- **Pros**: keeps the mature, familiar linter.
- **Cons**: permanent dual-TypeScript maintenance; slower lint; against the
  "standardise on one toolchain" goal.
- **Why rejected**: oxlint+tsgolint is TS7-native and faster — the workaround
  buys nothing here.

### Ordered sequence of small PRs (instead of one PR)

- **Pros**: a red CI points at exactly one culprit.
- **Cons**: more overhead; owner wanted it knocked out at once.
- **Why rejected**: owner chose one PR; mitigated by layered commits.

## Tradeoffs

### What We Gained

- Strictest practical type checking + type-aware linting, TS 7 speed, a single
  standardised toolchain, and drift-proof version management.

### What We Sacrificed

- Maturity/stability of the tooling (pre-1.0 oxfmt, brand-new tsgolint) and a
  chunk of one-time migration effort.

## Dependencies

- ADR 01 (TypeScript), ADR 03 (Vite), ADR 04 (React Router v7), ADR 10 (ESLint &
  Prettier — superseded), ADR 12 (CI/CD).
- External: oxlint ≥ type-aware-stable, tsgolint (tracks TS 7.0.2), oxfmt beta,
  Node 24 (bundled npm 11.x), React Router 8.3.0.

## Implementation Notes

Single PR, committed in verifiable layers (each green locally before the next):

1. **Version SSOT** — `.nvmrc` sole pin (Node 24 + its bundled npm 11.x), delete
   duplicate Node pins in `netlify.toml`/`ci.yml`, `engines` `>=24.15.0`.
2. **Toolchain swap** — ESLint→oxlint+tsgolint, Prettier→oxfmt, at _current_
   strictness (prove the tools before cranking rules). `npx @oxlint/migrate`
   from the flat config as a starting point.
3. **Crank strictness** — TS 7 + strict-superset tsconfig, oxlint max,
   project-wide `any`/`as` + shoehorn, close #381.
4. **React Router 7→8** — enable `v8_*` future flags, verify, bump to 8.3.0.
5. **nodemailer 9 + remaining minors.**

The Claude Code `no-as-assertion.mjs` PreToolUse hook stays (edit-time defence,
independent of the linter).

## Success Metrics

- `npm run verify` reproduces CI exactly; no green-local/red-CI divergence.
- Lint wall-clock materially lower than the ESLint baseline.
- Zero `any` / raw `as` in **production** code, enforced in CI (the one
  documented exception is `contentful-cache.ts`'s generic-cache cast, #382).
  Tests keep the `as` exemption until #381.
- `tsc` (TS 7) passes with the full strict superset.

## Risks and Mitigation

- **tsgo flag-parity gaps** (Go port still closing edge cases): keep any
  unsupported strict flag in `tsconfig` so `tsc` still enforces it; note it.
- **oxlint rule coverage gaps** vs eslint-plugin-react: fill via oxlint's JS
  plugin shim where it matters.
- **oxlint/tsgolint native binaries** failing to fetch on install: `npm run
verify` (which runs the linter) catches a missing binary before push.
- **nodemailer 9** breaking the contact form: verify send path before merge.
- **Pre-1.0 oxfmt**: acceptable given risk budget; Prettier remains the fallback
  formatter it already delegates to.

## Future Considerations

- Revisit oxfmt at its 1.0 to drop the Prettier delegation entirely.
- React Router now ships annual majors; re-run the future-flags-then-bump play
  each year.
- If tsgolint reaches 61/61 rules, remove any interim gap notes.

## Glossary

- **oxc toolchain** — the Oxc project's Rust/Go-native JS/TS tools: **oxlint**
  (linter), **oxfmt** (formatter), **tsgolint** (type-aware lint engine).
- **tsgolint** — runs the type-aware lint rules using `typescript-go` (TS 7) for
  full type-system fidelity at native speed; developed under the Oxc org.
- **type-aware linting** — lint rules that need the type checker (e.g.
  `no-floating-promises`, `no-unsafe-*`), as opposed to syntax-only rules.
- **strict superset** — the opt-in `tsconfig` strictness flags _beyond_
  `strict: true`.
- **version single source of truth** — exactly one authoritative pin per tool
  (`.nvmrc` for Node, `packageManager` for npm) that every environment reads.

## Related ADRs

- ADR 10 (ESLint & Prettier) — superseded by this.
- ADR 01 (TypeScript), ADR 12 (CI/CD) — amended by this.

## Related Documentation

- Tracking issue: #381 (test `as` → shoehorn), Dependabot #389 (nodemailer 9).
