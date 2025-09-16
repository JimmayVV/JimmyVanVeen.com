import { getCachedBlogPosts } from "~/utils/contentful-cache";

// Cache blog post failures to avoid repeated API calls
let lastBlogPostsFailure: number | null = null;
const FAILURE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function loader() {
  try {
    // Skip blog posts if recently failed to avoid repeated API calls
    let blogPosts = null;
    if (
      !lastBlogPostsFailure ||
      Date.now() - lastBlogPostsFailure > FAILURE_CACHE_DURATION
    ) {
      try {
        // Use cached blog posts to avoid hitting Contentful rate limits
        blogPosts = await getCachedBlogPosts();
        // Reset failure cache on success
        lastBlogPostsFailure = null;
      } catch (blogError) {
        console.error("Failed to fetch blog posts for sitemap:", blogError);
        lastBlogPostsFailure = Date.now();
        // Continue with static pages only
      }
    }

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

    // Generate XML sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
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
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.jimmyvanveen.com</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.jimmyvanveen.com/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.jimmyvanveen.com/privacy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
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
