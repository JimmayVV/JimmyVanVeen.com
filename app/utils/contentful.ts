import * as Contentful from "contentful";

// @see https://github.com/contentful/contentful.js/blob/0103af24dcbb6c3939a5358f249d30ed0e52b05c/TYPESCRIPT.md
// for how I generated these types

export type BlogPostSkeleton = Contentful.EntrySkeletonType<
  {
    title: Contentful.EntryFieldTypes.Symbol;
    author?: Contentful.EntryFieldTypes.Symbol;
    slug: Contentful.EntryFieldTypes.Symbol;
    description: Contentful.EntryFieldTypes.Text;
    image?: Contentful.EntryFieldTypes.AssetLink;
    body: Contentful.EntryFields.Text;
    publishDate: Contentful.EntryFields.Date;
  },
  "blogPost"
>;

export type ProjectFieldsSkeleton = Contentful.EntrySkeletonType<
  {
    title: Contentful.EntryFieldTypes.Symbol;
    ghId: Contentful.EntryFieldTypes.Symbol;
    description: Contentful.EntryFieldTypes.Text;
    screenshot?: Contentful.EntryFieldTypes.AssetLink;
    priority?: Contentful.EntryFieldTypes.Integer;
  },
  "project"
>;

const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID ?? "";
const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN ?? "";
const CONTENTFUL_PREVIEW_TOKEN = process.env.CONTENTFUL_PREVIEW_TOKEN ?? "";
const CONTENTFUL_PREVIEW = process.env.CONTENTFUL_PREVIEW === "true";

const activeToken = CONTENTFUL_PREVIEW
  ? CONTENTFUL_PREVIEW_TOKEN
  : CONTENTFUL_ACCESS_TOKEN;

if (CONTENTFUL_PREVIEW && CONTENTFUL_PREVIEW_TOKEN.length === 0) {
  console.warn(
    "[contentful] CONTENTFUL_PREVIEW=true but CONTENTFUL_PREVIEW_TOKEN is not set — content will be empty",
  );
}

const hasContentfulEnv =
  CONTENTFUL_SPACE_ID.length > 0 && activeToken.length > 0;

const client = hasContentfulEnv
  ? Contentful.createClient({
      space: CONTENTFUL_SPACE_ID,
      accessToken: activeToken,
      host: CONTENTFUL_PREVIEW
        ? "preview.contentful.com"
        : "cdn.contentful.com",
    })
  : null;

/**
 * Check if Contentful is configured
 */
export const isContentfulConfigured = () => hasContentfulEnv;

/**
 * Get all of the projects I have added to Contentful
 */
export const getProjects = async () => {
  if (!client) return [];
  const { items } =
    await client.withoutUnresolvableLinks.getEntries<ProjectFieldsSkeleton>({
      content_type: "project",
    });

  return items;
};

/**
 * Get all of the blog posts I have added to Contentful
 */
export const getAllBlogPosts = async () => {
  if (!client) return [];
  const { items } =
    await client.withoutUnresolvableLinks.getEntries<BlogPostSkeleton>({
      content_type: "blogPost",
    });

  return items;
};

/**
 * Get all blog posts that are published with a given slug. In practice,
 * this should only be one blog post.
 *
 * @throws {Error} If more than one blog post is found with the given slug
 *
 * @throws {Error} If no blog post is found with the given slug
 */
export const getBlogPostBySlug = async (slug: string) => {
  if (!client) throw new Error("Contentful environment not configured");
  const { items } =
    await client.withoutUnresolvableLinks.getEntries<BlogPostSkeleton>({
      content_type: "blogPost",
      "fields.slug[match]": slug,
    });

  // Check that only one blog post was returned
  if (items.length > 1) {
    throw new Error("More than one blog post found with that slug");
  }

  // Check that a blog post was returned
  if (items.length === 0) {
    throw new Error("No blog post found with that slug");
  }

  return items[0];
};
