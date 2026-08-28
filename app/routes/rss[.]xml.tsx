import { getCachedBlogPosts } from "~/utils/contentful-cache";
import { type FeedPost, buildRssFeed } from "~/utils/rss.server";

/**
 * Full-text RSS 2.0 feed of the blog. A resource route: no component, the
 * loader returns the XML document directly. Advertised from the root
 * `<link rel="alternate">` and the site footer.
 */
export async function loader() {
  let posts: FeedPost[] = [];
  let degraded = false;

  try {
    const entries = await getCachedBlogPosts();
    posts = entries
      .filter(
        (entry) =>
          entry?.fields?.slug &&
          entry.fields.title &&
          entry.fields.body &&
          entry.fields.publishDate,
      )
      .map((entry) => ({
        title: entry.fields.title,
        slug: entry.fields.slug,
        body: entry.fields.body,
        publishDate: entry.fields.publishDate,
        description: entry.fields.description ?? undefined,
        author: entry.fields.author ?? undefined,
      }));
  } catch (error) {
    console.error("Failed to fetch blog posts for RSS feed:", error);
    degraded = true;
  }

  return new Response(buildRssFeed(posts), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      // Match the sitemap: an hour normally, five minutes when serving an
      // empty feed after a Contentful failure so readers recover quickly.
      "Cache-Control": degraded ? "public, max-age=300" : "public, max-age=3600",
    },
  });
}
