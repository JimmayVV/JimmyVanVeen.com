# ADR 10: ESLint & Prettier for Code Quality

## Status

Accepted and implemented

## Context

We needed tooling to:

- Maintain consistent code style
- Catch potential bugs early
- Enforce best practices
- Automate code formatting
- Support team collaboration

## Decision

We chose ESLint for linting and Prettier for formatting, with integration
between them.

## Rationale

### ESLint Choice

#### Pros

1. **Extensible**: Rich plugin ecosystem
2. **Configurable**: Fine-grained rule control
3. **TypeScript Support**: Via typescript-eslint
4. **React Specific**: React hooks and refresh plugins
5. **Auto-Fix**: Can fix many issues automatically
6. **IDE Integration**: Excellent editor support

#### Cons

1. **Configuration Complexity**: Many options to consider
2. **Performance**: Can be slow on large codebases
3. **Rule Conflicts**: Potential conflicts between plugins

### Prettier Choice

#### Pros

1. **Opinionated**: Minimal configuration needed
2. **Consistent**: Eliminates style debates
3. **Auto-Format**: Formats on save
4. **Language Support**: Handles multiple file types
5. **Integration**: Works with ESLint
6. **Import Sorting**: Via Trivago plugin

#### Cons

1. **Less Flexible**: Limited customization
2. **Opinionated Defaults**: May not match preferences
3. **Potential Conflicts**: With ESLint formatting rules

## Alternatives Considered

### Biome (formerly Rome)

- **Pros**: All-in-one tool, very fast
- **Cons**: Less mature, smaller ecosystem

### StandardJS

- **Pros**: Zero configuration
- **Cons**: No flexibility, no TypeScript

### TSLint (Deprecated)

- **Pros**: TypeScript focused
- **Cons**: Deprecated in favor of ESLint

### No Automated Tools

- **Pros**: Full control
- **Cons**: Inconsistent code, manual work

## Implementation Details

### ESLint Configuration

```javascript
// Flat config with TypeScript
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  prettierConfig, // Prettier integration
  {
    rules: {
      "prettier/prettier": "error",
      // Custom rules...
    },
  },
);
```

### Prettier Configuration

```javascript
export default {
  semi: true,
  trailingComma: "all",
  singleQuote: false,
  importOrder: [
    /* ... */
  ],
  plugins: ["@trivago/prettier-plugin-sort-imports"],
};
```

### Pre-commit Integration

- Husky for Git hooks
- lint-staged for staged files
- Automatic formatting on commit

## Tradeoffs

### What We Gained

- Consistent code style across team
- Automated formatting
- Early bug detection
- Import organization
- Reduced code review friction
- Better code quality

### What We Sacrificed

- Some formatting flexibility
- Initial setup time
- Build time increase
- Learning curve for rules

## Workflow Impact

### Development Flow

1. Write code with IDE assistance
2. ESLint shows issues in real-time
3. Prettier formats on save
4. Pre-commit ensures quality
5. CI/CD validates on push

### Team Benefits

- No style debates
- Consistent codebase
- Easier onboarding
- Reduced review time
- Fewer bugs

## Performance Considerations

### Optimizations

1. Lint only changed files (lint-staged)
2. Cache ESLint results
3. Parallel linting in CI
4. Ignore generated files

### IDE Integration

- VS Code ESLint extension
- Prettier extension
- Format on save
- Real-time feedback

## Rules Philosophy

### ESLint Rules

- Start with recommended
- Add TypeScript strict rules
- React specific rules
- Disable style rules (Prettier handles)

### Prettier Options

- Minimal configuration
- Team agreement on basics
- Consistency over preferences

## Future Enhancements

- Custom ESLint rules
- Performance monitoring
- Additional plugins
- Automated rule updates

## Dependencies

- ADR 01: TypeScript - ESLint configured for TypeScript support
- ADR 03: Vite - Integrated into Vite development workflow
- ADR 06: Tailwind CSS v4 - Prettier formats Tailwind classes

## Related ADRs

This decision supports code quality across all other technical decisions.

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [ADR 01: TypeScript](./01_typescript.md)
