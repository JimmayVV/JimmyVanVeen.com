# Styling Architecture

This document describes the styling approach using Tailwind CSS v4 and shadcn/ui
components.

## Overview

The application uses a utility-first CSS approach with Tailwind CSS v4,
complemented by shadcn/ui for pre-built accessible components. This combination
provides rapid development with consistent design patterns.

## Tailwind CSS v4

### Configuration

- Native CSS with `@tailwind` directives
- No `tailwind.config.js` needed
- CSS variables for theming
- PostCSS integration via Vite

### Key Features Used

- Container queries
- CSS Grid utilities
- Animation utilities
- Custom color palette
- Responsive design utilities

### File Structure

```
app/
├── app.css          # Main CSS file with Tailwind directives
└── components/
    └── ui/          # Component-specific styles
```

## shadcn/ui Components

### Component Library

Located in `app/components/ui/`:

- `button.tsx` - Button variants
- `dialog.tsx` - Modal dialogs
- `sidebar.tsx` - Sidebar navigation
- `carousel.tsx` - Image carousels
- `tooltip.tsx` - Hover tooltips

### Component Architecture

```typescript
// Example component with variants
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "variant-classes",
      destructive: "variant-classes",
    },
    size: {
      default: "size-classes",
      sm: "size-classes",
    },
  },
})
```

### Customization Approach

1. Copy component from shadcn/ui
2. Modify styles using Tailwind utilities
3. Extend with custom variants
4. Maintain accessibility features

## Styling Patterns

### Utility Classes

```tsx
// Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Container queries
<div className="@container">
  <div className="@lg:grid-cols-2">

// Animations
<div className="animate-fade-in">
```

### Component Composition

```tsx
// Combining utilities with component variants
<Button
  variant="outline"
  size="sm"
  className="hover:scale-105 transition-transform"
>
```

### Theme Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  /* ... other variables */
}
```

## Responsive Design

### Breakpoint Strategy

- Mobile-first approach
- Tailwind default breakpoints
- Container queries for component-level responsiveness

### Layout Patterns

```tsx
// Sidebar layout with mobile toggle
<SidebarProvider>
  <AppSidebar />
  <main className="flex-1">
    <SidebarTrigger className="md:hidden" />
  </main>
</SidebarProvider>
```

## Performance Considerations

### CSS Optimization

1. **Purging**: Unused styles removed at build time
2. **Minification**: CSS minified in production
3. **Critical CSS**: Inlined by Vite
4. **Code Splitting**: Per-route CSS bundles

### Loading Strategy

- CSS loaded in document head
- Minimal runtime style calculations
- Hardware-accelerated animations

## Animation Patterns

### Tailwind Animations

```css
/* Custom animations in app.css */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Component Animations

- Page transitions
- Hover effects
- Loading states
- Micro-interactions

## Accessibility

### Built-in Features

- Focus indicators
- ARIA attributes in shadcn/ui
- Color contrast compliance
- Keyboard navigation

### Custom Enhancements

- Skip links
- Focus trapping in modals
- Screen reader announcements

## Development Workflow

### Adding Styles

1. Use Tailwind utilities first
2. Create component variants for reusable patterns
3. Extract to CSS for complex animations
4. Document custom utilities

### Style Debugging

- Browser DevTools integration
- Tailwind IntelliSense in VS Code
- CSS source maps in development

## Related Documentation

- [Component Architecture](./components.md) - Component patterns
- [Tailwind CSS v4 Decision](../decisions/tailwind-v4.md) - Framework choice
- [shadcn/ui Decision](../decisions/shadcn-ui.md) - Component library choice
