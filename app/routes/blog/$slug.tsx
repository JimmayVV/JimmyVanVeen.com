import * as React from "react";
import ReactMarkdown from "react-markdown";
import { Link, redirect } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import rehypeExternalLinks from "rehype-external-links";

import { CoverageGrid } from "~/components/blog/coverage-grid";
import { PostFooter } from "~/components/blog/post-footer";
import { PostHero } from "~/components/blog/post-hero";
import { ReadingProgress } from "~/components/blog/reading-progress";
import { Plate } from "~/components/site/plate";
import { trackPageView } from "~/utils/analytics-loader";
import { getCachedBlogPostBySlug } from "~/utils/contentful-cache";
import { isRecord } from "~/utils/is-record";
import { readingStats } from "~/utils/reading-time";
import { articleJsonLd, buildMeta } from "~/utils/seo";

import type { Route } from "./+types/$slug";

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  const pathname = `/blog/${params.slug}`;

  // The redirect branch in the loader means loader data can be absent. A
  // canonical is still correct; a fabricated title and description would not be.
  if (!loaderData) {
    return buildMeta({ title: "Post", pathname });
  }

  const { title, description, publishDate, author, image } = loaderData.fields;

  // Contentful hands back either a resolved asset or an unresolved link. Same
  // narrowing the home page uses for project screenshots — no `as`.
  const shareImage = image && "fields" in image ? image.fields.file?.url : undefined;

  return [
    ...buildMeta({
      title,
      // Contentful's description is rendered as the dek in PostHero. When a
      // post has none, no description tag is emitted rather than a generic one.
      description: description || undefined,
      pathname,
      // A post with its own Contentful image shares that; the rest fall back
      // to the site plate.
      image: shareImage || undefined,
      ogType: "article",
    }),
    {
      "script:ld+json": articleJsonLd({
        title,
        description: description || undefined,
        publishDate,
        author,
        pathname,
      }),
    },
  ];
};

export async function loader({ params }: Route.LoaderArgs) {
  const slug: string = params.slug;

  try {
    return await getCachedBlogPostBySlug(slug);
  } catch (error) {
    console.error("Failed to load blog post", { slug, error });
    throw redirect("/blog", { status: 302 });
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

export function ErrorBoundary() {
  return (
    <main className="blog-page">
      <h1 className="error-title">Couldn&rsquo;t load that post</h1>
      <p className="error-body">
        Something went wrong fetching this post. The post index has the latest list either way.
      </p>
      <Link to="/blog" className="blog-back-link" prefetch="intent">
        ← All posts
      </Link>
    </main>
  );
}

export default function Post({ loaderData: blog }: Route.ComponentProps) {
  const body = blog.fields.body;
  // Memoize the regex chain so re-renders don't re-walk the full post.
  const { minutes, long } = React.useMemo(() => readingStats(body), [body]);

  return (
    <>
      <ReadingProgress />
      <main className="blog-page">
        <PostHero
          title={blog.fields.title}
          publishDate={blog.fields.publishDate}
          description={blog.fields.description}
          readingMinutes={minutes}
          author={blog.fields.author}
        />

        <article className="prose-editorial" data-long={long ? "true" : undefined}>
          <ReactMarkdown
            components={{
              img({ src, alt, title }) {
                if (!src || typeof src !== "string") return null;
                return <Plate src={src} alt={alt ?? ""} caption={title ?? undefined} />;
              },
              // ReactMarkdown wraps fenced code in <pre> by default. We
              // also have <SyntaxHighlighter PreTag="pre"> rendering its
              // own <pre>. For language-tagged code we unwrap (let
              // SyntaxHighlighter own the <pre>) — that's how we avoid
              // nested-pre / double scrollbars. For untagged blocks we
              // keep the <pre> so the semantics aren't lost.
              //
              // This is fragile against future ReactMarkdown changes to
              // its AST shape; if that ever breaks the type guard below,
              // language-tagged blocks would silently double-wrap again.
              // Worth re-evaluating when react-markdown ships native
              // syntax-highlighting support and we can drop the
              // SyntaxHighlighter component entirely.
              pre({ children, ...props }) {
                if (React.isValidElement(children) && isRecord(children.props)) {
                  const className = children.props["className"];
                  if (typeof className === "string" && /language-/.test(className)) {
                    return <>{children}</>;
                  }
                }
                return <pre {...props}>{children}</pre>;
              },
              code({ node: _node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className ?? "");
                // A `coverage` fence is a figure, not code. Contentful bodies are
                // plain markdown and raw HTML is stripped, so a fenced block is
                // the only channel a post has for asking for a custom figure.
                if (match?.[1] === "coverage") {
                  return <CoverageGrid source={String(children)} />;
                }
                return match ? (
                  <SyntaxHighlighter
                    showLineNumbers
                    useInlineStyles={false}
                    language={match[1]}
                    PreTag="pre"
                    // Empty style + customStyle + codeTagProps suppress
                    // the library's default inline `color:black;
                    // font-family:Consolas; background:none` on the
                    // <code> wrapper, which was overriding our CSS.
                    style={{}}
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
