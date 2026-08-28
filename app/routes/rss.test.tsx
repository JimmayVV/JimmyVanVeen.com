import { fromPartial } from "@total-typescript/shoehorn";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCachedBlogPosts = vi.fn();
vi.mock("~/utils/contentful-cache", () => ({
  getCachedBlogPosts: () => getCachedBlogPosts(),
}));

import { __resetBackoffForTesting } from "~/utils/blog-posts-with-backoff";

import { loader } from "./rss[.]xml";

type Entries = Awaited<ReturnType<typeof import("~/utils/contentful-cache").getCachedBlogPosts>>;

const entry = (fields: Record<string, unknown>) => fromPartial<Entries[number]>({ fields });

describe("/rss.xml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetBackoffForTesting();
  });

  it("serves a full-text feed of the published posts", async () => {
    getCachedBlogPosts.mockResolvedValue([
      entry({
        title: "The Memory That Never Recalled",
        slug: "the-memory-that-never-recalled",
        body: "Three weeks earlier I had written this down.",
        publishDate: "2026-08-26T00:00:00.000Z",
        description: "Under a dollar, measured nothing.",
      }),
    ]);

    const response = await loader();
    const xml = await response.text();

    expect(response.headers.get("Content-Type")).toBe("application/rss+xml; charset=utf-8");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=3600");
    expect(xml).toContain("<title>The Memory That Never Recalled</title>");
    expect(xml).toContain(
      "<link>https://www.jimmyvanveen.com/blog/the-memory-that-never-recalled</link>",
    );
    expect(xml).toContain("<![CDATA[<p>Three weeks earlier I had written this down.</p>]]>");
  });

  it("drops entries missing the fields a feed item needs", async () => {
    getCachedBlogPosts.mockResolvedValue([
      entry({ title: "No slug", body: "x", publishDate: "2026-01-01T00:00:00.000Z" }),
      entry({ title: "Ok", slug: "ok", body: "x", publishDate: "2026-01-01T00:00:00.000Z" }),
    ]);

    const xml = await (await loader()).text();

    expect(xml).not.toContain("No slug");
    expect(xml).toContain("<title>Ok</title>");
  });

  it("serves an empty feed with a short cache when Contentful fails", async () => {
    getCachedBlogPosts.mockRejectedValue(new Error("rate limited"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await loader();
    const xml = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=300");
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
    expect(consoleError).toHaveBeenCalled();
  });
});
