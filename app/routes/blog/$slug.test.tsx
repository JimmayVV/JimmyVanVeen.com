import { fromPartial } from "@total-typescript/shoehorn";
import { describe, expect, it, vi } from "vitest";

import { isRecord } from "~/utils/is-record";

vi.mock("~/utils/contentful-cache", () => ({ getCachedBlogPostBySlug: vi.fn() }));
vi.mock("~/utils/analytics-loader", () => ({ trackPageView: vi.fn() }));

import { meta } from "./$slug";

type MetaArgs = Parameters<typeof meta>[0];

function ogImage(descriptors: ReturnType<typeof meta>): string | undefined {
  for (const descriptor of descriptors) {
    const d: unknown = descriptor;
    if (isRecord(d) && d["property"] === "og:image" && typeof d["content"] === "string") {
      return d["content"];
    }
  }
  return undefined;
}

const argsFor = (fields: Record<string, unknown>) =>
  fromPartial<MetaArgs>({
    params: { slug: "auto-merge-for-a-fleet-of-one" },
    loaderData: { fields: { title: "Auto-Merge for a Fleet of One", ...fields } },
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
});
