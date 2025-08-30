# Data Fetching Architecture

This document describes how data is fetched and managed across the application.

## Overview

Data fetching is handled through React Router v7's loader pattern, with
integrations to Contentful CMS and GitHub API. All data fetching happens in
route loaders, ensuring data is available before components render.

## Data Sources

### Contentful CMS

- Blog posts and content
- Project metadata
- Rich text content

### GitHub API

- Repository information
- Commit history
- Language statistics

### Email Service

- Contact form submissions
- Server-side email sending

## API Clients

### Contentful Client (`app/utils/contentful.ts`)

```typescript
const client = createClient({
  space: process.env.CONTENTFUL_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
});
```

Key functions:

- `getEntries()` - Fetch blog posts
- `getEntry()` - Fetch single post by slug
- Rich text rendering with `@contentful/rich-text-react-renderer`

### GitHub Client (`app/utils/github.ts`)

```typescript
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  throttle: {
    onRateLimit: //...,
    onSecondaryRateLimit: //...,
  },
});
```

Features:

- Rate limiting and retry logic
- Repository filtering by Node ID
- Caching considerations

### Email Client (`app/utils/mail.ts`)

- Nodemailer integration
- Server-side only execution
- Environment-based configuration

## Loader Pattern

### Basic Loader

```typescript
export async function loader() {
  const posts = await contentfulClient.getEntries({
    content_type: "blogPost",
    order: ["-fields.publishDate"],
  });

  return json({ posts });
}
```

### Error Handling

```typescript
export async function loader() {
  try {
    const data = await fetchData();
    return json({ data });
  } catch (error) {
    throw new Response("Not Found", { status: 404 });
  }
}
```

### Parallel Data Fetching

```typescript
export async function loader() {
  const [posts, repos] = await Promise.all([
    contentfulClient.getEntries(),
    githubClient.getRepositories(),
  ]);

  return json({ posts, repos });
}
```

## Type Safety

### Generated Types

- Contentful types from API responses
- GitHub API types from Octokit
- Route types from React Router

### Type Inference

```typescript
// Automatic type inference in components
export default function Route() {
  const { posts } = useLoaderData<typeof loader>();
  // posts is fully typed
}
```

## Performance Strategies

### Caching

1. **HTTP Caching**: Loader responses include cache headers
2. **In-Memory Caching**: GitHub API responses cached
3. **CDN Caching**: Netlify edge caching

### Optimization Techniques

- Parallel requests with `Promise.all()`
- Minimal data fetching (only required fields)
- Rate limit awareness
- Request deduplication

## SSR Considerations

### Server-Side Execution

- Loaders run on Netlify Functions
- Environment variables available server-side
- No client-side API keys exposed

### Client-Side Navigation

- Loaders re-run on client navigation
- Automatic request deduplication
- Progressive enhancement

## Error Boundaries

### Route-Level Errors

```typescript
export function ErrorBoundary() {
  const error = useRouteError();
  return <ErrorComponent error={error} />;
}
```

### Graceful Degradation

- Fallback UI for failed requests
- Retry mechanisms for transient failures
- User-friendly error messages

## Related Documentation

- [Architecture Overview](./overview.md) - System architecture
- [Routing Architecture](./routing.md) - Route loader integration
- [Contentful Decision](../decisions/contentful.md) - CMS choice
- [GitHub API Decision](../decisions/github-api.md) - Project data integration
