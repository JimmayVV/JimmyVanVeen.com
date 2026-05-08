# Cohesive Site Editorial Pass — Round 2

## Context

PR #303 redesigned the blog as a typography-first reading experience. Reviewing the deploy preview, two things are clear:

1. The **rest of the site doesn't match**. The home page (mission statement on a racing-photo background + dark project cards + persistent left sidebar) feels like a different application from the blog. The contrast highlights how generic the home actually is.
2. Inside the blog itself, the **Fraunces ampersand** in "Notes & field reports." reads as ugly — Fraunces' default `&` is one of its most polarizing glyphs. Headlines should switch to a more restrained editorial face. Pull quotes and drop cap can keep Fraunces, where its character is an asset.

Goal: make the **whole site feel like one publication** — same palette, same type voice, same chrome, same theme toggle behavior. Add a hero photograph treatment to the home page (editorial-grade, not background-image-y), allow photographs sparingly elsewhere as "plates," and replace the existing sidebar with the slim top bar already proven on the blog.

This is a separate, second PR on top of (or after merging) `feature/blog-editorial-redesign`. Branch: `feature/cohesive-editorial-pass`.

---

## Decisions (locked from your answers)

| Question | Decision |
|---|---|
| Home concept | Editorial + hero photo |
| Sidebar | Replace with slim top bar site-wide |
| Photographs | Sparingly, treated as plates |
| Display face | Switch headlines to **Newsreader** (Fraunces only for italic pull quotes + drop cap) |

---

## Type system — revised

| Role | Family | Notes |
|---|---|---|
| Display (all H1, index intro, brand) | **Newsreader** (variable: `wght`, `opsz`, italic) | Restrained editorial serif, well-drawn `&`, true `opsz` axis. Replaces Fraunces for headlines. |
| Body | **Source Serif 4** | Unchanged. |
| Italic accent (pull quotes, drop cap) | **Fraunces** italic 72/144 opsz | Kept only where its character earns it. Not used for headlines, not used in the brand. |
| Mono | **JetBrains Mono** | Unchanged. |

Action: add Newsreader to the Google Fonts URL in [app/root.tsx](app/root.tsx). Add `--font-newsreader` token in [app/app.css](app/app.css). Update `.blog-post-hero h1`, `.blog-index-intro`, `.blog-index-row .title`, and `.prose-editorial h2/h3` to use Newsreader. Keep `.prose-editorial blockquote` and the drop cap on Fraunces.

---

## Site chrome — slim top bar everywhere

Currently the sidebar lives in [app/root.tsx](app/root.tsx) `Template`, except blog routes which I bypassed in PR #303. New approach: **remove the sidebar entirely**. Every page renders inside the same shell:

```
┌─ blog-topbar (sticky, hairline-bottom) ─────────────────┐
│  ← JIMMY VAN VEEN     Home · Projects · Blog       ☀  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│            [reading column / page content]               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

- **Brand** (left): `← JIMMY VAN VEEN` in mono uppercase. On `/` it's just `JIMMY VAN VEEN` (no arrow, since you're already home).
- **Section nav** (center or left-aligned next to brand on desktop, hamburger sheet on mobile): three links — **Home**, **Projects**, **Blog** — in mono small caps. Active route gets accent underline.
- **Theme toggle** (right): same `<ThemeToggle>` already built. Now lives in the global top bar, available everywhere.

The existing `<AppSidebar>`, `<AppHeader>`, `<SidebarInset>`, and `<SidebarProvider>` get removed from `Template`. The blog layout's local top bar gets replaced by this global one. The sidebar plumbing in shadcn (`app/components/ui/sidebar.tsx`) stays in the codebase for now (low risk to leave it; a separate cleanup PR can delete it if you want).

Files touched:
- [app/root.tsx](app/root.tsx) — strip sidebar shell from `Template`, mount global top bar
- [app/routes/blog/layout.tsx](app/routes/blog/layout.tsx) — drop the local top bar (replaced by global)
- New: `app/components/site/top-bar.tsx` — the shared component, with section nav + theme toggle
- Existing `app/components/app-header.tsx`, `app/components/app-sidebar/*`, `app/components/header.tsx` — stop being mounted; left in place for now (don't delete in this PR — keeps the diff focused on what's visible)

---

## Site-wide theme (extending `.blog-theme`)

Currently `.blog-theme` is scoped to the blog. For cohesion, the editorial palette becomes the **site palette**. Two paths:

**Chosen path**: rename `.blog-theme` → `.editorial-theme` and apply it on `<html>` (or the top-level shell `<div>`). All pages get the paper/midnight-ink palette and the editorial fonts by default. The legacy `--background` / `--foreground` tokens stay so any unmigrated component still renders, but the default surface for every page becomes paper / midnight ink.

The home, projects, and blog all read from the same set of CSS variables. The theme toggle works everywhere because it sets `.dark` on `<html>` (already does).

---

## Home page — "Cover"

Replaces the current `mission-statement on racing photo + project cards` layout.

**Above the fold (desktop)**:
- Mono dateline: `JIMMY VAN VEEN · ENGINEER · DETROIT` (or whatever you want — placeholder copy you can edit)
- H1 in Newsreader, large: a single editorial line (e.g. *"I build software for the long form."* — placeholder, you tune the copy)
- Italic Source Serif 4 dek (1–2 lines)
- Hero photograph (the **plate**): single full-width-of-column image, treated editorially
  - Available on the right-hand side at desktop ≥1100px (asymmetric magazine layout) OR below the title at narrower widths
  - Subtle warm overlay / desaturation so it sits with the palette instead of fighting it
  - Caption beneath: small mono, e.g. `Plate I — Talladega, 2024`
  - **Source for the photo**: I'll use one of the existing images in [public/images/](public/images/) (talladega_glory.jpg is the one already in your CSS). Open question for you to answer in the PR review: which photo do you actually want here? I'll start with `talladega_glory.jpg` desaturated.

**Below the fold**:
1. **Section: "Recent writing"** — the same editorial list component the blog index uses, showing 3 most-recent posts. "All posts →" link at the bottom.
2. **Hairline rule** with `❦` ornament (already defined for `<hr>` in `.prose-editorial`).
3. **Section: "Selected work"** — projects rendered as editorial rows (not the dark cards). Title (Newsreader) + one-line dek + small mono link → live demo / source. 2–3 items, hand-picked. Eventually a "All projects →" link points to a redesigned `/projects`.
4. **Footer** — small mono links: GitHub, Bluesky, email. Hairline above.

This kills:
- `app/components/banner.tsx` (racing photo background as a hero pattern)
- `app/components/mission.tsx` and the all-caps mission statement block
- `app/components/content-cards.tsx` usage on home (the dark cards)

The components stay in the codebase but stop being rendered on home. Same minimal-blast-radius rule as the sidebar.

---

## Projects page

Currently `/projects` is rendered through the same dark-card pattern. Editorial pass:
- Same top bar
- Page title in Newsreader: `Projects.`
- Italic dek
- Hairline rule
- Each project = an editorial row (title, dek, mono links). Optional plate (project screenshot) per row, sparingly.
- Source data still comes from Contentful + GitHub via the existing utils — only the rendering changes.

For this PR I'll do projects in the **same shape as the home's "Selected work" section** — a single shared `<ProjectRow>` component used in both places. That keeps the abstraction tight.

---

## Photograph plate component

New: `app/components/site/plate.tsx`

```
<Plate src="..." alt="..." caption="Plate I — Talladega, 2024" credit?="..." />
```

Renders:
- A `<figure>` with the image, a hairline border in the rule color
- Subtle CSS treatment: `filter: saturate(0.85) contrast(1.02);` and a 1px inner border in `--blog-rule` for a printed feel. No drop shadow (those scream "PowerPoint").
- Caption in mono, `--blog-muted`, centered.

Used in:
- Home hero
- Inside blog posts when the markdown contains an image (override `react-markdown` `img` component to render through `<Plate>` when `alt` text is present)
- Optionally on project rows

---

## Theme toggle scope

Already global (sets `.dark` on `<html>`), already persists in `localStorage`. The change is just **where it's mounted**: instead of only being in the blog layout, it lives in the global top bar. Done by moving `<ThemeToggle>` into `<TopBar>` and removing it from `BlogLayout`.

---

## Files to change

### New
- `app/components/site/top-bar.tsx` — site-wide chrome (brand, section nav, theme toggle)
- `app/components/site/plate.tsx` — photograph treatment
- `app/components/site/project-row.tsx` — editorial project row (used on home + projects page)

### Modified
- [app/root.tsx](app/root.tsx) — load Newsreader; strip sidebar shell from `Template`; mount `<TopBar>`; apply `.editorial-theme` class on the wrapper
- [app/app.css](app/app.css) — add `--font-newsreader`; rename `.blog-theme` → `.editorial-theme` (or alias both); swap headline rules to Newsreader; add `<Plate>` styles, `<ProjectRow>` styles, top-bar nav-link styles (active state, hover)
- [app/routes/blog/layout.tsx](app/routes/blog/layout.tsx) — drop local top bar, just renders `<Outlet />` inside the `.editorial-theme` (or remove the wrapper since root provides it)
- [app/routes/blog/blog-index.tsx](app/routes/blog/blog-index.tsx) — fonts pick up Newsreader automatically; verify spacing
- [app/routes/blog/$slug.tsx](app/routes/blog/$slug.tsx) — override `react-markdown` `img` component → `<Plate>` when alt text present
- The home route file (need to read to confirm path — likely `app/routes/_index.tsx` or `app/routes/home.tsx`) — full rewrite to the cover layout
- The projects route file — replace dark cards with `<ProjectRow>` list

### Reused (no change)
- `<ThemeToggle>`, `<ReadingProgress>`, `<PostHero>`, `<PostFooter>` — already work
- `app/utils/contentful*`, `app/utils/github*` — data layer untouched
- `public/theme-init.js` — already global

### Stops being rendered (left in codebase)
- `app/components/app-header.tsx`, `app/components/app-sidebar/*`, `app/components/header.tsx`, `app/components/banner.tsx`, `app/components/mission.tsx`, `app/components/content-cards.tsx`, `app/components/gradient-banner.tsx`, `app/components/ui/sidebar.tsx`. Cleanup is a separate PR if you want it.

---

## Open questions for you

1. **Hero photo**: which image should I use as the home plate? Defaulting to `public/images/talladega_glory.jpg` (already in repo) desaturated. If you have a better one, drop a path.
2. **Home title copy**: I'll put a placeholder you can edit. Do you have a single line you want there, or want me to draft three options in the PR description for you to pick?
3. **Section nav order in top bar**: `Home · Projects · Blog` — sound right?
4. **Mobile top bar**: hamburger sheet vs. inline nav at small sizes? Default: inline (just brand + theme toggle, hide section nav under a small "≡ Menu" sheet under 640px).

---

## Verification

1. `npm run dev`. Visit `/`, `/projects`, `/blog`, `/blog/<slug>`. Every page has the same top bar, same palette, same fonts. The theme toggle is in the top bar everywhere. Toggling persists across navigation.
2. The Fraunces `&` no longer appears in any headline. Spot-check the blog index intro renders with Newsreader.
3. Home hero plate renders desaturated, with caption, and reflows below the title at <1100px.
4. Mobile (375px): top bar collapses cleanly; hero plate stacks under the title; recent writing section reads as the editorial list.
5. `npm run lint`, `npm run typecheck`, `npm run build` all clean.
6. Visit a blog post. If the post body contains an image, it renders through `<Plate>` with a caption from the alt text.
7. Sit with each page in both light and dark modes for 30 seconds. Does it feel like one publication? That's the actual test.

---

## Out of scope (deferred)

- Deleting the unused sidebar/banner/mission components (separate PR; leaves diff focused)
- Redesigning individual project cards (we render them as editorial rows; existing card components stay unrendered)
- Rewriting Contentful fetch logic
- Photography curation / new images — using existing `public/images/*`
- Fancier mobile nav (drawer/sheet animation) — defaulting to a simple inline sheet
