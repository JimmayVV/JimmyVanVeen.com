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
npm run format
npm run format:check

# Type generation and checking
npm run typecheck

# Start local Netlify server
npm start
```

## CI/CD Pipeline

**GitHub Actions** automatically validates all code changes:

- **Triggers**: Every push to `master` and all pull requests
- **Pipeline**: ESLint → Prettier → TypeScript → Build
- **Environment**: Node.js v20 with test configuration
- **Dependabot**: Weekly dependency updates with auto-merge for patch/minor
  versions

**Quality Gates**: All CI checks must pass before merging to master.

## Architecture

### Tech Stack

- **React Router v7** with SSR enabled
- **React 19** with TypeScript strict mode
- **Tailwind CSS v4** with shadcn/ui components
- **Vite** for building and development
- **Contentful** for blog CMS
- **GitHub API** via Octokit for repository data

### Key Structure

- `app/root.tsx` - Application shell with sidebar provider
- `app/routes.ts` - Route configuration (file-based routing)
- `app/utils/` - API integrations (Contentful, GitHub, email)
- `app/components/ui/` - shadcn/ui component library
- `server/app.ts` - Netlify Functions entry point

### Data Flow

- Route loaders fetch data from Contentful CMS and GitHub API
- Type-safe data consumption throughout the app
- Suspense boundaries for loading states
- Error boundaries for graceful failures

## Environment Variables

Prefix custom environment variables with `JVV_`:

- `CONTENTFUL_SPACE_ID` - Contentful space
- `CONTENTFUL_ACCESS_TOKEN` - Contentful API token
- `GITHUB_TOKEN` - GitHub API token
- Email service configuration

## Key Patterns

### Component Organization

- UI components follow shadcn/ui patterns with Radix primitives
- Responsive sidebar layout with mobile collapse
- CSS Grid for project displays
- Path alias `~/*` maps to `app/` directory

### Content Management

- Blog posts managed via Contentful with rich text rendering
- GitHub repositories filtered by Node ID in `github.ts:88`
- Project metadata stored in Contentful, code data from GitHub API

### Deployment

- Netlify hosting with custom preparation script
- SSR via Netlify Functions
- Build process includes React Router typegen

## Notable Implementation Details

- Custom dev server at `dev-server.js` wraps Vite with Express
- Blog header includes animated marquee of recent posts
- Rate limiting and retry logic in GitHub API integration
- Type generation runs automatically during builds

## Git Workflow Guidelines

### Commit Messages

- NEVER add Claude signatures or co-author lines to git commit messages
- Keep commit messages concise and descriptive

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
