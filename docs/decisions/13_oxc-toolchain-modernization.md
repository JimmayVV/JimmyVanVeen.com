# ADR 13: oxc Toolchain + TypeScript 7 Modernization

## Status

Proposed (planned 2026-07-23)

Supersedes **ADR 10 (ESLint & Prettier)**. Amends **ADR 01 (TypeScript)** and
**ADR 12 (GitHub Actions CI/CD)**.

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
**Node 24 / npm 12**, at maximal strictness, landed as **one PR** structured in
verifiable layers.

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
6. **Version single source of truth:** adopt **corepack** with
   `"packageManager": "npm@12.x"` in `package.json` (also how npm 12 is
   obtained, since it isn't bundled). Make **`.nvmrc` the sole Node pin** —
   `actions/setup-node` and Netlify both read it — and delete the hardcoded
   `NODE_VERSION` in `netlify.toml` and the Node version in `ci.yml`; `engines`
   mirrors it behind a tiny CI drift-check. Add an **`allowScripts` allowlist**
   (`npm approve-scripts`) for `esbuild`, `oxlint`, and `tsgolint` native
   binaries, which npm 12 blocks by default.
7. **Latest of the whole stack:** three breaking majors — **TypeScript 6→7**,
   **React Router 7→8** (baselines already met: Node 22+, React 19+, Vite 8,
   ESM; migrate via the `v8_*` future flags then bump to 8.3.0), **nodemailer
   8→9** (touches the contact form — verify) — plus ~20 safe minor/patch bumps.
8. **CI robustness:** (a) root-cause the flaky vitest teardown
   (`EnvironmentTeardownError` — an un-awaited async log in the analytics tests)
   and add `retry: 1` as a backstop; (b) run **Playwright E2E on PRs against the
   Netlify deploy preview**; (c) add **`npm run verify`** (+ optional
   `pre-push`) that runs the exact CI suite through the corepack-pinned tools so
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
- corepack single source of truth makes version drift — the root cause of every
  past CI failure — structurally impossible.

### Cons

- Bleeding edge: oxfmt is pre-1.0 (beta); tsgolint stabilised only 2026-07-22;
  npm 12 is days old. Expect rough edges.
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

- Maturity/stability of the tooling (pre-1.0 oxfmt, brand-new tsgolint/npm 12)
  and a chunk of one-time migration effort.

## Dependencies

- ADR 01 (TypeScript), ADR 03 (Vite), ADR 04 (React Router v7), ADR 10 (ESLint &
  Prettier — superseded), ADR 12 (CI/CD).
- External: oxlint ≥ type-aware-stable, tsgolint (tracks TS 7.0.2), oxfmt beta,
  npm 12, Node 24, React Router 8.3.0.

## Implementation Notes

Single PR, committed in verifiable layers (each green locally before the next):

1. **Version SSOT** — corepack `packageManager`, `.nvmrc` sole pin, delete
   duplicate Node pins, `allowScripts` allowlist → Node 24 + npm 12.
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
- Zero `any` / raw `as` in the codebase (tests included), enforced in CI.
- `tsc` (TS 7) passes with the full strict superset.

## Risks and Mitigation

- **tsgo flag-parity gaps** (Go port still closing edge cases): keep any
  unsupported strict flag in `tsconfig` so `tsc` still enforces it; note it.
- **oxlint rule coverage gaps** vs eslint-plugin-react: fill via oxlint's JS
  plugin shim where it matters.
- **npm 12 allowScripts** silently skipping binary postinstalls: allowlist
  esbuild/oxlint/tsgolint up front; `npm run verify` catches a missed one.
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
