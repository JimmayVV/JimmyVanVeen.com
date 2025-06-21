# ADR 06: Tailwind CSS v4

## Status

Accepted and implemented

## Context

We needed a CSS solution that provides:

- Rapid development capabilities
- Consistent design system
- Small production bundle size
- Good developer experience
- Modern CSS features

## Decision

We chose Tailwind CSS v4 as our styling framework.

## Rationale

### Pros

1. **Native CSS**: No configuration file needed, uses CSS directly
2. **Performance**: Smaller runtime, better tree-shaking
3. **Container Queries**: First-class support for modern CSS
4. **Developer Experience**: Instant feedback, great IDE support
5. **Consistency**: Enforces design system constraints
6. **Utility-First**: Rapid prototyping and development

### Cons

1. **Alpha Version**: Still in development
2. **Breaking Changes**: API differs from v3
3. **Learning Curve**: Utility classes approach
4. **HTML Verbosity**: Long class strings

## Alternatives Considered

### Tailwind CSS v3

- **Pros**: Stable, extensive documentation, plugins
- **Cons**: Requires configuration, larger runtime

### CSS Modules

- **Pros**: Component scoping, no runtime
- **Cons**: More boilerplate, less rapid development

### Styled Components/Emotion

- **Pros**: CSS-in-JS benefits, dynamic styles
- **Cons**: Runtime overhead, complexity

### Vanilla CSS

- **Pros**: No dependencies, full control
- **Cons**: No design system, more maintenance

## Tradeoffs

### What We Gained

- Lightning-fast development speed
- Consistent spacing and colors
- Responsive design utilities
- Modern CSS features (container queries)
- Minimal runtime overhead
- Automatic unused CSS removal

### What We Sacrificed

- Semantic class names
- Traditional CSS organization
- Some customization flexibility
- Stability of v3

## Implementation Details

### Configuration Approach

```css
/* app.css */
@import "tailwindcss";
```

### Design Tokens

- CSS variables for theming
- Consistent color palette
- Standardized spacing scale
- Typography system

### Performance Optimizations

- PostCSS for processing
- PurgeCSS built-in
- Minimal runtime CSS
- Efficient class generation

## Developer Workflow

### Benefits

1. Immediate visual feedback
2. No context switching
3. Consistent patterns
4. Easy responsive design
5. Component extraction when needed

### Challenges

1. Initial learning curve
2. Long class attributes
3. Remembering utility names
4. Semantic meaning in markup

## Integration with shadcn/ui

- Perfect compatibility
- Consistent design language
- Easy customization
- Shared utility classes

## Future Considerations

- Monitor v4 stability
- Potential migration to stable
- Custom plugin needs
- Design system evolution

## Dependencies

- ADR 03: Vite - Uses Vite plugin for CSS processing

## Related ADRs

- ADR 07: shadcn/ui - Component library built for Tailwind
- ADR 10: ESLint & Prettier - Prettier formats Tailwind classes

## Related Documentation

- [Styling Architecture](../architecture/styling.md)
- [Component Architecture](../architecture/components.md)
- [ADR 07: shadcn/ui](./07_shadcn-ui.md)
