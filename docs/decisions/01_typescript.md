# ADR 01: TypeScript with Strict Mode

## Status

Accepted and implemented

## Context

We needed to decide on:

- Whether to use TypeScript or JavaScript
- Level of type safety enforcement
- Configuration approach

## Decision

We chose TypeScript with strict mode enabled and comprehensive type checking.

## Rationale

### Pros

1. **Type Safety**: Catch errors at compile time
2. **Developer Experience**: Excellent IDE support and IntelliSense
3. **Refactoring**: Confident code changes with type checking
4. **Documentation**: Types serve as inline documentation
5. **Team Scalability**: Easier onboarding and collaboration
6. **Error Prevention**: Eliminates entire classes of runtime errors

### Cons

1. **Build Step**: Requires compilation
2. **Learning Curve**: Additional syntax to learn
3. **Verbosity**: More code to write initially
4. **Build Time**: Type checking adds to build time

## Alternatives Considered

### JavaScript with JSDoc

- **Pros**: No build step, gradual typing
- **Cons**: Limited type safety, poor refactoring support

### JavaScript (No Types)

- **Pros**: Simple, no build step
- **Cons**: No type safety, more runtime errors

### Flow

- **Pros**: Similar benefits to TypeScript
- **Cons**: Smaller ecosystem, less tooling support

## Configuration Choices

### Strict Mode Enabled

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "strictFunctionTypes": true
}
```

### Project-Wide Type Checking

- ESLint with TypeScript parser
- Type checking in CI/CD
- Pre-commit type validation

## Tradeoffs

### What We Gained

- Robust type safety across the codebase
- Confident refactoring capabilities
- Self-documenting code
- Early error detection
- Better IDE experience

### What We Sacrificed

- Initial development speed
- Additional build complexity
- Learning curve for new developers
- Some JavaScript library compatibility

## Implementation Notes

### Type Generation

- React Router route types auto-generated
- API response types from schemas
- Component prop types inferred

### Gradual Adoption Path

- Started with `strict: false`
- Gradually enabled strict checks
- Fixed type errors incrementally

## Best Practices Adopted

1. Avoid `any` type usage
2. Prefer interfaces over type aliases
3. Use generic types for reusability
4. Leverage type inference where possible
5. Document complex types

## Impact on Development

### Positive

- Fewer runtime errors in production
- Easier code reviews
- Better team collaboration
- Confident deployments

### Challenges

- Initial setup time
- Learning curve for team
- Some library type definitions needed
- Occasional type gymnastics

## Dependencies

This is a foundational decision that influences all subsequent ADRs.

## Related ADRs

- ADR 02: React 19 - TypeScript support was a factor
- ADR 03: Vite - TypeScript integration required
- ADR 04: React Router v7 - Type generation capabilities
- ADR 10: ESLint & Prettier - TypeScript-aware linting

## Related Documentation

- [Component Architecture](../architecture/components.md)
- [Data Fetching](../architecture/data-fetching.md)
