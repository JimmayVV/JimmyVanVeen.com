# ADR 08: Contentful CMS

## Status

Accepted and implemented

## Context

We needed a content management solution for:

- Blog posts with rich text
- Project metadata
- Dynamic content updates
- Non-technical content editing

## Decision

We chose Contentful as our headless CMS.

## Rationale

### Pros

1. **Developer Friendly**: Excellent API and SDKs
2. **Rich Text Support**: Powerful editor with customization
3. **Content Modeling**: Flexible content types
4. **API Performance**: Fast CDN-backed APIs
5. **Free Tier**: Generous for small projects
6. **Versioning**: Content version history
7. **Webhooks**: Trigger rebuilds on content changes

### Cons

1. **Vendor Lock-in**: Proprietary platform
2. **Learning Curve**: Content modeling concepts
3. **API Limits**: Rate limiting on free tier
4. **Export Limitations**: Harder to migrate away

## Alternatives Considered

### Markdown Files (Git-based)

- **Pros**: Version control, no vendor lock-in, free
- **Cons**: No UI for non-technical users, no rich editing

### Strapi (Self-hosted)

- **Pros**: Open source, full control, customizable
- **Cons**: Hosting required, maintenance overhead

### Sanity

- **Pros**: Real-time collaboration, flexible
- **Cons**: More complex, steeper learning curve

### WordPress Headless

- **Pros**: Familiar, extensive ecosystem
- **Cons**: Hosting required, security concerns

### Notion API

- **Pros**: Familiar interface, collaborative
- **Cons**: Not designed as CMS, limited API

## Tradeoffs

### What We Gained

- Professional content editing interface
- Structured content with validation
- Media management built-in
- API-first architecture
- Quick content updates
- Preview functionality

### What We Sacrificed

- Some vendor lock-in
- Monthly API call limits
- Less control over data
- Additional service dependency

## Implementation Details

### Content Types

```typescript
// Blog Post
{
  title: string
  slug: string
  publishDate: Date
  excerpt: string
  content: RichText
  tags: string[]
}

// Project
{
  name: string
  description: string
  githubUrl: string
  featured: boolean
}
```

### API Integration

- JavaScript SDK for data fetching
- Rich text renderer for content
- Type generation from content models
- Error handling for API limits

### Performance Strategy

1. Fetch data in route loaders
2. Cache responses appropriately
3. Handle rate limits gracefully
4. Optimize query fields

## Content Workflow

### Editorial Process

1. Create/edit in Contentful UI
2. Preview changes
3. Publish when ready
4. Webhook triggers rebuild
5. Site updates automatically

### Developer Workflow

1. Define content models
2. Generate TypeScript types
3. Query content in loaders
4. Render with React components

## Cost Considerations

### Free Tier Limits

- 2 locales
- 24 content types
- 5,000 records
- 50,000 API calls/month
- 10GB bandwidth

### Growth Path

- Predictable pricing tiers
- Easy upgrade process
- No surprise costs

## Migration Strategy

If needed:

1. Export content via API
2. Transform to new format
3. Import to new system
4. Update API integration

## Dependencies

- ADR 04: React Router v7 - Content fetched via route loaders
- ADR 05: Netlify - Contentful webhooks trigger Netlify rebuilds

## Related ADRs

- ADR 09: GitHub API - Complementary data source for projects

## Related Documentation

- [Data Fetching](../architecture/data-fetching.md)
- [Architecture Overview](../architecture/overview.md)
