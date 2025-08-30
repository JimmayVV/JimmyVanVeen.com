# ADR 03: Vite Build Tool

## Status

Accepted and implemented

## Context

We needed a build tool that provides:

- Fast development experience
- Hot Module Replacement (HMR)
- TypeScript support
- Modern JavaScript features
- SSR capabilities
- Plugin ecosystem

## Decision

We chose Vite as our build tool and development server.

## Rationale

### Pros

1. **Lightning Fast**: Instant server start and HMR
2. **Native ESM**: Leverages browser ES modules in dev
3. **Framework Agnostic**: Works with React Router v7
4. **Built-in Features**: TypeScript, JSX, CSS modules
5. **Plugin Ecosystem**: Rich plugin availability
6. **Optimized Builds**: Rollup-based production builds
7. **SSR Support**: First-class server-side rendering

### Cons

1. **Different Dev/Prod**: Dev uses ESM, prod uses bundles
2. **Learning Curve**: Different from webpack
3. **Ecosystem Size**: Smaller than webpack
4. **Config Complexity**: SSR setup can be complex

## Alternatives Considered

### Webpack 5

- **Pros**: Mature, huge ecosystem, battle-tested
- **Cons**: Slower dev experience, complex configuration

### Parcel

- **Pros**: Zero config, fast
- **Cons**: Less control, smaller ecosystem

### esbuild

- **Pros**: Extremely fast, simple
- **Cons**: Limited features, no HMR

### Turbopack

- **Pros**: Next.js integration, very fast
- **Cons**: Beta, Next.js focused

### Rollup

- **Pros**: Great for libraries, tree-shaking
- **Cons**: Not ideal for applications, no dev server

## Tradeoffs

### What We Gained

- Instant development feedback
- Minimal configuration
- Modern development experience
- Excellent React Router integration
- Fast production builds
- Great plugin support

### What We Sacrificed

- Webpack ecosystem familiarity
- Some advanced webpack features
- Potential dev/prod parity issues
- Module federation capabilities

## Implementation Details

### Configuration

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
});
```

### Development Server

- Custom Express wrapper for SSR
- Vite middleware integration
- Hot module replacement
- Error overlay

### Build Process

1. Client build with Rollup
2. Server build for SSR
3. Asset optimization
4. Code splitting

## Performance Impact

### Development

- Sub-second server start
- Instant HMR updates
- No bundling in development
- Lazy compilation

### Production

- Optimized bundles
- Tree-shaking
- Minification
- Asset optimization

## Plugin Ecosystem Used

1. **@netlify/vite-plugin-react-router**: React Router integration
2. **vite-tsconfig-paths**: Path alias support
3. **vite-plugin-babel**: React Compiler support
4. **@tailwindcss/vite**: Tailwind CSS v4

## Developer Experience

### Benefits

1. Fast feedback loop
2. Clear error messages
3. Built-in TypeScript
4. CSS hot reload
5. Optimized builds

### Challenges

1. Different from webpack
2. Some plugin compatibility
3. SSR configuration
4. Dev/prod differences

## Future Considerations

- Monitor Vite ecosystem growth
- Evaluate new features
- Consider Vite 6+ improvements
- Watch for React Router updates

## Dependencies

- ADR 01: TypeScript - Vite must support TypeScript compilation
- ADR 02: React 19 - Vite must support React 19 features

## Related ADRs

- ADR 04: React Router v7 - Requires Vite plugin for React Router
- ADR 06: Tailwind CSS v4 - Uses Vite plugin for CSS processing
- ADR 05: Netlify - Vite build output deployed to Netlify

## Related Documentation

- [Architecture Overview](../architecture/overview.md)
- [Deployment Architecture](../architecture/deployment.md)
