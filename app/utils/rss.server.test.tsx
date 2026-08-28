import { describe, expect, it } from "vitest";

import { type FeedPost, SITE_URL, absolutize, buildRssFeed, renderBody } from "./rss.server";

const post = (overrides: Partial<FeedPost> = {}): FeedPost => ({
  title: "A post",
  slug: "a-post",
  body: "Hello **world**.",
  publishDate: "2026-08-26T00:00:00.000Z",
  ...overrides,
});

describe("absolutize", () => {
  const postUrl = `${SITE_URL}/blog/a-post`;

  it("upgrades protocol-relative Contentful asset URLs to https", () => {
    expect(absolutize("//images.ctfassets.net/x/y.png", postUrl)).toBe(
      "https://images.ctfassets.net/x/y.png",
    );
  });

  it("resolves site-root paths against the canonical origin", () => {
    expect(absolutize("/blog/other", postUrl)).toBe(`${SITE_URL}/blog/other`);
  });

  it("resolves fragments against the post URL", () => {
    expect(absolutize("#heading", postUrl)).toBe(`${postUrl}#heading`);
  });

  it("resolves document-relative paths against the post's directory", () => {
    expect(absolutize("images/foo.png", postUrl)).toBe(`${SITE_URL}/blog/images/foo.png`);
  });

  it("passes through what the URL parser rejects", () => {
    expect(absolutize("http://[bad", postUrl)).toBe("http://[bad");
  });

  it("leaves absolute URLs alone", () => {
    expect(absolutize("https://example.com/", postUrl)).toBe("https://example.com/");
  });
});

describe("renderBody", () => {
  const postUrl = `${SITE_URL}/blog/a-post`;

  it("renders markdown to plain HTML", () => {
    expect(renderBody("Hello **world**.", postUrl)).toBe("<p>Hello <strong>world</strong>.</p>");
  });

  it("absolutizes links and images", () => {
    const html = renderBody("[x](/blog/other) ![alt](//images.ctfassets.net/a.png)", postUrl);
    expect(html).toContain(`href="${SITE_URL}/blog/other"`);
    expect(html).toContain('src="https://images.ctfassets.net/a.png"');
    expect(html).toContain('alt="alt"');
  });

  it("renders a coverage fence as its summary sentence, not the raw source", () => {
    const html = renderBody(
      "Before.\n\n```coverage\ntotal: 262\nstored: 45\nlabel: corpus coverage after 29 days\nstoredLabel: in the shared store\nemptyLabel: local only, never sent\n```\n\nAfter.",
      postUrl,
    );
    expect(html).toContain("<figcaption>corpus coverage after 29 days</figcaption>");
    expect(html).toContain("<strong>45 / 262</strong>");
    expect(html).toContain(
      "45 of 262 in the shared store; the remaining 217 local only, never sent.",
    );
    expect(html).not.toContain("language-coverage");
    expect(html).not.toContain("total: 262");
    expect(html).toContain("<p>Before.</p>");
    expect(html).toContain("<p>After.</p>");
  });

  it("drops an empty coverage fence instead of rendering a figure for nothing", () => {
    const html = renderBody("```coverage\nlabel: x\n```", postUrl);
    expect(html).not.toContain("<figure>");
    expect(html).not.toContain("language-coverage");
  });

  it("keeps fenced code as a language-tagged code block", () => {
    const html = renderBody("```ts\nconst a = 1;\n```", postUrl);
    expect(html).toContain('<pre><code class="language-ts">');
  });
});

describe("buildRssFeed", () => {
  it("emits a well-formed RSS 2.0 document with a self link", () => {
    const xml = buildRssFeed([post()]);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true);
    expect(xml).toContain(`<atom:link href="${SITE_URL}/rss.xml" rel="self"`);
    expect(xml).toContain(`<link>${SITE_URL}/blog</link>`);
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("orders items newest first regardless of input order", () => {
    const xml = buildRssFeed([
      post({ slug: "old", publishDate: "2020-05-14T00:00:00.000Z" }),
      post({ slug: "new", publishDate: "2026-08-26T00:00:00.000Z" }),
      post({ slug: "mid", publishDate: "2025-03-25T00:00:00.000Z" }),
    ]);
    const order = ["new", "mid", "old"].map((slug) => xml.indexOf(`/blog/${slug}</link>`));
    expect(order).toEqual(order.toSorted((a, b) => a - b));
    expect(order.every((i) => i > 0)).toBe(true);
  });

  it("uses the newest post's date as lastBuildDate so an unchanged feed is stable", () => {
    const xml = buildRssFeed([post({ publishDate: "2026-08-26T12:34:56.000Z" })]);
    expect(xml).toContain("<lastBuildDate>Wed, 26 Aug 2026 12:34:56 GMT</lastBuildDate>");
    expect(xml).toContain("<pubDate>Wed, 26 Aug 2026 12:34:56 GMT</pubDate>");
  });

  it("falls back to the supplied clock when there are no posts", () => {
    const xml = buildRssFeed([], new Date("2026-01-01T00:00:00.000Z"));
    expect(xml).toContain("<lastBuildDate>Thu, 01 Jan 2026 00:00:00 GMT</lastBuildDate>");
    expect(xml).not.toContain("<item>");
  });

  it("escapes text fields and wraps the body in CDATA", () => {
    // React escapes `>` in text, so a literal `]]>` in a body cannot reach the
    // CDATA section; the assertion pins that the wrapper stays well-formed.
    const xml = buildRssFeed([
      post({
        title: `Tom & "Jerry" <3`,
        description: "a < b",
        author: "Jimmy",
        body: "x ]]> y",
      }),
    ]);
    expect(xml).toContain("<title>Tom &amp; &quot;Jerry&quot; &lt;3</title>");
    expect(xml).toContain("<description>a &lt; b</description>");
    expect(xml).toContain("<dc:creator>Jimmy</dc:creator>");
    expect(xml).toContain("<content:encoded><![CDATA[<p>x ]]&gt; y</p>]]></content:encoded>");
  });

  it("uses the post URL as a permalink guid", () => {
    const xml = buildRssFeed([post({ slug: "the-memory-that-never-recalled" })]);
    expect(xml).toContain(
      `<guid isPermaLink="true">${SITE_URL}/blog/the-memory-that-never-recalled</guid>`,
    );
  });

  it("treats epoch zero as a real date, not as unparseable", () => {
    const xml = buildRssFeed([post({ publishDate: "1970-01-01T00:00:00.000Z" })], new Date(1e12));
    expect(xml).toContain("<pubDate>Thu, 01 Jan 1970 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Thu, 01 Jan 1970 00:00:00 GMT</lastBuildDate>");
  });

  it("omits pubDate for an unparseable date instead of emitting Invalid Date", () => {
    const xml = buildRssFeed([post({ publishDate: "not a date" })], new Date(0));
    expect(xml).not.toContain("Invalid Date");
    expect(xml).not.toContain("<pubDate>");
  });
});
