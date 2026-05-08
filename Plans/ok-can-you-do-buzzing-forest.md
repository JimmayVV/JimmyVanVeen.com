# Blog Redesign — Editorial, Typography-First

## Context

The current blog ([app/routes/blog/$slug.tsx](app/routes/blog/$slug.tsx), [app/routes/blog/blog-index.tsx](app/routes/blog/blog-index.tsx)) is functional but generic: black background, Source Sans 3 / Raleway, a hero pattern banner, dark-only `prose-invert` with `tracking-wider leading-7`, and `vscDarkPlus` code highlighting. Jimmy wants a blog that reads like a beautifully typeset book — better than Medium — with perfect leading, a serif body face, gorgeous code, and proper light/dark modes that are both responsive and editorial-grade on desktop and mobile.

Goal: redesign the blog **list** ([blog-index.tsx](app/routes/blog/blog-index.tsx)) and **post** ([$slug.tsx](app/routes/blog/$slug.tsx)) views as a single cohesive reading experience built around long-form prose. The rest of the site (home, projects, sidebar) stays unchanged; the blog gets its own visual identity inside the existing `SidebarInset`.

---

## Aesthetic Direction — "Quiet Editorial"

Think _The New York Review of Books_ meets _Robin Sloan's Year of the Meteor_ meets a well-made hardback. Restrained. Confident. Built around one thing: the sentence.

**Differentiator**: a true book-grade reading column with optical-size typography, a real paper-toned light mode, and a code block that sits inside the page instead of fighting it. No banners, no gradients, no card-on-card. Just a measure, a margin, and ink.

### Type system

Three Google Fonts (variable, free, all support the optical/weight axes used):

| Role                                    | Family                                          | Why                                                                                                                                                  |
| --------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display (titles, drop cap, pull quotes) | **Fraunces** (variable: `wght`, `opsz`, `SOFT`) | Characterful display serif with a true `opsz` axis — at 144pt it grows refined ball terminals; gives the page a literary signature without screaming |
| Body (running text)                     | **Source Serif 4** (variable: `wght`, `opsz`)   | Designed by Adobe for long reading; humanist serif with a real text optical size at 8–18pt and a display cut for blockquotes                         |
| Mono (code, captions, dateline)         | **JetBrains Mono** (variable: `wght`)           | Designed for code; reads cleanly at small sizes; holds up under the editorial color palette                                                          |

Loaded via existing `<link>` block in [app/root.tsx](app/root.tsx), replacing the current Raleway / Source Sans 3 entries. Old `--font-sans` / `--font-raleway` tokens stay in [app.css](app/app.css) (the home and projects pages still use them) — new tokens added alongside: `--font-display: Fraunces`, `--font-serif: "Source Serif 4"`, `--font-mono: "JetBrains Mono"`.

### Color system — paper & ink

Two true themes, not a tinted inversion. Each is built from a single warm hue so the page feels printed rather than emitted.

**Light — "paper"**

- Background: `#F7F4EC` (warm off-white, ~paper)
- Surface (code blocks, rule lines): `#EFEAE0`
- Ink (body): `#1C1A17`
- Muted (dateline, captions): `#6E665B`
- Accent (links, drop cap, marginalia): `#7A2E1F` (oxblood) — a single sharp accent, used sparingly

**Dark — "midnight ink"**

- Background: `#13110F` (not pure black; soft ink)
- Surface: `#1C1916`
- Ink (body): `#E8E2D5` (warm cream, not white — the body of a hardback under lamp light)
- Muted: `#928876`
- Accent: `#D98B6E` (warm terracotta, the night-shifted oxblood)

Implemented as CSS variables scoped to a new `.blog-theme` class on the blog layout root, plus `.dark .blog-theme` for the dark variant. This keeps the rest of the site (which uses the existing `--background` / `--foreground` tokens) untouched.

### Type scale (modular, 1.250 minor third)

Sized in `rem`. Body is the anchor at `1.125rem` (18px) with `line-height: 1.7` and `letter-spacing: -0.003em`. Measure capped at **66ch** (≈ 33em) — the sweet spot for a serif text size.

| Element                    | Family                       | Size                       | Leading | Notes                                                                                                                                                                                                                                                           |
| -------------------------- | ---------------------------- | -------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Article title (post)       | Fraunces 144 opsz, 600       | clamp(2.4rem, 5vw, 3.8rem) | 1.05    | Tight tracking, balanced wrap                                                                                                                                                                                                                                   |
| Article title (index list) | Fraunces 96 opsz, 500        | 1.875rem                   | 1.15    | One per row                                                                                                                                                                                                                                                     |
| Section heading (h2)       | Fraunces 36 opsz, 600        | 1.75rem                    | 1.2     | Top margin = 2.5em; first one tight under hero                                                                                                                                                                                                                  |
| Sub-heading (h3)           | Source Serif 4 italic, 600   | 1.375rem                   | 1.3     | Small caps optional                                                                                                                                                                                                                                             |
| Body                       | Source Serif 4 12 opsz, 400  | 1.125rem                   | 1.7     | Paragraphs separated by `1.1em` vertical margin (web/Medium convention). No first-line indent. Familiar and scannable                                                                                                                                           |
| Pull quote / blockquote    | Fraunces 72 opsz italic, 400 | 1.5rem                     | 1.35    | No quote marks; left rule in accent color, generous padding                                                                                                                                                                                                     |
| Drop cap                   | Fraunces 144 opsz, 700       | 4 lines tall               | —       | Only on first paragraph of **long posts** (≥400 words). Estimated client-side from `blog.fields.body` length and applied via a `data-long` attribute on the `<article>` so the CSS rule (`article[data-long] > p:first-of-type::first-letter`) handles the rest |
| Dateline / metadata        | JetBrains Mono, 500          | 0.78rem                    | 1.4     | Uppercase, `letter-spacing: 0.12em`                                                                                                                                                                                                                             |
| Code (block)               | JetBrains Mono 400           | 0.92rem                    | 1.6     | Sits in a `--surface` block, no scroll-shadow, line numbers in `--muted`                                                                                                                                                                                        |
| Code (inline)              | JetBrains Mono 500           | 0.92em                     | inherit | Subtle `--surface` background, 2px radius, no border                                                                                                                                                                                                            |

### Layout

- **Sidebar**: hidden on all `/blog/*` routes on desktop and mobile. The blog gets a chrome-free, full-width reading layout. Implemented by detecting blog routes in [app/root.tsx](app/root.tsx) (or in [app/routes/blog/layout.tsx](app/routes/blog/layout.tsx) via `useSidebar().setOpen(false)` plus a `data-blog-route` flag on the body that hides the `<AppSidebar>` and `<AppHeader>` components via CSS). The hamburger / theme toggle replace them in a slim top bar.
- **Reading column**: max-width `66ch`, centered in the now-full viewport. Outer padding `clamp(1.25rem, 5vw, 3rem)`. No card chrome around it.
- **Hero (post)**: dateline (mono small caps) → title (Fraunces, large) → dek (Source Serif 4 italic, muted). Hairline rule below. No image banner.
- **Hero (index)**: a single short editorial intro, then a vertical list of posts as `<article>` rows — title, dek, dateline. Hover: title shifts to accent color, no underline jump.
- **Sidenotes (desktop ≥ 1100px)**: `<aside class="marginalia">` floats into the right margin (Tufte-style). On mobile they collapse inline as muted italic blocks. Optional — used only when a post includes them.
- **Reading progress**: 1px hairline at the very top of the post, accent color, scaled by `scrollYProgress`. CSS-only via `animation-timeline: scroll()` where supported, with a tiny JS fallback.
- **Theme toggle**: small icon button anchored top-right of the blog layout (above the reading column on desktop, in the existing header on mobile). Sun / moon, single SVG, 200ms ease.
- **Footer of post**: hairline rule → mono dateline → previous/next post pair (title + arrow). No social, no "subscribe" CTA.

### Code blocks

The biggest visible upgrade. Replace `vscDarkPlus` with a custom Prism token theme defined as CSS variables that respond to the active theme. Two themes, hand-tuned to the paper/midnight palettes:

- **Light**: surface `#EFEAE0`, comment `#9A8E7A` italic, keyword `#7A2E1F`, string `#3E6B3A`, function `#2A4A6B`, number `#8C5A1E`
- **Dark**: surface `#1C1916`, comment `#7A7060` italic, keyword `#D98B6E`, string `#9DBE8A`, function `#8DA9C4`, number `#D9B375`

Block treatment: `--surface` background, `12px` radius, `1.25em 1.5em` padding, mono-rendered file label in the top-right (when `language-` class includes `:filename`). Line numbers `--muted`, no separator. No copy button by default (it's editorial; minimal chrome).

Implementation: keep `react-syntax-highlighter` (already installed), but pass a custom `style` object built from CSS variables. This requires a tiny module — `app/utils/code-theme.ts` — that exports the Prism style map keyed to `var(--syntax-*)`. Tokens are defined once in [app.css](app/app.css) under both themes.

### Motion

Restrained. One choreography on post load:

1. Dateline fades in (0ms, 200ms duration)
2. Title rises 8px and fades in (80ms delay)
3. Dek fades in (200ms delay)
4. Hairline rule expands from left to full width (320ms delay, 400ms duration)
5. Body fades in (400ms delay)

CSS keyframes only. No JS, no Motion library. Disabled under `prefers-reduced-motion`.

Hover states: links reveal an underline that grows from left (already in [app.css](app/app.css) — keep the pattern, recolor to accent). Theme toggle: 180° rotation on click.

---

## Files to change

### New

- `app/components/blog/reading-progress.tsx` — 1px scroll-bound hairline (CSS `animation-timeline` + JS fallback)
- `app/components/blog/theme-toggle.tsx` — sun/moon button; persists choice in `localStorage` and toggles `.dark` on `<html>`
- `app/components/blog/post-hero.tsx` — dateline + title + dek + rule, with the load choreography
- `app/components/blog/post-footer.tsx` — hairline + dateline + prev/next
- `app/components/blog/marginalia.tsx` — `<aside>` for optional sidenotes
- `app/utils/code-theme.ts` — Prism token theme bound to CSS vars
- `app/utils/reading-time.ts` — simple `wordsPerMinute = 220` estimator from markdown body

### Modified

- [app/routes/blog/layout.tsx](app/routes/blog/layout.tsx) — wrap children in `<div class="blog-theme">`; mount `<ThemeToggle>` and `<ReadingProgress>` (reading progress conditional on post route); hide the global `<AppSidebar>` and `<AppHeader>` for blog routes (via `useSidebar` + a `data-blog-route` flag on `document.body`); render a slim blog-only top bar with home link + theme toggle
- [app/routes/blog/blog-index.tsx](app/routes/blog/blog-index.tsx) — replace the current `ContentCard` grid with the editorial list (title, dek, dateline, hairline between rows)
- [app/routes/blog/$slug.tsx](app/routes/blog/$slug.tsx) — remove `<GradientBanner>` and `<ContentCard>`; render `<PostHero>` + `<article class="prose-editorial">` + `<PostFooter>`. Pass custom Prism style to `SyntaxHighlighter`
- [app/app.css](app/app.css) — add `--font-display / --font-serif / --font-mono`, the `.blog-theme` light + dark token blocks, the `.prose-editorial` styles (replacing the `#blogContent` rules — those rules were tuned for the old Source Sans body and will fight the new serif), the syntax token vars, the load-choreography keyframes
- [app/root.tsx](app/root.tsx) — swap the Google Fonts `<link>` lines from Raleway + Source Sans 3 to **also include** Fraunces + Source Serif 4 + JetBrains Mono. The old families stay loaded because home/projects still use them. Use `display=swap` and the `&text=` trick for Fraunces display weights only at the sizes used.

### Reused (no change)

- `react-markdown` + `rehype-external-links` rendering pipeline in `$slug.tsx` — only the `components` map and surrounding chrome change
- [app/utils/contentful-cache.ts](app/utils/contentful-cache.ts) — same data shape
- The existing external-link `↗` indicator in [app.css](app/app.css) — keep, but scope inside `.prose-editorial` so the new accent color inherits correctly

---

## Theme toggle — persistence

- On mount: read `localStorage.theme` ∈ `"light" | "dark" | null`; if null, use `matchMedia("(prefers-color-scheme: dark)")`
- Apply by toggling `.dark` on `<html>` (matches the existing `@custom-variant dark (&:is(.dark *))` in [app.css](app/app.css:5))
- A small inline script in [app/root.tsx](app/root.tsx) `<head>` sets the class **before** hydration to avoid a flash. Pattern: read storage, set class synchronously
- Toggle scope: although the toggle is mounted only on blog pages, it sets the global `.dark` class — so a user who picks light mode on the blog gets light mode everywhere. This is the right behavior; the rest of the site already has light/dark token blocks (currently unused) and will inherit cleanly. Verify the home/projects pages don't break in light mode during the build-out

---

## Responsive behavior

- **Mobile (<640px)**: padding `1.25rem`, body `1.0625rem` (17px), title `2.4rem`, no marginalia (collapsed inline), drop cap kept (3 lines instead of 4), code blocks edge-to-edge with `-mx-5` bleed
- **Tablet (640–1099px)**: padding `2rem`, body `1.125rem`, marginalia inline
- **Desktop (≥1100px)**: padding `3rem`, marginalia floated right at `-18em` offset, reading column still capped at `66ch` (the page widens but the measure does not)
- **Wide (≥1400px)**: same as desktop; no expansion of measure. Editorial discipline > filling the screen

---

## Delivery

All work lands on a feature branch and is opened as a pull request against `main` for review. No direct commits to `main`. Branch name: `feature/blog-editorial-redesign`. The PR description summarizes the aesthetic direction, lists the new components, and links to this plan file.

## Verification

1. `npm run dev` and visit `/blog` — confirm the editorial list renders, dateline is mono small caps, hover state shifts title to accent
2. Visit a single post (`/blog/<slug>`) — confirm hero choreography, drop cap, body leading feels like a book, code block uses the new theme with file label and proper token colors
3. Toggle theme — confirm both themes feel printed (warm, not stark), no FOUC on reload, choice persists
4. Mobile: Chrome devtools at 375px — confirm no horizontal scroll, code blocks bleed cleanly, marginalia inline
5. Desktop ≥1400px — confirm the measure does not expand past 66ch even though screen does
6. `npm run lint` and `npm run typecheck` clean
7. Visit `/` and `/projects` in light mode — confirm nothing on the rest of the site visually breaks (the existing `--background` / `--foreground` tokens already have a light variant in [app.css](app/app.css:56-92), so this should be a no-op, but verify)
8. `prefers-reduced-motion: reduce` — confirm load choreography is skipped
9. Read a real post end-to-end on a real phone — does it feel like something you'd want to read? That is the actual test

---

## Out of scope (not in this plan)

- Search, tags, archive index, RSS feed redesign
- Reading-time badge (mentioned in `reading-time.ts` above only because it's trivial; can be cut if it adds clutter)
- Migrating away from `react-markdown` to MDX
- Footnote system beyond `<aside class="marginalia">`
- Image treatment beyond `<figure>` + `<figcaption>` styling (we'll add basic figure styling but no lightbox / lazy loading work)
