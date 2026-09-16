import { describe, expect, it } from "vitest";

import { isRecord } from "./is-record";
import { SITE_URL, buildMeta, canonicalUrl } from "./seo";

/** Narrow a descriptor list down to the title string, whatever position it sits in. */
function titleOf(descriptors: ReturnType<typeof buildMeta>): string | undefined {
  for (const d of descriptors) {
    if ("title" in d && typeof d.title === "string") return d.title;
  }
  return undefined;
}

function contentOfName(
  descriptors: ReturnType<typeof buildMeta>,
  name: string,
): string | undefined {
  for (const d of descriptors) {
    if ("name" in d && d.name === name && "content" in d && typeof d.content === "string") {
      return d.content;
    }
  }
  return undefined;
}

function canonicalOf(descriptors: ReturnType<typeof buildMeta>): string | undefined {
  for (const descriptor of descriptors) {
    // React Router's MetaDescriptor is a union whose link form carries `rel`
    // and `href` on an index signature. Widening to unknown first lets
    // isRecord narrow it properly, instead of an `as` assertion.
    const d: unknown = descriptor;
    if (isRecord(d) && d["rel"] === "canonical" && typeof d["href"] === "string") {
      return d["href"];
    }
  }
  return undefined;
}

describe("canonicalUrl", () => {
  it("returns the bare origin for the home page, with no trailing slash", () => {
    expect(canonicalUrl("/")).toBe(SITE_URL);
  });

  it("builds an absolute URL for a path", () => {
    expect(canonicalUrl("/blog")).toBe("https://www.jimmyvanveen.com/blog");
    expect(canonicalUrl("/blog/some-post")).toBe("https://www.jimmyvanveen.com/blog/some-post");
  });

  it("strips trailing slashes so one page cannot claim two canonicals", () => {
    expect(canonicalUrl("/blog/")).toBe("https://www.jimmyvanveen.com/blog");
    expect(canonicalUrl("/blog///")).toBe("https://www.jimmyvanveen.com/blog");
  });
});

describe("buildMeta", () => {
  it("suffixes the site name onto a page title", () => {
    const meta = buildMeta({ title: "Privacy Policy", pathname: "/privacy" });
    expect(titleOf(meta)).toBe("Privacy Policy · Jimmy Van Veen");
  });

  it("uses homeTitle verbatim, with no suffix", () => {
    const meta = buildMeta({
      homeTitle: "Jimmy Van Veen — Web Engineer in Greater Boston",
      pathname: "/",
    });
    expect(titleOf(meta)).toBe("Jimmy Van Veen — Web Engineer in Greater Boston");
  });

  it("always emits an absolute self-referential canonical", () => {
    expect(canonicalOf(buildMeta({ title: "Blog", pathname: "/blog" }))).toBe(
      "https://www.jimmyvanveen.com/blog",
    );
  });

  it("emits a description when given one", () => {
    const meta = buildMeta({ title: "Blog", description: "Field reports.", pathname: "/blog" });
    expect(contentOfName(meta, "description")).toBe("Field reports.");
  });

  it("omits the description tag entirely rather than emitting an empty one", () => {
    // A post with no Contentful description must produce no description tag.
    // A generic fallback would be a documented snippet-rewrite trigger, and an
    // empty content="" is worse than silence.
    const meta = buildMeta({ title: "Untitled", pathname: "/blog/x" });
    expect(contentOfName(meta, "description")).toBeUndefined();
    expect(meta.some((d) => "name" in d && d.name === "description")).toBe(false);
  });

  it("treats an empty-string description as absent", () => {
    const meta = buildMeta({ title: "Untitled", description: "", pathname: "/blog/x" });
    expect(meta.some((d) => "name" in d && d.name === "description")).toBe(false);
  });

  it("gives two different pages two different titles", () => {
    // The whole reason this module exists: every page used to serve the
    // identical <title>Jimmy Van Veen</title>.
    const home = titleOf(buildMeta({ homeTitle: "Jimmy Van Veen — Web Engineer", pathname: "/" }));
    const blog = titleOf(buildMeta({ title: "Notes & field reports", pathname: "/blog" }));
    expect(home).not.toBe(blog);
  });
});
