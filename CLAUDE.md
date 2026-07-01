# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

This is Jimmy Van Veen's portfolio website built with React Router v7, featuring
a blog powered by Contentful CMS and GitHub API integration for project data.

## Development Commands

```bash
# Start development server (custom Express + Vite)
npm run dev

# Build for production
npm run build

# Linting and formatting
npm run lint
npm run lint:fix  # Fix auto-fixable issues
npm run format
npm run format:check

# Type generation and checking
npm run typecheck

# IMPORTANT: Always run lint:fix before committing
# The pre-commit hook will run these automatically, but run them manually
# during development to catch issues early

# Start local Netlify server
npm start
```

## CI/CD Pipeline

**GitHub Actions** automatically validates all code changes:

- **Triggers**: Every push to `main` and all pull requests
- **Pipeline**: ESLint → Prettier → TypeScript → Build
- **Environment**: Node.js v20 with test configuration
- **Dependabot**: Weekly dependency updates with auto-merge for patch/minor
  versions

**Quality Gates**: All CI checks must pass before merging to main.

## Dependency & Lockfile Hygiene

Hard-won lessons — follow these to avoid green-locally / red-in-CI loops:

- **Regenerate `package-lock.json` with the pinned Node/npm, not whatever is
  newest locally.**
  - CI and Netlify build on **Node 22 (npm 10)** — the version in `.nvmrc` /
    `netlify.toml`.
  - A newer npm (e.g. 11) dedupes transitive deps differently and writes a lock
    that npm 10's `npm ci` rejects with `Missing: <pkg> from lock file`.
  - It surfaces as a CI "Install dependencies" failure _and_ a Netlify
    deploy-preview failure, while `npm install`/`npm ci` still pass locally on
    the newer npm.
  - Before touching the lockfile, `nvm use` (reads `.nvmrc` → 22) or
    `npx npm@10 install`, then sanity-check with `npx npm@10 ci --dry-run`.
- **A broken lock can poison Netlify's build cache.** If a bad lock was pushed
  once, later good pushes may still fail install because Netlify reuses the
  cached state. Fix: **Clear cache and deploy** in the Netlify UI (or the
  `createSiteBuild` API with `clear_cache: true`), then re-trigger the preview.
- **Fetch before branching.** Dependabot auto-merges advance `origin/main`
  between sessions; branch from an up-to-date `main` so the inherited lockfile
  is current.

## Architecture

### Tech Stack

- **React Router v7** with SSR enabled
- **React 19** with TypeScript strict mode
- **Tailwind CSS v4** (no shadcn/ui — editorial design system in `app/app.css`)
- **Vite** for building and development
- **Contentful** for blog CMS
- **GitHub API** via Octokit for repository data

### Key Structure

- `app/root.tsx` - Application shell with global TopBar + editorial theme
- `app/routes.ts` - Route configuration (file-based routing)
- `app/utils/` - API integrations (Contentful, GitHub, email)
- `app/components/blog/` - Blog-specific components (post hero/footer, theme toggle, reading progress)
- `app/components/site/` - Site chrome (TopBar, Plate, ProjectRow)
- `server/app.ts` - Netlify Functions entry point
- `config/` - Configuration files (eslint, prettier, env, build scripts)

### Data Flow

- Route loaders fetch data from Contentful CMS and GitHub API
- Type-safe data consumption throughout the app
- Suspense boundaries for loading states
- Error boundaries for graceful failures

## Environment Variables

Environment files are located in `config/env/` directory.

### Server-side Variables (Node.js)

Available via `process.env.*` in server code only - **NOT** exposed to client:

- `CONTENTFUL_SPACE_ID` - Contentful space
- `CONTENTFUL_ACCESS_TOKEN` - Contentful Delivery API token (published content)
- `CONTENTFUL_PREVIEW_TOKEN` - Contentful Preview API token (drafts + published)
- `CONTENTFUL_PREVIEW` - Set to `"true"` to switch the client to the Preview API so draft entries render. Intended for local dev and Netlify deploy previews; leave unset (or `"false"`) in production.
- `GITHUB_TOKEN` - GitHub API token
- `EMAIL_SERVICE` - Email service provider
- `EMAIL_ADDRESS` - Contact email address
- `EMAIL_APP_PASSWORD` - Email service app password (secret)
- `RECAPTCHA_SECRET_KEY` - ReCaptcha secret key (secret)
- `GA4_MEASUREMENT_ID` - Google Analytics 4 Measurement ID
- `GA4_API_SECRET` - GA4 Measurement Protocol API Secret
- `GA4_DEBUG` - Enable detailed GA4 payload logging (set to "true" for debugging)

### Client-side Variables (Browser)

Must be prefixed with `JVV_` and accessed via `import.meta.env.*` - **EXPOSED** to client:

- `JVV_ALLOW_EMAILS` - Enable/disable contact form
- `JVV_RECAPTCHA_SITE_KEY` - ReCaptcha public key

All environment variables are properly typed in `app/vite-env.d.ts` for TypeScript safety.

## Key Patterns

### TypeScript Conventions

- **Never use `as` type assertions.** They are banned in this project — an
  `as` assertion tells the compiler to trust you instead of proving the type,
  which is exactly where runtime bugs hide. Instead:
  - Narrow with a **type guard** (`function isX(v: unknown): v is X`)
  - **Validate/parse** untyped input (e.g. `request.json()`, `formData.get`,
    `process.env`) at the boundary before use
  - Use **`satisfies`** to check a value against a type without widening it
  - `as const` is fine — it is a const assertion, not a type assertion
- Enforcement is layered: an ESLint rule
  (`@typescript-eslint/consistent-type-assertions`) fails CI, and a Claude Code
  PreToolUse hook (`.claude/hooks/no-as-assertion.mjs`) blocks edits that
  introduce one.

### Component Organization

- Editorial design system lives in `app/app.css` (CSS custom properties + scoped class system)
- Two themes — paper (light) and midnight ink (dark) — via `.dark .editorial-theme`
- Path alias `~/*` maps to `app/` directory
- Typography: Newsreader (display), Source Serif 4 (body), JetBrains Mono (code), Fraunces italic (drop cap, blog-only)

### Content Management

- Blog posts managed via Contentful with rich text rendering
- GitHub repositories filtered by Node ID in `github.ts:88`
- Project metadata stored in Contentful, code data from GitHub API

### Deployment

- Netlify hosting with custom build preparation script
- SSR via Netlify Functions
- Build process includes React Router typegen

## Notable Implementation Details

- Custom dev server at `server/dev-server.js` wraps Vite with Express (uses ESM imports)
- Blog header includes animated marquee of recent posts
- Rate limiting and retry logic in GitHub API integration
- Type generation runs automatically during builds
- Configuration files organized in `config/` directory for cleaner root

## Git Workflow Guidelines

### Commit Messages

- NEVER add Claude signatures or co-author lines to git commit messages
- NEVER add Claude Code signatures to PR descriptions or any other content
- Keep commit messages concise and descriptive

### Communication Style

- Use singular first person ("I") when writing on behalf of the user
- This is a solo project, not a team effort
- Avoid using "we" or "our" in issues, PRs, or documentation

### Branch Naming

Always use organized branch prefixes that correlate with GitHub issue types:

**Format**: `<type>/<issue-number>-<short-description>` or
`<type>/<short-description>`

**Branch Types**:

- `feature/` - New features and functionality
- `enhancement/` - Improvements to existing features
- `fix/` - Bug fixes and corrections
- `hotfix/` - Urgent production fixes
- `refactor/` - Code restructuring without functionality changes
- `test/` - Adding or updating tests
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks, dependency updates, tooling
- `ci/` - CI/CD pipeline changes
- `security/` - Security-related fixes and improvements
- `perf/` - Performance optimizations

**Examples**:

```bash
feature/67-prettier-setup
fix/sidebar-mobile-responsive
docs/architecture-decision-records
chore/dependency-updates
```

### Workflow

- Always create appropriately named feature branches
- Reference GitHub issue numbers when applicable
- Use descriptive branch names that indicate the work being done

### Branch Creation Examples

When creating branches, use commands like:

```bash
# For new features
git checkout -b feature/issue-number-description

# For bug fixes
git checkout -b fix/issue-number-description

# For documentation
git checkout -b docs/topic-description

# For maintenance
git checkout -b chore/task-description
```

### GitHub Issue Correlation

- Ensure branch names align with GitHub issue labels
- Reference issue numbers in branch names when applicable
- Use consistent naming that makes work tracking easy
