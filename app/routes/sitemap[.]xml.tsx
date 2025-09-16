import { getCachedBlogPosts } from "~/utils/contentful-cache";

export async function loader() {
  // Use cached blog posts to avoid hitting Contentful rate limits
  const blogPosts = await getCachedBlogPosts();

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
  const blogPages = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.fields.slug}`,
    lastmod: new Date(post.sys.updatedAt).toISOString(),
    changefreq: "monthly",
    priority: "0.6",
  }));

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
}
