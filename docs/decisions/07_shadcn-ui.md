# ADR 07: shadcn/ui Component Library

## Status

Accepted and implemented

## Context

We needed a component library that provides:

- High-quality, accessible components
- Customization flexibility
- TypeScript support
- Modern React patterns
- No vendor lock-in

## Decision

We chose shadcn/ui as our component library approach.

## Rationale

### Pros

1. **Copy-Paste Approach**: Full control over components
2. **Accessibility**: WCAG compliant components using Radix UI
3. **Customization**: Modify any aspect of components
4. **No Dependencies**: Components become part of your codebase
5. **TypeScript First**: Excellent type safety
6. **Tailwind Integration**: Perfect compatibility with our CSS framework
7. **Modern Patterns**: Uses latest React best practices

### Cons

1. **Manual Updates**: No automatic component updates
2. **Initial Setup**: Need to copy components individually
3. **Maintenance**: Components need manual maintenance
4. **No CDN**: Can't load from external source

## Alternatives Considered

### Material-UI (MUI)

- **Pros**: Comprehensive, mature, Google design
- **Cons**: Heavy bundle, opinionated styling, harder customization

### Ant Design

- **Pros**: Feature-rich, enterprise-ready
- **Cons**: Large bundle, specific design language

### Chakra UI

- **Pros**: Good DX, accessible, themeable
- **Cons**: Runtime overhead, different styling approach

### Headless UI

- **Pros**: Unstyled, accessible, flexible
- **Cons**: More work to style, fewer components

### Build from Scratch

- **Pros**: Full control, minimal code
- **Cons**: Time consuming, accessibility concerns

## Tradeoffs

### What We Gained

- Complete component ownership
- Zero runtime dependencies
- Perfect Tailwind integration
- Easy customization
- Learning opportunity
- No upgrade breaking changes

### What We Sacrificed

- Automatic updates
- Larger component ecosystem
- Community themes
- Built-in component documentation
- Some advanced components

## Implementation Approach

### Component Selection

Only copied needed components:

- Button
- Dialog (Sheet)
- Sidebar
- Navigation Menu
- Form inputs
- Carousel

### Customization Strategy

1. Copy base component
2. Modify styles with Tailwind
3. Add custom variants
4. Maintain accessibility

### File Organization

```
app/components/ui/
├── button.tsx
├── dialog.tsx
├── sidebar.tsx
└── ...
```

## Accessibility Benefits

- Radix UI primitives ensure ARIA compliance
- Keyboard navigation built-in
- Screen reader support
- Focus management

## Maintenance Strategy

1. Track shadcn/ui updates
2. Manually apply relevant improvements
3. Customize as needed
4. Document modifications

## Performance Impact

- No external dependencies
- Tree-shaking friendly
- Minimal bundle impact
- Components only as large as needed

## Developer Experience

- Familiar patterns
- Easy to understand code
- Quick customization
- Good TypeScript support

## Dependencies

- ADR 06: Tailwind CSS v4 - shadcn/ui components built with Tailwind
- ADR 01: TypeScript - Components have full TypeScript support
- ADR 02: React 19 - Components compatible with React 19

## Related ADRs

This decision enables rapid UI development that supports all other user-facing
features.

## Related Documentation

- [Component Architecture](../architecture/components.md)
- [Styling Architecture](../architecture/styling.md)
- [ADR 06: Tailwind CSS v4](./06_tailwind-v4.md)
