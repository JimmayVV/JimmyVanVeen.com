# Routing Architecture

This document describes the routing implementation using React Router v7.

## Overview

The application uses React Router v7's file-based routing system with
Server-Side Rendering (SSR) support. Routes are defined in `app/routes.ts` and
implemented as individual route modules.

## Route Configuration

### File-Based Routes

Routes are configured in `app/routes.ts`:

```typescript
import { type RouteConfig } from "@react-router/dev/routes"

export default [
  index("routes/index.tsx"),
  route("404", "routes/404.tsx"),
  route("email", "routes/email.tsx"),
  layout("routes/blog/layout.tsx", [
    index("routes/blog/blog-index.tsx"),
    route(":slug", "routes/blog/$slug.tsx"),
  ]),
] satisfies RouteConfig
```

### Route Module Structure

Each route module exports:

- `loader` - Data fetching function (runs on server and client)
- `default` - React component
- `meta` - SEO metadata function
- `ErrorBoundary` - Error handling component (optional)

Example route module:

```typescript
export async function loader() {
  const data = await fetchData();
  return { data };
}

export default function Route() {
  const { data } = useLoaderData<typeof loader>();
  return <div>{/* Component JSX */}</div>;
}
```

## Key Routes

### Home (`/`)

- Displays portfolio overview
- Loads GitHub projects and featured content
- File: `app/routes/index.tsx`

### Blog (`/blog`)

- Blog index with post listing
- Individual post pages with dynamic slugs
- Files: `app/routes/blog/blog-index.tsx`, `app/routes/blog/$slug.tsx`

### Email (`/email`)

- Contact form with server-side email handling
- File: `app/routes/email.tsx`

### 404 Page

- Custom error page for unmatched routes
- File: `app/routes/404.tsx`

## Data Loading

### Loader Pattern

- Loaders run on both server and client
- Automatic request deduplication
- Built-in error boundaries

### Suspense Integration

- Route-level suspense boundaries
- Streaming SSR support
- Progressive enhancement

## Navigation

### Link Components

- Type-safe navigation with `<Link>` components
- Prefetching support
- Active link styling via `NavLink`

### Programmatic Navigation

- `useNavigate()` hook for imperative navigation
- Form-based navigation with `<Form>` component
- Search params management with `useSearchParams()`

## SSR Considerations

### Server Entry

- `server/app.ts` handles SSR requests
- Netlify Functions integration
- Request/response handling

### Hydration

- Automatic hydration on client
- Preserves server-rendered content
- Progressive enhancement

## Performance Optimizations

1. **Route Splitting**: Each route is code-split automatically
2. **Prefetching**: Links can prefetch route data
3. **Streaming**: SSR supports streaming for faster TTFB
4. **Caching**: Built-in HTTP caching headers

## Related Documentation

- [Architecture Overview](./overview.md) - System architecture
- [Data Fetching](./data-fetching.md) - Loader implementation details
- [React Router v7 Decision](../decisions/react-router-v7.md) - Why React Router
  v7
