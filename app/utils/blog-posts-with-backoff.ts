import { getCachedBlogPosts } from "./contentful-cache";

type BlogPosts = Awaited<ReturnType<typeof getCachedBlogPosts>>;

/** After a Contentful failure, serve without posts for this long before retrying. */
export const FAILURE_BACKOFF_MS = 5 * 60 * 1000;

let lastFailure: number | null = null;

/**
 * Blog posts for the machine-facing routes (sitemap, RSS). Crawlers and feed
 * readers poll these often, so a Contentful outage must not turn into a retry
 * on every request: after a failure the route degrades to "no posts" for
 * `FAILURE_BACKOFF_MS` without touching the API, then tries again.
 *
 * Returns `null` when posts are unavailable, whether from a fresh failure or
 * while backing off. Callers decide what a degraded document looks like.
 */
export async function getBlogPostsWithBackoff(now: number = Date.now()): Promise<BlogPosts | null> {
  if (lastFailure !== null && now - lastFailure < FAILURE_BACKOFF_MS) {
    return null;
  }

  try {
    const posts = await getCachedBlogPosts();
    lastFailure = null;
    return posts;
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    lastFailure = now;
    return null;
  }
}

export function __resetBackoffForTesting() {
  lastFailure = null;
}
