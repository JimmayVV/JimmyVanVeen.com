# ADR 02: React 19

## Status

Accepted and implemented

## Context

We needed to choose a React version that provides:

- Latest performance optimizations
- Modern concurrent features
- Good TypeScript support
- Stability for production use

## Decision

We chose React 19 as our UI framework version.

## Rationale

### Pros

1. **React Compiler**: Automatic optimization without manual memoization
2. **Improved SSR**: Better streaming and hydration performance
3. **Concurrent Features**: Enhanced Suspense and transitions
4. **Better DevTools**: Improved debugging experience
5. **Smaller Bundle**: Optimized runtime size
6. **Future Ready**: Latest features and patterns

### Cons

1. **Bleeding Edge**: Newest version, potential undiscovered issues
2. **Library Compatibility**: Some libraries may not be updated
3. **Documentation**: Some features still being documented
4. **Breaking Changes**: Required updates from React 18

## Alternatives Considered

### React 18.3

- **Pros**: Stable, well-documented, broad compatibility
- **Cons**: Missing latest optimizations and features

### Preact

- **Pros**: Smaller bundle size, React compatible
- **Cons**: Missing advanced React features, smaller ecosystem

### Vue 3

- **Pros**: Great DX, built-in state management
- **Cons**: Different ecosystem, rewrite required

## Tradeoffs

### What We Gained

- Automatic performance optimizations via compiler
- Better SSR performance
- Latest React patterns and best practices
- Improved developer experience
- Future-proof codebase

### What We Sacrificed

- Some library compatibility (temporary)
- Potential early adopter issues
- Less community examples
- Some stability for innovation

## Implementation Notes

- React Compiler enabled via Babel plugin
- Strict mode enabled for best practices
- Using new JSX transform
- Leveraging Suspense for data fetching

## Performance Impact

- Reduced re-renders via compiler
- Faster hydration times
- Smaller JavaScript bundles
- Better memory usage

## Migration Considerations

From React 18:

- Update dependencies
- Fix any deprecated patterns
- Enable React Compiler
- Test thoroughly

## Dependencies

- ADR 01: TypeScript - Required for type safety with React 19

## Related ADRs

- ADR 03: Vite - Must support React 19 compilation
- ADR 04: React Router v7 - Built for React 19 features
- ADR 07: shadcn/ui - Components must be React 19 compatible

## Related Documentation

- [Component Architecture](../architecture/components.md)
- [Architecture Overview](../architecture/overview.md)
