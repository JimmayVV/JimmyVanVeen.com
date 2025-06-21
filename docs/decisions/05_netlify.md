# ADR 05: Netlify Hosting Platform

## Status

Accepted and implemented

## Context

We needed a hosting platform that provides:

- Server-Side Rendering support
- Global CDN distribution
- Automatic deployments
- Serverless functions
- Good developer experience

## Decision

We chose Netlify as our hosting and deployment platform.

## Rationale

### Pros

1. **SSR Support**: Native support via Netlify Functions
2. **Deploy Previews**: Automatic PR previews
3. **Global CDN**: Edge network for static assets
4. **Serverless Functions**: AWS Lambda integration
5. **Git Integration**: Automatic deployments
6. **Developer Experience**: Excellent CLI and UI
7. **Generous Free Tier**: Perfect for portfolio sites

### Cons

1. **Vendor Lock-in**: Some Netlify-specific features
2. **Function Limitations**: 10-second timeout on free tier
3. **Cold Starts**: Serverless function latency
4. **Limited Compute**: Not suitable for heavy processing

## Alternatives Considered

### Vercel

- **Pros**: Next.js creators, excellent DX, edge functions
- **Cons**: More expensive, Next.js optimized

### AWS Amplify

- **Pros**: AWS integration, scalable
- **Cons**: Complex setup, steeper learning curve

### Cloudflare Pages

- **Pros**: Excellent performance, Workers
- **Cons**: Less mature SSR support

### Self-Hosted (VPS)

- **Pros**: Full control, customizable
- **Cons**: Maintenance overhead, no CDN

### GitHub Pages

- **Pros**: Free, simple
- **Cons**: Static only, no SSR

## Tradeoffs

### What We Gained

- Zero-config deployments
- Automatic SSL certificates
- Built-in CI/CD pipeline
- Preview deployments for PRs
- Global performance
- Integrated analytics
- Form handling

### What We Sacrificed

- Some vendor lock-in
- Serverless limitations
- Less control over infrastructure
- Function timeout limits

## Implementation Details

### Deployment Setup

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build/client"

[[redirects]]
  from = "/*"
  to = "/.netlify/functions/server"
  status = 200
```

### Function Configuration

- React Router SSR handler
- Environment variable support
- Automatic function bundling

### Performance Features

- Automatic asset optimization
- Brotli compression
- HTTP/2 push
- Edge caching

## Cost Analysis

### Free Tier Includes

- 100GB bandwidth/month
- 300 build minutes/month
- Serverless functions
- SSL certificates
- Deploy previews

### Growth Path

- Easy upgrade for more resources
- Predictable pricing
- No surprise costs

## Developer Workflow

### Benefits

1. Git push to deploy
2. Instant rollbacks
3. Environment management
4. Team collaboration
5. Deploy notifications

### Local Development

- Netlify CLI for local testing
- Function emulation
- Environment variable injection

## Monitoring & Analytics

- Built-in analytics
- Function logs
- Error tracking
- Performance monitoring

## Migration Considerations

If needed, relatively easy to migrate:

- Standard Node.js functions
- Build artifacts portable
- Environment variables standard

## Dependencies

- ADR 04: React Router v7 - Netlify must support SSR via Functions
- ADR 03: Vite - Netlify builds and deploys Vite output

## Related ADRs

- ADR 08: Contentful - Content changes trigger Netlify rebuilds
- ADR 09: GitHub API - API calls made from Netlify Functions

## Related Documentation

- [Deployment Architecture](../architecture/deployment.md)
- [Architecture Overview](../architecture/overview.md)
