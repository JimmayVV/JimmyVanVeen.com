import ReactMarkdown from "react-markdown";
import { redirect } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import rehypeExternalLinks from "rehype-external-links";

import { PostFooter } from "~/components/blog/post-footer";
import { PostHero } from "~/components/blog/post-hero";
import { ReadingProgress } from "~/components/blog/reading-progress";
import { trackPageView } from "~/utils/analytics-loader";
import { editorialPrismStyle } from "~/utils/code-theme";
import { getCachedBlogPostBySlug } from "~/utils/contentful-cache";
import { isLongPost, readingMinutes } from "~/utils/reading-time";

import type { Route } from "./+types/$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const slug: string = params.slug;

  try {
    return await getCachedBlogPostBySlug(slug);
  } catch (_error) {
    // If blog post not found, redirect to blog index
    return redirect("/blog", { status: 302 });
  }
}

// Add analytics tracking to this route
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const result = await serverLoader();

  // Track page view in background
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });

  return result;
}
clientLoader.hydrate = true;

export default function Post({ loaderData: blog }: Route.ComponentProps) {
  const body = blog.fields.body;
  const long = isLongPost(body);
  const minutes = readingMinutes(body);

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
              code({ node: _node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                return match ? (
                  <SyntaxHighlighter
                    showLineNumbers
                    language={match[1]}
                    style={editorialPrismStyle}
                    PreTag="pre"
                    customStyle={{}}
                    codeTagProps={{ style: {} }}
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
