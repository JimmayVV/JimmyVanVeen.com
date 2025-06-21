# Deployment Architecture

This document describes the deployment setup using Netlify with Server-Side
Rendering (SSR).

## Overview

The application is deployed on Netlify's infrastructure with SSR capabilities
via Netlify Functions. This provides a globally distributed deployment with edge
computing capabilities.

## Build Pipeline

### Build Process

```bash
# Build command
npm run build

# Which runs:
1. react-router build      # Builds client and server bundles
2. node netlify/prepare.js # Prepares Netlify deployment
```

### Build Output

```
build/
├── client/           # Client-side assets
│   ├── assets/      # JS/CSS bundles
│   └── index.html   # Fallback HTML
├── server/          # Server bundle
└── .netlify/
    └── functions/   # Netlify Functions
        └── server.mjs
```

## Netlify Configuration

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "build/client"

[dev]
  command = "npm run dev"
  port = 5173

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

### Environment Variables

- Set in Netlify UI
- Available during build and runtime
- Prefixed with `JVV_` for custom vars

## SSR Implementation

### Server Entry Point

```typescript
// server/app.ts
import { createRequestHandler } from "@react-router/netlify"

export default createRequestHandler({
  build: await import("./build/server/index.js"),
})
```

### Request Flow

1. User requests URL
2. Netlify routes to Function
3. React Router handles SSR
4. HTML + Data sent to client
5. Client hydrates React app

## Performance Features

### Edge Caching

- Static assets cached at edge
- Function responses cached with headers
- Instant cache invalidation on deploy

### Asset Optimization

- Automatic compression (gzip/brotli)
- Image optimization
- Code splitting per route
- Preload directives for critical resources

### Global Distribution

- Functions deployed to multiple regions
- Automatic geographic routing
- Low latency worldwide

## Deployment Process

### Continuous Deployment

1. Push to GitHub
2. Netlify webhook triggered
3. Build process starts
4. Tests run (if configured)
5. Deploy to production
6. Old version kept for rollback

### Preview Deployments

- Every PR gets preview URL
- Full SSR functionality
- Isolated environment
- Shareable links

## Monitoring & Analytics

### Built-in Monitoring

- Function execution logs
- Error tracking
- Performance metrics
- Traffic analytics

### Custom Monitoring

```typescript
// Function wrapper for monitoring
export default async (req, context) => {
  const start = Date.now()
  try {
    const response = await handler(req, context)
    // Log success metrics
    return response
  } catch (error) {
    // Log error metrics
    throw error
  }
}
```

## Security

### Environment Protection

- Secrets never in client bundle
- Server-only environment access
- Secure headers configured

### DDoS Protection

- Rate limiting
- Geographic restrictions (if needed)
- Automatic scaling

## Development Workflow

### Local Development

```bash
# Mimics Netlify environment
npm start

# Runs Netlify CLI locally
# Provides Function emulation
# Environment variable injection
```

### Deployment Commands

```bash
# Deploy to production
git push origin main

# Deploy preview
git push origin feature-branch

# Manual deploy
netlify deploy --prod
```

## Rollback Strategy

### Instant Rollbacks

- One-click in Netlify UI
- Previous builds retained
- Zero downtime
- Atomic deployments

### Version Management

- Each deploy has unique ID
- Can pin to specific deploy
- A/B testing capabilities

## Cost Optimization

### Function Efficiency

- Minimize cold starts
- Optimize bundle size
- Cache responses when possible
- Use edge functions for simple logic

### Bandwidth Management

- Efficient caching headers
- Compressed responses
- Optimized images
- CDN for static assets

## Troubleshooting

### Common Issues

1. **Function timeouts**: Optimize data fetching
2. **Large bundles**: Check dependencies
3. **Environment variables**: Verify in Netlify UI
4. **Build failures**: Check build logs

### Debug Tools

- Netlify CLI for local testing
- Function logs in dashboard
- Deploy previews for testing
- Build plugins for custom logic

## Related Documentation

- [Architecture Overview](./overview.md) - System design
- [Routing Architecture](./routing.md) - SSR implementation
- [Netlify Decision](../decisions/netlify.md) - Platform choice
