---
name: preflight
description: Preflight for any change to this site. Use when implementing a feature or fix, adding a dependency, touching server code, routes, or netlify.toml, and before pushing a PR.
---

# Preflight

This site runs every server route in **one Netlify Function**. That is the _blast radius_ of any
server-side change: a module that fails to load takes down every page, not just its own, and
CI's E2E tests run the app locally, so they can't see it. Preflight means proving the change
**production-shaped** (the built bundle, as Netlify runs it) before the preview does the proving
for you, one slow deploy at a time.

Work the steps in order. A client-only change (components, CSS, copy) can skip steps 4 to 6.
Record which path you took.

## Steps

1. **Map the server path.** List every module the change adds to or changes in what the
   function runs: route loaders, `*.server.ts(x)`, `meta`, and each new package they import.
   _Done when_ every new server-side import is named, or the change is confirmed client-only.

2. **Choose dependencies, then install once.** Settle on each package before touching the
   lockfile, then install in a single run on the pinned toolchain (the lockfile rules in
   `CLAUDE.md`). An install-then-uninstall leaves re-tagged entries the reviewer will flag.
   _Done when_ `git diff main -- package-lock.json` shows only the chosen packages and their
   tree, and `npm ci` succeeds from the committed lock.

3. **Write the tests with the feature.** Mirror the sibling test for the same kind of module
   (`app/routes/rss.test.tsx` for a resource route): every loader branch (success headers, not
   found, failure), every `meta` outcome, and each existing behaviour the change alters.
   _Done when_ each branch in the new code has a test that fails if the branch is removed.

4. **Check the built bundle.** Run the build, then import the new chunk from `build/server/` with
   plain `node` and drive the new code path end to end.
   _Done when_ the built code returns its real output (the PNG, the response), not just a
   passing Vitest run.

5. **Audit runtime-read files.** Any dependency that reads a file by path at runtime (`.wasm`,
   native `.node` binaries, fonts, templates) needs that file in `netlify.toml`
   `[functions] included_files`. Netlify's bundler traces JavaScript only. Extend
   `app/og/netlify-included-files.server.test.ts` so CI checks each listed path exists.
   _Done when_ every file the new code reads by path is listed and covered by that test.

6. **Isolate heavy server libraries.** Import them with `await import()` inside the function that
   uses them, and have the route load its module lazily too. Netlify's packager can hoist a lazy
   chunk's static imports into function startup.
   _Done when_ `build/server/index.js` has no static import of the library.

7. **Prove it on the preview.** After each push, wait for the deploy preview of the head commit,
   then request `/` and every new or changed route.
   _Done when_ `/` returns 200 and each new route returns its expected status and content on
   that commit's preview. On a 502, read the function log ([NETLIFY-LOGS.md](NETLIFY-LOGS.md))
   before changing any code.

8. **Clear the review.** Read the review bot's latest comment for the head commit and resolve
   every finding, by fixing it or by replying why it doesn't apply.
   _Done when_ the latest comment ends `VERDICT: clean`, or each finding has a fix or a reply.

## Gotchas no config confesses

- **The React Compiler runs in the build, not in Vitest.** Code that calls a component as a plain
  function (satori, any JSX-to-image renderer) throws "Invalid hook call" only in production.
  Put `"use no memo";` at the top of that function, and pin it in CI the way
  `app/og/share-card.compiler.server.test.ts` does: compile with the build's Babel setup, with a
  control case proving the check can fail.
- **Emscripten aborts the process.** A missing `.wasm` kills the function outright, so a
  try/catch never gets to answer and the log is the only witness.
- **The test setup is browser-shaped.** `config/test/setup.ts` mocks `fetch` and decorates
  `window` under happy-dom. Server code that needs real `fetch` (WASM loaders) runs its tests
  with `// @vitest-environment node` on line 1.
- **One crashing function looks like a site outage.** To find which change did it, unregister
  the new route in `app/routes.ts` for one push. If the preview recovers, the cause is in that
  route's import graph.
- **A slow first render needs durable caching.** Responses that are expensive to build set
  `Netlify-CDN-Cache-Control: public, durable, s-maxage=…` so one render serves every edge.
