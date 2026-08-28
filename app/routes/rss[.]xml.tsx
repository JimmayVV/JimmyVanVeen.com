import { getBlogPostsWithBackoff } from "~/utils/blog-posts-with-backoff";
import { type FeedPost, buildRssFeed } from "~/utils/rss.server";

/**
 * Full-text RSS 2.0 feed of the blog. A resource route: no component, the
 * loader returns the XML document directly. Advertised from the root
 * `<link rel="alternate">` and the site footer.
 */
export async function loader() {
  const entries = await getBlogPostsWithBackoff();
  const degraded = entries === null;

  const posts: FeedPost[] = (entries ?? [])
    .filter(
      (entry) =>
        entry?.fields?.slug && entry.fields.title && entry.fields.body && entry.fields.publishDate,
    )
    .map((entry) => ({
      title: entry.fields.title,
      slug: entry.fields.slug,
      body: entry.fields.body,
      publishDate: entry.fields.publishDate,
      description: entry.fields.description ?? undefined,
      author: entry.fields.author ?? undefined,
    }));

  return new Response(buildRssFeed(posts), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Match the sitemap: an hour normally, five minutes when serving an
      // empty feed while Contentful is unavailable so readers recover quickly.
      "Cache-Control": degraded ? "public, max-age=300" : "public, max-age=3600",
    },
  });
}
