# Architecture Overview

This document provides a high-level overview of the JimmyVanVeen.com
architecture.

## System Architecture

The application is built as a modern React application with Server-Side
Rendering (SSR) capabilities, deployed on Netlify's edge infrastructure.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Contentful    │     │   GitHub API    │     │  Email Service  │
│      CMS        │     │                 │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │    React Router v7      │
                    │     (SSR Enabled)       │
                    │                         │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    │   Netlify Functions     │
                    │    (Edge Runtime)       │
                    │                         │
                    └─────────────────────────┘
```

## Key Components

### Frontend Layer

- **Framework**: React 19 with TypeScript
- **Routing**: React Router v7 with file-based routing
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **State Management**: React Context for sidebar state
- **Build Tool**: Vite with custom development server

### Backend Layer

- **Runtime**: Netlify Functions (AWS Lambda)
- **SSR**: React Router server-side rendering
- **API Integration**: Direct API calls from route loaders

### Data Layer

- **Content**: Contentful CMS for blog posts and project metadata
- **Code Projects**: GitHub API for repository information
- **Contact**: Email service integration

### Development Layer

- **AI Assistant**: Claude Code for accelerated development
- **Code Quality**: ESLint, Prettier, and TypeScript for consistency
- **Version Control**: Git with feature branch workflow
- **CI/CD**: Automated deployments via Netlify

## Core Principles

1. **Type Safety**: Strict TypeScript throughout the application
2. **Performance**: SSR for fast initial loads, code splitting for efficiency
3. **Developer Experience**: Hot module replacement, automatic type generation,
   AI-assisted development
4. **Maintainability**: Clear separation of concerns, modular architecture
5. **Quality**: Automated code quality checks and comprehensive documentation

## Directory Structure

```
/
├── app/                    # Application source code
│   ├── components/        # React components
│   ├── routes/           # Route components
│   ├── utils/            # Utilities and API clients
│   └── root.tsx          # Application root
├── server/               # Server-side code
├── docs/                 # Documentation
├── public/               # Static assets
└── build/                # Build output
```

## Related Documentation

- [Routing Architecture](./routing.md) - Detailed routing implementation
- [Data Fetching](./data-fetching.md) - API integration patterns
- [Component Architecture](./components.md) - Component organization
- [Development Workflow](./development-workflow.md) - AI-assisted development
  process
- [Deployment Architecture](./deployment.md) - Production deployment
