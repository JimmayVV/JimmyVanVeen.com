# JimmyVanVeen.com Documentation

Welcome to the documentation for JimmyVanVeen.com. This documentation provides a
comprehensive overview of the application's architecture, design decisions, and
implementation details.

## Architecture Documentation

### Core Architecture

- [Architecture Overview](./architecture/overview.md) - High-level system
  architecture
- [Routing Architecture](./architecture/routing.md) - React Router v7
  implementation
- [Data Fetching](./architecture/data-fetching.md) - Content management and API
  integration
- [Styling Architecture](./architecture/styling.md) - Tailwind CSS v4 and
  component styling
- [Component Architecture](./architecture/components.md) - Component
  organization and patterns
- [Development Workflow](./architecture/development-workflow.md) - AI-assisted
  development process
- [Deployment Architecture](./architecture/deployment.md) - Netlify deployment
  and SSR

## Architecture Decision Records (ADRs)

### Template

- [ADR 00: Template](./decisions/00_template.md) - Template for new ADRs

### Foundational Decisions

- [ADR 01: TypeScript](./decisions/01_typescript.md) - TypeScript with strict
  mode
- [ADR 02: React 19](./decisions/02_react-19.md) - React 19 adoption and
  benefits
- [ADR 03: Vite](./decisions/03_vite.md) - Build tool and development server

### Framework Decisions

- [ADR 04: React Router v7](./decisions/04_react-router-v7.md) - SSR-enabled
  routing
- [ADR 05: Netlify](./decisions/05_netlify.md) - Hosting platform for SSR

### Styling Decisions

- [ADR 06: Tailwind CSS v4](./decisions/06_tailwind-v4.md) - Utility-first CSS
  framework
- [ADR 07: shadcn/ui](./decisions/07_shadcn-ui.md) - Copy-paste component
  library

### Data Management Decisions

- [ADR 08: Contentful](./decisions/08_contentful.md) - Headless CMS for content
- [ADR 09: GitHub API](./decisions/09_github-api.md) - Dynamic project data

### Development Quality Decisions

- [ADR 10: ESLint & Prettier](./decisions/10_linting-formatting.md) - Code
  quality and formatting
- [ADR 11: Claude Code](./decisions/11_claude-code.md) - AI-assisted development
  workflow

## Getting Started

If you're looking to understand or replicate parts of this architecture:

1. Start with the [Architecture Overview](./architecture/overview.md)
2. Read the relevant decision documents for technologies you're interested in
3. Dive into specific architecture documents for implementation details

## Contributing

When adding new features or making architectural changes:

1. Update relevant architecture documentation
2. Create or update decision documents for significant technology choices
3. Ensure all cross-references between documents remain valid
