import { describe, expect, it } from "vitest";

import { isRecord } from "./is-record";
import { SITE_URL, absoluteUrl, articleJsonLd, buildMeta, canonicalUrl } from "./seo";

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

function contentOfProperty(
  descriptors: ReturnType<typeof buildMeta>,
  property: string,
): string | undefined {
  for (const descriptor of descriptors) {
    const d: unknown = descriptor;
    if (isRecord(d) && d["property"] === property && typeof d["content"] === "string") {
      return d["content"];
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

  it.each(["", "   "])(
    "treats a blank title as absent rather than emitting a bare suffix (%j)",
    (title) => {
      // `??` would have produced " · Jimmy Van Veen" here — a leading separator
      // with no title. Same class as the resolveAuthor divergence.
      expect(titleOf(buildMeta({ title, pathname: "/blog/x" }))).toBe("Jimmy Van Veen");
    },
  );

  it.each(["", "   "])("falls through a blank homeTitle to the normal path (%j)", (homeTitle) => {
    expect(titleOf(buildMeta({ homeTitle, title: "Blog", pathname: "/blog" }))).toBe(
      "Blog · Jimmy Van Veen",
    );
  });

  it("trims a padded title instead of baking the padding into the tag", () => {
    expect(titleOf(buildMeta({ title: "  Blog  ", pathname: "/blog" }))).toBe(
      "Blog · Jimmy Van Veen",
    );
  });

  it("gives two different pages two different titles", () => {
    // The whole reason this module exists: every page used to serve the
    // identical <title>Jimmy Van Veen</title>.
    const home = titleOf(buildMeta({ homeTitle: "Jimmy Van Veen — Web Engineer", pathname: "/" }));
    const blog = titleOf(buildMeta({ title: "Notes & field reports", pathname: "/blog" }));
    expect(home).not.toBe(blog);
  });
});

describe("absoluteUrl", () => {
  it("leaves an absolute URL alone", () => {
    expect(absoluteUrl("https://images.ctfassets.net/x/y.jpg")).toBe(
      "https://images.ctfassets.net/x/y.jpg",
    );
  });

  it("upgrades a protocol-relative Contentful asset URL", () => {
    // Contentful returns //images.ctfassets.net/... and preview fetchers
    // reject anything that isn't absolute https.
    expect(absoluteUrl("//images.ctfassets.net/x/y.jpg")).toBe(
      "https://images.ctfassets.net/x/y.jpg",
    );
  });

  it("makes a site-relative path absolute", () => {
    expect(absoluteUrl("/images/talladega_glory.jpg")).toBe(
      `${SITE_URL}/images/talladega_glory.jpg`,
    );
  });

  it("tolerates a path with no leading slash", () => {
    expect(absoluteUrl("images/x.jpg")).toBe(`${SITE_URL}/images/x.jpg`);
  });
});

describe("buildMeta share tags", () => {
  it("emits og:title, og:url, and og:site_name matching the page", () => {
    const meta = buildMeta({ title: "About", pathname: "/about" });
    expect(contentOfProperty(meta, "og:title")).toBe("About · Jimmy Van Veen");
    expect(contentOfProperty(meta, "og:url")).toBe(`${SITE_URL}/about`);
    expect(contentOfProperty(meta, "og:site_name")).toBe("Jimmy Van Veen");
  });

  it("defaults og:type to website and allows article", () => {
    expect(contentOfProperty(buildMeta({ title: "A", pathname: "/a" }), "og:type")).toBe("website");
    expect(
      contentOfProperty(buildMeta({ title: "A", pathname: "/a", ogType: "article" }), "og:type"),
    ).toBe("article");
  });

  it("falls back to the site plate, as an absolute URL", () => {
    const meta = buildMeta({ title: "A", pathname: "/a" });
    expect(contentOfProperty(meta, "og:image")).toBe(`${SITE_URL}/images/talladega_glory.jpg`);
    expect(contentOfProperty(meta, "og:image:alt")).toContain("Talladega");
  });

  it("makes a supplied protocol-relative image absolute", () => {
    const meta = buildMeta({
      title: "A post",
      pathname: "/blog/a",
      image: "//images.ctfassets.net/x/y.jpg",
    });
    expect(contentOfProperty(meta, "og:image")).toBe("https://images.ctfassets.net/x/y.jpg");
    // Without explicit alt, a post's own image is described by its title.
    expect(contentOfProperty(meta, "og:image:alt")).toBe("A post · Jimmy Van Veen");
  });

  it("mirrors the description into og:description, and omits it when absent", () => {
    expect(
      contentOfProperty(
        buildMeta({ title: "A", description: "Dek.", pathname: "/a" }),
        "og:description",
      ),
    ).toBe("Dek.");
    expect(
      contentOfProperty(buildMeta({ title: "A", pathname: "/a" }), "og:description"),
    ).toBeUndefined();
  });

  it("declares a large summary card", () => {
    // twitter:title/description/image are deliberately absent — X falls back
    // to the og:* equivalents, so duplicating them is dead weight.
    expect(contentOfName(buildMeta({ title: "A", pathname: "/a" }), "twitter:card")).toBe(
      "summary_large_image",
    );
  });
});

describe("articleJsonLd", () => {
  const base = {
    title: "The Window I Wanted to Work In",
    publishDate: "2026-07-05",
    pathname: "/blog/the-window-i-wanted-to-work-in",
  };

  it("describes the post with a Person author and an absolute mainEntityOfPage", () => {
    const ld = articleJsonLd({ ...base, description: "Atrium is a single calm window." });

    expect(ld).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "The Window I Wanted to Work In",
      description: "Atrium is a single calm window.",
      datePublished: "2026-07-05",
      author: { "@type": "Person", name: "Jimmy Van Veen" },
      mainEntityOfPage: `${SITE_URL}/blog/the-window-i-wanted-to-work-in`,
    });
  });

  it("uses a post's own Contentful author when it has one", () => {
    const ld = articleJsonLd({ ...base, author: "A Guest" });
    expect(ld["author"]).toEqual({ "@type": "Person", name: "A Guest" });
  });

  it("falls back to the site owner for a blank author, matching the rendered byline", () => {
    // PostHero renders `By {author ?? SITE_NAME}`. The markup claims an author,
    // so it has to agree with what the visitor actually sees.
    for (const author of [undefined, ""]) {
      expect(articleJsonLd({ ...base, author })["author"]).toEqual({
        "@type": "Person",
        name: "Jimmy Van Veen",
      });
    }
  });

  it("omits description entirely rather than emitting an empty one", () => {
    expect(articleJsonLd({ ...base, description: "" })).not.toHaveProperty("description");
    expect(articleJsonLd(base)).not.toHaveProperty("description");
  });
});

describe("buildMeta title fallback edge cases", () => {
  it("resolves to the bare site name when no title is given at all", () => {
    // The original `??` form produced "Jimmy Van Veen · Jimmy Van Veen" here.
    // Unreachable today since every route passes a title, but wrong.
    expect(titleOf(buildMeta({ pathname: "/x" }))).toBe("Jimmy Van Veen");
  });

  it("never emits a title that starts with the separator", () => {
    for (const title of [undefined, "", "   "]) {
      expect(titleOf(buildMeta({ title, pathname: "/x" }))?.startsWith(" ·")).toBe(false);
    }
  });

  it("never repeats the site name", () => {
    for (const title of [undefined, "", "   "]) {
      expect(titleOf(buildMeta({ title, pathname: "/x" }))).toBe("Jimmy Van Veen");
    }
  });
});
