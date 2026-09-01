# How remix.run's "race car" homepage animation is built

Researched 2026-09-01 against the live site, the `remix-run/remix-website` source on `main`, its PRs, and Wayback snapshots.

## Summary

1. It is a **Three.js WebGL particle system** (~160k GPU points) on a fixed full-viewport `<canvas>` behind the page content. Point-cloud models (a race car, a "model kit runner", website mockups) and a procedural racetrack **morph into each other as you scroll**; a 3.5 s intro plays once on load. No Rive/Lottie/GSAP/Framer/CSS scroll-timelines.
2. Shipped 2026-04-30 in PR #441 ("New Remix 3 homepage"); the copy was redesigned 2026-08-31 (#496) and the renderer perf-tuned 2026-09-01 (#501). The scene itself is the same in both the "off to the races" version and today's "fully-stacked" version.
3. Weight: three.module.js **~355 KB raw** + ~15 KB post-processing addons + ~110 KB of landing modules, plus **600 KB per point-cloud model (4 models, 2.4 MB; one eager, rest lazy on scroll)**. Runs on the main thread via rAF, GPU-heavy; governed to 60 fps active / 30 fps idle.
4. Respects `prefers-reduced-motion` (snaps to presets, skips intro, renders a static frame), halves particles on coarse-pointer/low-core devices, disables mouse interaction without a fine pointer, and falls back to the static page if `EXT_color_buffer_float` is missing.
5. Content is fully SSR'd; the WebGL code is a client-only dynamic `import()` after hydration, so the pattern ports cleanly to React Router v7 SSR. The car model is derived from Shopify Racing's ORECA LMP2 GLB and the repo has **no license file** — the artwork is not reusable.

## 1. What the animation is

**Current page (Sept 2026).** Black page, JetBrains Mono, hero "The fully-stacked web framework". A fixed `<canvas>` (`position: fixed; inset: 0; z-index: 5; pointer-events: none`) sits behind glass-styled content cards ([particle-canvas.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/components/particle-canvas.tsx), [home.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/home.tsx)). On load a black overlay shows an animated "runner" figure (5 KB AVIF) until the first WebGL frame renders, then fades ([loading-screen.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/components/loading-screen.tsx), [PR #482](https://github.com/remix-run/remix-website/pull/482)). Particles then play a one-shot 3.5 s intro (`PARTICLE_INTRO_DURATION_S = 3.5`).

Scrolling drives a continuous **morph value 0–5** across six presets, in order ([presets.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/presets.ts)):

| #   | Preset                                                                    | Shader             | Model                  |
| --- | ------------------------------------------------------------------------- | ------------------ | ---------------------- |
| 0   | Racetrack — "A mountain circuit streaming past at speed"                  | procedural GLSL    | none                   |
| 1   | Model Kit Runner                                                          | model              | `model-kit-runner.pts` |
| 2   | Racecar (labels FRONTEND / EVERYTHING IN BETWEEN / BACKEND)               | model              | `racecar.pts` (eager)  |
| 3   | Under The Hood — car from the rear, `cameraTransition: "orbit-left"`      | model              | `racecar.pts`          |
| 4   | Website Mockups                                                           | model              | `mockup-websites.pts`  |
| 5   | Drive — "Race car driving on a straight mountain circuit", wheels + trail | procedural + model | `racecar-drive.pts`    |

So it is **scroll-linked**, with time-based spin/shimmer/track-speed inside each preset, plus a mouse "brush" that repels particles on desktop. Scroll position maps to section scroll-stops with plateaus (`SCROLL_MORPH_PLATEAU = 0.46`) so the integer presets hold in the middle of each section ([landing-enhancements.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/landing-enhancements.tsx)). A Konami code toggles a brand-gradient colour mode. Post-processing adds bloom and an afterimage trail.

**The well-known "race car" version.** Same scene, earlier copy: hero "A web framework for building anything … `npx remix new` and you're off to the races", second section "Closing the gap between the initial spark and shipping" over the racecar model ([Wayback 2026-07-02](http://web.archive.org/web/20260702190517/https://remix.run/); original copy in [landing-content.tsx @ f595ecf](https://github.com/remix-run/remix-website/blob/f595ecf/app/controllers/home/landing-content.tsx)). It landed in [PR #441 "New Remix 3 homepage" (2026-04-30, +6,544 lines)](https://github.com/remix-run/remix-website/pull/441) and was explained in the blog post [A Brand New Remix (Tim Quirino, 2026-05-06)](https://remix.run/blog/brand-new): "If we were a racing team, then Remix 3 was meant to be a race car". Before that ([Wayback 2026-03-01](http://web.archive.org/web/20260301003808/https://remix.run/)) the page was a static teaser with a photo of a "Racecar under a black sheet with a Remix 3 logo" — no animation ([remix-history/hero-section.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/remix-history/hero-section.tsx)). The 2025 page ("Remix - Build Better Websites", [Wayback 2025-09-01](http://web.archive.org/web/20250901074550/https://remix.run/)) had no car at all.

## 2. Technique

- **Three.js 0.184** (`WebGLRenderer`, `Points` + `RawShaderMaterial`, `EffectComposer` → custom `BackgroundPass` → `RenderPass` → `AfterimagePass` → half-resolution `UnrealBloomPass`) — [engine.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/engine.ts), [particles.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/particles.ts), [package.json](https://github.com/remix-run/remix-website/blob/main/package.json).
- **GPGPU**: rest poses per preset are baked into float textures (`RestBaker`), and the vertex shader blends texture A/B by `uMorphT`; the mouse repulsion is a GPU displacement texture (`MouseSim`) — added in [PR #446 "Better webgl"](https://github.com/remix-run/remix-website/pull/446). The racetrack/drive shapes are pure GLSL ([preset-glsl.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/preset-glsl.ts), ~20 KB).
- **Models** are a custom `PTS1` binary: 36-byte header, then int16-quantised xyz per point (optional RGB bytes) — [model-loader.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/model-loader.ts). 600,036 bytes ⇒ exactly 100,000 points, no colours.
- **Scroll**: plain `window.addEventListener("scroll")` throttled through one `requestAnimationFrame`; no `animation-timeline`, no IntersectionObserver. `html { scroll-behavior: smooth }` ([home.css](https://github.com/remix-run/remix-website/blob/main/app/styles/public/home.css)).
- **CSS animation** is limited to the loading-overlay fade and a paused `@keyframes brand-cycle` on `:root` that JS advances at 10 Hz via `animationDelay` (home.css + landing-enhancements).
- The page is **Remix 3** (`remix@3.0.0-rc.1`, `remix/ui` components with `clientEntry`), not React Router.

## 3. Asset weight and runtime cost

Measured with `curl -I` on the live site (raw content-length, no encoding negotiated):

| Asset                                                                                 | Bytes    |
| ------------------------------------------------------------------------------------- | -------- |
| `three/build/three.module.js`                                                         | 354,852  |
| 4 postprocessing addons (EffectComposer, RenderPass, UnrealBloomPass, AfterimagePass) | ~15,400  |
| Landing modules (engine + components + utils, 29 files)                               | ~110,000 |
| Each `.pts` model (×4)                                                                | 600,036  |
| `remix-runner.avif` loading graphic                                                   | 5,262    |

Model loading: `racecar.pts` is `preloadEager`; other models fetch when the scroll morph is within 1.1 of their preset ([landing-enhancements.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/landing-enhancements.tsx)). Three is only fetched after hydration via `import("./components/particle-canvas.tsx")`.

Runtime ([PR #501](https://github.com/remix-run/remix-website/pull/501), [frame-governor.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/frame-governor.ts)):

- Main-thread rAF loop; heavy work on GPU. `DEFAULT_SETTINGS.particleCount = 160000`, halved when `(pointer: coarse)`, `hardwareConcurrency <= 4`, or `deviceMemory <= 4` ([types.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/engine/types.ts), particle-canvas `adaptiveParticleCount`).
- Capped at 60 fps active, 30 fps after 5 s without scroll/mouse; pixel ratio capped at 1.5; bloom at half resolution. Reported before/after on an M-series 120 Hz laptop: idle renders 120→30/s, idle CPU ~82%→~34% of one core.
- **Reduced motion** ([reduced-motion.ts](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/utils/reduced-motion.ts)): morph snaps to the nearest integer preset, intro is skipped, the loop re-renders only when a `morph|brandMode|size` key changes (effectively static), `scrollTo` uses `behavior: "auto"`, the loading `<picture>` serves a static PNG, and the brand-colour cycle stops.
- **Mobile / narrow**: canvas still renders (no mobile kill-switch), with the halved count; mouse sim only attaches when `(hover: hover) and (pointer: fine)`; resize is debounced 100 ms on touch devices; layout tweaks at ≤880px ([PR #444](https://github.com/remix-run/remix-website/pull/444)).
- **Fallback**: if WebGL lacks `EXT_color_buffer_float` the engine throws, `onError` dismisses the overlay and the SSR'd page stands on its own (engine.ts, landing-enhancements `markParticleCanvasFailed`).

## 4. SSR safety

Yes, by design. `HomePage` server-renders the hero, sections, footer and the loading overlay; `RemixLandingEnhancements` is a `clientEntry` whose WebGL work runs inside `handle.queueTask` after hydration and dynamically imports `particle-canvas.tsx` (the only module that touches `three`) — so `three` and `window` never execute on the server ([home.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/home.tsx), [landing-enhancements.tsx](https://github.com/remix-run/remix-website/blob/main/app/actions/public/remix-landing/landing-enhancements.tsx)). The React Router v7 equivalent is straightforward: SSR the content, mount a `<canvas>` in a `useEffect` with `await import("three")`, and keep all `matchMedia`/`navigator` reads inside that effect. One caveat visible in the live HTML: the black loading overlay is part of the SSR output, so with JS disabled the page stays covered — a port should render the overlay client-side or add a `<noscript>` hide.

## 5. Licensing

- The repository has **no LICENSE file** and GitHub reports `license: null` (`gh api repos/remix-run/remix-website`), so the code and assets default to all-rights-reserved; only `three` itself is MIT.
- The car artwork is derivative: "The 3D model I used in the particle visualization is built from a GLB file used for [Shopify Racing](https://racing.shop/), based on the ORECA LMP2 that Shopify founder-driver Tobi Lütke races in" — [A Brand New Remix](https://remix.run/blog/brand-new). The `.pts` files were added in [PR #441](https://github.com/remix-run/remix-website/pull/441). Treat the models, runner graphic and package-logo SVGs as Shopify/Remix brand assets; reuse the _technique_, not the files.
