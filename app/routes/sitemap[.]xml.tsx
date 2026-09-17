import { getBlogPostsWithBackoff } from "~/utils/blog-posts-with-backoff";
import { escapeXml } from "~/utils/escape-xml";
import { SITE_URL } from "~/utils/seo";

/**
 * XML sitemap.
 *
 * Two things this deliberately does not emit:
 *
 * - `changefreq` and `priority`. Google's sitemap docs state plainly that both
 *   are ignored. They were noise.
 * - `lastmod` on the static pages. It used to be `new Date().toISOString()`,
 *   evaluated per request, so every hourly regeneration claimed that the home
 *   page, the blog index, and the privacy policy had all just changed. Google
 *   only uses `lastmod` when it is "consistently and verifiably accurate", and
 *   a value that is wrong every time teaches it to ignore the field for the
 *   whole site. There is no per-page modification data available inside a
 *   Netlify Function — no git history at runtime — so the honest move is to
 *   omit it rather than invent it.
 *
 * Blog posts keep their `lastmod`, because Contentful's `sys.updatedAt` is a
 * real modification timestamp for that entry.
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

const STATIC_PAGES: SitemapUrl[] = [
  { loc: SITE_URL },
  { loc: `${SITE_URL}/blog` },
  { loc: `${SITE_URL}/about` },
  { loc: `${SITE_URL}/privacy` },
];

function renderSitemap(urls: SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const lastmod = url.lastmod ? `\n    <lastmod>${escapeXml(url.lastmod)}</lastmod>` : "";
      return `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${lastmod}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export async function loader() {
  try {
    // Null while Contentful is failing; the sitemap then lists static pages only.
    const blogPosts = await getBlogPostsWithBackoff();

    let blogPages: SitemapUrl[] = [];

    if (blogPosts) {
      blogPages = blogPosts
        .filter((post) => post?.fields?.slug && post.sys?.updatedAt)
        .map((post) => ({
          loc: `${SITE_URL}/blog/${post.fields.slug}`,
          lastmod: new Date(post.sys.updatedAt).toISOString(),
        }));
    }

    return new Response(renderSitemap([...STATIC_PAGES, ...blogPages]), {
      headers: {
        "Content-Type": "application/xml",
        // An hour normally; five minutes while Contentful is unavailable and
        // the sitemap lists static pages only, so crawlers pick posts back up
        // soon after it recovers. Same policy as /rss.xml.
        "Cache-Control": blogPosts ? "public, max-age=3600" : "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);

    return new Response(renderSitemap(STATIC_PAGES), {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300", // Shorter cache for error fallback
      },
    });
  }
}
