# ADR 04: React Router v7

## Status

Accepted and implemented

## Context

We needed a routing solution that provides:

- Server-Side Rendering (SSR) capabilities
- File-based routing
- Type-safe navigation
- Modern React features support
- Good developer experience

## Decision

We chose React Router v7 as our routing framework.

## Rationale

### Pros

1. **Native SSR Support**: Built-in server-side rendering without additional
   configuration
2. **File-Based Routing**: Intuitive route organization with automatic code
   splitting
3. **Type Safety**: Full TypeScript support with route type generation
4. **Data Loading**: Powerful loader pattern for data fetching
5. **Framework Alignment**: Natural evolution from React Router v6
6. **Streaming SSR**: Support for React 19's streaming features
7. **Developer Experience**: Hot module replacement, great error boundaries

### Cons

1. **Newer Framework**: Less community resources compared to Next.js
2. **Learning Curve**: New patterns for developers familiar with v6
3. **Ecosystem**: Smaller ecosystem compared to Next.js
4. **Documentation**: Still evolving as framework matures

## Alternatives Considered

### Next.js 14/15

- **Pros**: Mature ecosystem, large community, Vercel integration
- **Cons**: App Router complexity, vendor lock-in concerns, heavier framework

### Remix (React Router v6)

- **Pros**: Proven SSR capabilities, stable API
- **Cons**: React Router v7 is the evolution of Remix

### Vite + React (SPA)

- **Pros**: Simple setup, fast development
- **Cons**: No SSR, requires additional routing library

## Tradeoffs

### What We Gained

- Modern SSR with minimal configuration
- Excellent TypeScript integration
- Progressive enhancement by default
- Lightweight framework overhead
- Future-proof with React 19 features

### What We Sacrificed

- Mature ecosystem of Next.js
- Some advanced features (ISR, Image optimization)
- Larger community support
- Battle-tested patterns

## Implementation Notes

- Custom development server wraps Vite
- Netlify Functions handle SSR
- Route-based code splitting automatic
- Type generation integrated in build

## Migration Path

If needed, migration paths exist:

- To Next.js: Route structure similar, loader pattern translatable
- To Remix: Essentially the same (Remix merged into React Router)
- To SPA: Remove SSR layer, keep routing

## Dependencies

- ADR 01: TypeScript - Required for route type generation
- ADR 02: React 19 - React Router v7 built for React 19
- ADR 03: Vite - Requires Vite plugin for React Router

## Related ADRs

- ADR 05: Netlify - Must support React Router SSR
- ADR 08: Contentful - Data fetched via route loaders
- ADR 09: GitHub API - API calls made from route loaders

## Related Documentation

- [Routing Architecture](../architecture/routing.md)
- [Architecture Overview](../architecture/overview.md)
