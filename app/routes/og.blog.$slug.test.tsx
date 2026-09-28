import { fromPartial } from "@total-typescript/shoehorn";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCachedBlogPostBySlug = vi.fn();
vi.mock("~/utils/contentful-cache", () => ({
  getCachedBlogPostBySlug: (slug: string) => getCachedBlogPostBySlug(slug),
}));

const renderShareCard = vi.fn();
vi.mock("~/og/share-card.server", () => ({
  renderShareCard: (post: unknown) => renderShareCard(post),
}));

import { loader } from "./og.blog.$slug";

type LoaderArgs = Parameters<typeof loader>[0];

const argsFor = (slug: string) => fromPartial<LoaderArgs>({ params: { slug } });

describe("/og/blog/:slug", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders the post's card as a cacheable PNG", async () => {
    getCachedBlogPostBySlug.mockResolvedValue({
      fields: {
        title: "Auto-Merge for a Fleet of One",
        description: "Two weeks later it had merged one pull request by itself.",
        publishDate: "2026-09-28",
      },
    });
    renderShareCard.mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4e, 0x47]));

    const response = await loader(argsFor("auto-merge-for-a-fleet-of-one"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400");
    expect(response.headers.get("Netlify-CDN-Cache-Control")).toBe(
      "public, durable, s-maxage=86400",
    );
    expect(renderShareCard).toHaveBeenCalledWith({
      title: "Auto-Merge for a Fleet of One",
      description: "Two weeks later it had merged one pull request by itself.",
      publishDate: "2026-09-28",
    });
  });

  it("passes an empty description through as absent", async () => {
    getCachedBlogPostBySlug.mockResolvedValue({
      fields: { title: "Conditional Prop Types", description: "", publishDate: "2022-12-21" },
    });
    renderShareCard.mockResolvedValue(new Uint8Array([0x89]));

    await loader(argsFor("conditional-prop-types"));

    expect(renderShareCard).toHaveBeenCalledWith({
      title: "Conditional Prop Types",
      description: undefined,
      publishDate: "2022-12-21",
    });
  });

  it("answers an unknown slug with a 404 instead of a generic card", async () => {
    getCachedBlogPostBySlug.mockRejectedValue(new Error("Blog post not found: nope"));

    const response = await loader(argsFor("nope"));

    expect(response.status).toBe(404);
    expect(renderShareCard).not.toHaveBeenCalled();
  });

  it("answers a render failure with a 500 and logs it", async () => {
    getCachedBlogPostBySlug.mockResolvedValue({ fields: { title: "A post" } });
    renderShareCard.mockRejectedValue(new Error("wasm aborted"));

    const response = await loader(argsFor("a-post"));

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith(
      "Share card render failed",
      expect.objectContaining({ slug: "a-post" }),
    );
  });
});
