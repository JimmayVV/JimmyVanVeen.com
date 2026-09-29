import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it, vi } from "vitest";

import { isRecord } from "~/utils/is-record";

vi.mock("~/utils/contentful-cache", () => ({ getCachedBlogPostBySlug: vi.fn() }));
vi.mock("~/utils/analytics-loader", () => ({ trackPageView: vi.fn() }));

import { meta } from "./$slug";

type MetaArgs = Parameters<typeof meta>[0];

function property(descriptors: ReturnType<typeof meta>, name: string): string | undefined {
  for (const descriptor of descriptors) {
    const d: unknown = descriptor;
    if (isRecord(d) && d["property"] === name && typeof d["content"] === "string") {
      return d["content"];
    }
  }
  return undefined;
}

const ogImage = (descriptors: ReturnType<typeof meta>) => property(descriptors, "og:image");

const defaultFields: Record<string, unknown> = {
  title: "Auto-Merge for a Fleet of One",
  publishDate: "2026-09-28",
};

const argsFor = (fields: Record<string, unknown>) =>
  fromPartial<MetaArgs>({
    params: { slug: "auto-merge-for-a-fleet-of-one" },
    loaderData: { fields: { ...defaultFields, ...fields } },
  });

describe("blog post meta", () => {
  it("shares the rendered card when the post has no image of its own", () => {
    expect(ogImage(meta(argsFor({})))).toBe(
      "https://www.jimmyvanveen.com/og/blog/auto-merge-for-a-fleet-of-one",
    );
  });

  it("shares the post's own Contentful image when it has one", () => {
    const withImage = argsFor({
      image: { fields: { file: { url: "//images.ctfassets.net/space/asset/cover.jpg" } } },
    });

    expect(ogImage(meta(withImage))).toBe("https://images.ctfassets.net/space/asset/cover.jpg");
  });

  it("sizes the rendered card, and leaves a Contentful image unsized", () => {
    const card = meta(argsFor({}));
    expect(property(card, "og:image:width")).toBe("1200");
    expect(property(card, "og:image:height")).toBe("630");

    const withImage = meta(
      argsFor({ image: { fields: { file: { url: "//images.ctfassets.net/a/b/c.jpg" } } } }),
    );
    expect(property(withImage, "og:image:width")).toBeUndefined();
  });

  it("carries the article's publish date and author", () => {
    const descriptors = meta(argsFor({}));
    expect(property(descriptors, "article:published_time")).toBe("2026-09-28");
    expect(property(descriptors, "article:author")).toBe("https://www.jimmyvanveen.com/about");
  });
});
