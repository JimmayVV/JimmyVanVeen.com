// Libs
import ReactMarkdown from "react-markdown";
import { redirect } from "react-router";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

import { format } from "date-fns";
import rehypeExternalLinks from "rehype-external-links";

// Components
import Banner from "~/components/banner";
import SliceContent from "~/components/slice-content";
import Slices from "~/components/slices";
// Utils
import { getBlogPostBySlug } from "~/utils/contentful";

import type { Route } from "./+types/$slug";

export async function loader({ params }: Route.LoaderArgs) {
  const slug: string = params.slug;
  const blog = await getBlogPostBySlug(slug);

  if (!blog) {
    return redirect("/blog", { status: 302 });
  }

  return blog;
}

export default function Index({ loaderData: blog }: Route.ComponentProps) {
  return (
    <div>
      <Banner>
        <h2 className="border-b-2 border-b-zinc-500/50 text-4xl mb-6 pb-4 leading-[60px] font-bold tracking-widest">
          {blog.fields.title}
        </h2>
        <p className="leading-8 tracking-widest">{blog.fields.description}</p>
      </Banner>
      <Slices colors={["#333"]} staticAlignment>
        <SliceContent>
          <div id="blogContent">
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

          <h3 className="mb-6 mt-10 pt-9 font-sans font-bold italic underline text-lg border-t-2">
            Posted on{" "}
            {format(new Date(blog.fields.publishDate), "MMMM dd, yyyy")}
          </h3>
        </SliceContent>
      </Slices>
    </div>
  );
}
