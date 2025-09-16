// Libs
import ReactMarkdown from "react-markdown";
import { redirect } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

import { format } from "date-fns";
import rehypeExternalLinks from "rehype-external-links";

import ContentCards, { ContentCard } from "~/components/content-cards";
// Components
import GradientBanner from "~/components/gradient-banner";
import { trackPageView } from "~/utils/analytics-loader";
// Utils
import { getCachedBlogPostBySlug } from "~/utils/contentful-cache";

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
  const data = await serverLoader();
  await trackPageView();
  return data;
}

export default function Index({ loaderData: blog }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-black">
      <GradientBanner>
        <h2 className="border-b-2 border-b-zinc-500/50 text-4xl mb-6 pb-4 leading-[60px] font-bold tracking-widest">
          {blog.fields.title}
        </h2>
        <p className="leading-8 tracking-widest">{blog.fields.description}</p>
      </GradientBanner>

      <ContentCards spacing="space-y-8 -mt-40 relative z-10">
        <ContentCard>
          <div id="blogContent" className="prose prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node: _node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className ?? "");
                  return match ? (
                    <SyntaxHighlighter
                      showLineNumbers
                      language={match[1]}
                      style={vscDarkPlus}
                      PreTag="div"
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
              {blog.fields.body}
            </ReactMarkdown>
          </div>

          <h3 className="mb-6 mt-10 pt-9 font-sans font-bold italic underline text-lg border-t-2 border-zinc-700">
            Posted on{" "}
            {format(new Date(blog.fields.publishDate), "MMMM dd, yyyy")}
          </h3>
        </ContentCard>
      </ContentCards>
    </div>
  );
}
