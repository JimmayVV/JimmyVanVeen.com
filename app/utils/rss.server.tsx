import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";

import { coverageSummary, parseCoverage } from "~/components/blog/coverage-grid";

import { BLOG_TAGLINE, BLOG_TITLE } from "./blog-copy";
import { escapeXml } from "./escape-xml";
import { isRecord } from "./is-record";

export const SITE_URL = "https://www.jimmyvanveen.com";
export const FEED_PATH = "/rss.xml";
export const FEED_TITLE = "Jimmy Van Veen";
export const FEED_DESCRIPTION = `${BLOG_TITLE} ${BLOG_TAGLINE}`;

/**
 * The subset of a Contentful blog post the feed needs. Kept structural so the
 * builder can be tested with plain objects and never imports Contentful.
 */
export interface FeedPost {
  title: string;
  slug: string;
  body: string;
  publishDate: string;
  description?: string | undefined;
  author?: string | undefined;
}

/**
 * Feed readers fetch the feed from their own servers, so every URL in it has
 * to be absolute. Resolves against the post's canonical URL, which covers
 * Contentful's protocol-relative image host (`//images.ctfassets.net/...`),
 * site-root paths, fragments, and document-relative paths alike. Anything
 * the URL parser rejects is passed through untouched.
 */
export function absolutize(url: string, postUrl: string): string {
  try {
    return new URL(url, postUrl).href;
  } catch {
    return url;
  }
}

/**
 * The source of a ```coverage fence, when `children` is the `<code>` element
 * react-markdown produced for one; otherwise null.
 */
function coverageFence(children: React.ReactNode): string | null {
  if (!React.isValidElement(children) || !isRecord(children.props)) return null;
  const className = children.props["className"];
  if (typeof className !== "string" || !/\blanguage-coverage\b/.test(className)) return null;
  const source = children.props["children"];
  if (typeof source === "string") return source;
  if (Array.isArray(source)) return source.join("");
  return null;
}

/**
 * The feed's stand-in for the site's coverage grid: the same numbers and
 * labels as one sentence, so a reader sees the claim rather than the fence's
 * key/value source.
 */
function CoverageFigure({ source }: { source: string }) {
  const spec = parseCoverage(source);
  if (spec.total <= 0) return null;
  return (
    <figure>
      <figcaption>{spec.label}</figcaption>
      <p>
        <strong>
          {spec.stored} / {spec.total}
        </strong>{" "}
        {coverageSummary(spec)}
      </p>
    </figure>
  );
}

function toTimestamp(iso: string): number | null {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

function toRfc822(iso: string): string | null {
  const t = toTimestamp(iso);
  return t === null ? null : new Date(t).toUTCString();
}

/**
 * Renders a post's markdown body to plain HTML for `content:encoded`. The
 * site's custom figure and syntax-highlighting components are deliberately
 * not used: a feed reader wants semantic HTML it can restyle, not the site's
 * DOM. Fenced code stays `<pre><code class="language-x">`, except a
 * `coverage` fence, which is a figure and renders as its summary sentence.
 */
export function renderBody(markdown: string, postUrl: string): string {
  return renderToStaticMarkup(
    <ReactMarkdown
      components={{
        pre({ node: _node, children, ...props }) {
          const fence = coverageFence(children);
          if (fence !== null) return <CoverageFigure source={fence} />;
          return <pre {...props}>{children}</pre>;
        },
        a({ node: _node, href, children, ...props }) {
          const resolved = typeof href === "string" ? absolutize(href, postUrl) : href;
          return (
            <a {...props} href={resolved}>
              {children}
            </a>
          );
        },
        img({ node: _node, src, alt, ...props }) {
          const resolved = typeof src === "string" ? absolutize(src, postUrl) : src;
          return <img {...props} src={resolved} alt={alt ?? ""} />;
        },
      }}
    >
      {markdown}
    </ReactMarkdown>,
  );
}

/**
 * CDATA cannot contain the terminator `]]>`; split it across two sections.
 * React escapes `>` in rendered text so this never fires today, but the
 * feed must stay well-formed if the renderer ever changes.
 */
function cdata(html: string): string {
  return `<![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/**
 * One bad body must not take the whole feed down. A post whose markdown fails
 * to render keeps its title, link, and description; only `content:encoded`
 * is dropped, and the failure is logged with the slug.
 */
function renderBodyOrNull(post: FeedPost, url: string): string | null {
  try {
    return renderBody(post.body, url);
  } catch (error) {
    console.error(`Failed to render post body for the feed: ${post.slug}`, error);
    return null;
  }
}

function renderItem(post: FeedPost): string {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const pubDate = toRfc822(post.publishDate);
  const html = renderBodyOrNull(post, url);
  const lines = [
    `    <item>`,
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
  ];
  if (pubDate) lines.push(`      <pubDate>${escapeXml(pubDate)}</pubDate>`);
  if (post.author) lines.push(`      <dc:creator>${escapeXml(post.author)}</dc:creator>`);
  if (post.description)
    lines.push(`      <description>${escapeXml(post.description)}</description>`);
  if (html !== null) lines.push(`      <content:encoded>${cdata(html)}</content:encoded>`);
  lines.push(`    </item>`);
  return lines.join("\n");
}

/**
 * Builds an RSS 2.0 document with full post bodies. Posts are ordered newest
 * first by `publishDate` regardless of the order Contentful returned them.
 * `lastBuildDate` is the newest post's date rather than "now" so an unchanged
 * feed stays byte-identical between fetches.
 */
export function buildRssFeed(posts: FeedPost[], now: Date = new Date()): string {
  const ordered = posts.toSorted(
    (a, b) => (toTimestamp(b.publishDate) ?? -Infinity) - (toTimestamp(a.publishDate) ?? -Infinity),
  );
  const newest = ordered[0];
  const lastBuildDate = (newest ? toRfc822(newest.publishDate) : null) ?? now.toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(FEED_TITLE)}</title>
    <link>${escapeXml(`${SITE_URL}/blog`)}</link>
    <description>${escapeXml(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${escapeXml(lastBuildDate)}</lastBuildDate>
    <atom:link href="${escapeXml(`${SITE_URL}${FEED_PATH}`)}" rel="self" type="application/rss+xml" />
${ordered.map(renderItem).join("\n")}
  </channel>
</rss>
`;
}
