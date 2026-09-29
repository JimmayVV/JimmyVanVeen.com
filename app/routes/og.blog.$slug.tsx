import { getCachedBlogPostBySlug } from "~/utils/contentful-cache";

import type { Route } from "./+types/og.blog.$slug";

/**
 * The share card for one post, as a PNG. A resource route: the post page's
 * og:image points here whenever the post has no image of its own.
 *
 * An unknown slug is a 404 rather than a generic card, so a typo'd link can't
 * preview as a real post.
 */
export async function loader({ params }: Route.LoaderArgs) {
  let post: Awaited<ReturnType<typeof getCachedBlogPostBySlug>>;
  try {
    post = await getCachedBlogPostBySlug(params.slug);
  } catch (error) {
    // Logged because a Contentful outage lands here too, and would otherwise
    // 404 every card with nothing to point at why.
    console.error("Share card slug lookup failed", { slug: params.slug, error });
    return new Response("Not found", { status: 404 });
  }

  const { title, description, publishDate } = post.fields;
  // Loaded on demand so the renderer's WASM and fonts stay out of every other
  // route's startup, and a renderer failure can only break this route.
  let png: Uint8Array<ArrayBuffer>;
  try {
    const { renderShareCard } = await import("~/og/share-card.server");
    png = await renderShareCard({
      title,
      description: description || undefined,
      publishDate,
    });
  } catch (error) {
    // A render failure answers this request only; crawlers fall back to no image.
    console.error("Share card render failed", { slug: params.slug, error });
    return new Response("Render failed", { status: 500 });
  }

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      // Crawlers fetch the card once per share. A day is long enough to keep
      // the render off the hot path and short enough that a title fix shows up.
      "Cache-Control": "public, max-age=86400",
      // A cold render takes several seconds, longer than some crawlers wait.
      // Durable caching shares one render across every Netlify edge, so only
      // the first request after a deploy pays for it.
      "Netlify-CDN-Cache-Control": "public, durable, s-maxage=86400",
    },
  });
}
