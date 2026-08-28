import { getBlogPostsWithBackoff } from "~/utils/blog-posts-with-backoff";
import { escapeXml } from "~/utils/escape-xml";

export async function loader() {
  try {
    // Null while Contentful is failing; the sitemap then lists static pages only.
    const blogPosts = await getBlogPostsWithBackoff();

    const baseUrl = "https://www.jimmyvanveen.com";

    // Static pages with their priorities and change frequencies
    const staticPages = [
      {
        url: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: "1.0",
      },
      {
        url: `${baseUrl}/blog`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: "0.8",
      },
      {
        url: `${baseUrl}/privacy`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: "0.3",
      },
    ];

    // Blog post pages from cached Contentful data
    let blogPages: Array<{
      url: string;
      lastmod: string;
      changefreq: string;
      priority: string;
    }> = [];

    if (blogPosts && Array.isArray(blogPosts)) {
      try {
        blogPages = blogPosts
          .filter((post) => post && post.fields && post.fields.slug && post.sys)
          .map((post) => ({
            url: `${baseUrl}/blog/${post.fields.slug}`,
            lastmod: new Date(post.sys.updatedAt).toISOString(),
            changefreq: "monthly",
            priority: "0.6",
          }));
      } catch (error) {
        console.error("Error processing blog posts for sitemap:", error);
        // Continue with static pages only
      }
    }

    // Combine all pages
    const allPages = [...staticPages, ...blogPages];

    // Generate XML sitemap with proper escaping
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${escapeXml(page.lastmod)}</lastmod>
    <changefreq>${escapeXml(page.changefreq)}</changefreq>
    <priority>${escapeXml(page.priority)}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);

    // Return a minimal sitemap with just static pages
    const currentDate = escapeXml(new Date().toISOString());
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.jimmyvanveen.com</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.jimmyvanveen.com/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.jimmyvanveen.com/privacy</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300", // Shorter cache for error fallback
      },
    });
  }
}
