# Component Architecture

This document describes the component organization and patterns used throughout
the application.

## Component Organization

### Directory Structure

```
app/components/
├── ui/                 # shadcn/ui components
│   ├── button.tsx
│   ├── dialog.tsx
│   └── ...
├── icons/             # SVG icon components
│   ├── github.tsx
│   └── bluesky.tsx
├── app-sidebar/       # Feature components
│   ├── app-sidebar.tsx
│   └── index.ts
└── *.tsx              # Page-level components
```

### Component Categories

#### UI Components (`/ui`)

- Primitive, reusable components
- Sourced from shadcn/ui
- Highly customizable via props
- No business logic

#### Feature Components

- Business logic encapsulation
- Composed from UI components
- Route-specific functionality
- Data handling

#### Icon Components (`/icons`)

- SVG icons as React components
- Consistent sizing and styling
- Accessible with proper ARIA labels

## Component Patterns

### Composition Pattern

```tsx
// High-level component composing primitives
export function ProjectCard({ project }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <ProjectStats {...project} />
      </CardContent>
    </Card>
  )
}
```

### Variant Pattern

```tsx
// Using class-variance-authority
const variants = cva("base-classes", {
  variants: {
    size: {
      sm: "size-sm-classes",
      md: "size-md-classes",
    },
  },
})
```

### Compound Components

```tsx
// Sidebar with multiple sub-components
<SidebarProvider>
  <AppSidebar>
    <SidebarHeader />
    <SidebarContent />
    <SidebarFooter />
  </AppSidebar>
</SidebarProvider>
```

## State Management

### Local State

- `useState` for component-specific state
- `useReducer` for complex state logic

### Context Patterns

```tsx
// Sidebar state management
const SidebarContext = createContext<SidebarContextType>()

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) throw new Error("...")
  return context
}
```

### Route State

- Loader data via `useLoaderData()`
- URL state via `useSearchParams()`
- Navigation state via `useNavigation()`

## Component Guidelines

### TypeScript Integration

```tsx
// Strict prop typing
interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// Component definition
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // Implementation
  },
)
```

### Accessibility

- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Focus management

### Performance

```tsx
// Memoization where beneficial
const ExpensiveComponent = React.memo(({ data }) => {
  // Render logic
})

// Lazy loading for code splitting
const HeavyComponent = React.lazy(() => import("./HeavyComponent"))
```

## Component Examples

### Layout Components

```tsx
// Root layout with sidebar
export default function Root() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
```

### Data Display Components

```tsx
// Blog post list with loading states
export function BlogPostList({ posts }: Props) {
  if (!posts.length) {
    return <EmptyState />
  }

  return (
    <div className="grid gap-4">
      {posts.map(post => (
        <BlogPostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
```

### Interactive Components

```tsx
// Contact form with validation
export function ContactForm() {
  const [errors, setErrors] = useState({})

  return (
    <Form method="post">
      <Input
        name="email"
        type="email"
        required
        aria-invalid={errors.email ? "true" : undefined}
      />
      {errors.email && <ErrorMessage />}
      <Button type="submit">Send</Button>
    </Form>
  )
}
```

## Testing Approach

### Component Testing

- Unit tests for logic
- Integration tests for features
- Accessibility testing

### Testing Patterns

```tsx
// Testable component design
export function Component({ onClick, data }) {
  // Pure, predictable behavior
}
```

## Best Practices

1. **Single Responsibility**: Each component has one clear purpose
2. **Prop Validation**: TypeScript interfaces for all props
3. **Composition over Inheritance**: Use composition patterns
4. **Accessibility First**: Build with a11y in mind
5. **Performance Aware**: Optimize when measurable

## Related Documentation

- [Styling Architecture](./styling.md) - Component styling
- [Architecture Overview](./overview.md) - System design
- [shadcn/ui Decision](../decisions/shadcn-ui.md) - Component library choice
