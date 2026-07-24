import { Link, useLoaderData } from "react-router";

import { trackPageView } from "~/utils/analytics-loader";
import { isContentfulConfigured } from "~/utils/contentful";
import { getCachedBlogPosts } from "~/utils/contentful-cache";
import { formatPostDate } from "~/utils/format-post-date";

import type { Route } from "./+types/blog-index";

export async function loader() {
  const posts = await getCachedBlogPosts();
  return {
    posts,
    isConfigured: isContentfulConfigured(),
  };
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const result = await serverLoader();
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });
  return result;
}
clientLoader.hydrate = true;

export default function BlogIndex() {
  const { posts, isConfigured } = useLoaderData<typeof loader>();
  const hasPosts = posts && posts.length > 0;

  return (
    <main className="blog-page">
      <h1 className="blog-index-intro">Notes &amp; field reports.</h1>
      <p className="blog-index-dek">
        Things I&rsquo;ve learned the slow way — written down so the next person (or future me)
        finds them faster.
      </p>
      <div className="blog-index-rule" />

      {hasPosts ? (
        <ul className="blog-index-list">
          {posts.map((blog) => (
            <li className="blog-index-row" key={blog.sys.id}>
              <Link to={`./${blog.fields.slug}`} prefetch="intent">
                <div className="meta">{formatPostDate(blog.fields.publishDate)}</div>
                <h2 className="title">{blog.fields.title}</h2>
                {blog.fields.description ? <p className="dek">{blog.fields.description}</p> : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="blog-empty-note">
          {!isConfigured ? (
            <>
              <h3>Contentful not configured</h3>
              <p>
                Set <code>CONTENTFUL_SPACE_ID</code> and <code>CONTENTFUL_ACCESS_TOKEN</code> in the
                environment to load posts.
              </p>
            </>
          ) : (
            <>
              <h3>Nothing here yet</h3>
              <p>No posts published. Check back later.</p>
            </>
          )}
        </div>
      )}
    </main>
  );
}
