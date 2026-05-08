import ReactMarkdown from "react-markdown";
import { isRouteErrorResponse, redirect } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import rehypeExternalLinks from "rehype-external-links";

import { PostFooter } from "~/components/blog/post-footer";
import { PostHero } from "~/components/blog/post-hero";
import { ReadingProgress } from "~/components/blog/reading-progress";
import { Plate } from "~/components/site/plate";
import { trackPageView } from "~/utils/analytics-loader";
import { getCachedBlogPostBySlug } from "~/utils/contentful-cache";
import { readingStats } from "~/utils/reading-time";

import type { Route } from "./+types/$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const slug: string = params.slug;

  try {
    return await getCachedBlogPostBySlug(slug);
  } catch (error) {
    if (isRouteErrorResponse(error) && error.status === 404) {
      return redirect("/blog", { status: 302 });
    }
    console.error("Failed to load blog post", { slug, error });
    throw error;
  }
}

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const result = await serverLoader();

  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });

  return result;
}
clientLoader.hydrate = true;

export default function Post({ loaderData: blog }: Route.ComponentProps) {
  const body = blog.fields.body;
  const { minutes, long } = readingStats(body);

  return (
    <>
      <ReadingProgress />
      <main className="blog-page">
        <PostHero
          title={blog.fields.title}
          publishDate={blog.fields.publishDate}
          description={blog.fields.description}
          readingMinutes={minutes}
        />

        <article
          className="prose-editorial"
          data-long={long ? "true" : undefined}
        >
          <ReactMarkdown
            components={{
              img({ src, alt, title }) {
                if (!src || typeof src !== "string") return null;
                return (
                  <Plate
                    src={src}
                    alt={alt ?? ""}
                    caption={title ?? undefined}
                  />
                );
              },
              code({ node: _node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                return match ? (
                  <SyntaxHighlighter
                    showLineNumbers
                    useInlineStyles={false}
                    language={match[1]}
                    PreTag="pre"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
            rehypePlugins={[[rehypeExternalLinks, { target: "_blank" }]]}
          >
            {body}
          </ReactMarkdown>
        </article>

        <PostFooter publishDate={blog.fields.publishDate} />
      </main>
    </>
  );
}
