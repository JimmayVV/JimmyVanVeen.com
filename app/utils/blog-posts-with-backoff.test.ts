import { fromPartial } from "@total-typescript/shoehorn";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCachedBlogPosts = vi.fn();
vi.mock("./contentful-cache", () => ({
  getCachedBlogPosts: () => getCachedBlogPosts(),
}));

import {
  FAILURE_BACKOFF_MS,
  __resetBackoffForTesting,
  getBlogPostsWithBackoff,
} from "./blog-posts-with-backoff";

type Posts = Awaited<ReturnType<typeof import("./contentful-cache").getCachedBlogPosts>>;

describe("getBlogPostsWithBackoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetBackoffForTesting();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("returns the posts when the fetch succeeds", async () => {
    const posts: Posts = fromPartial([{}]);
    getCachedBlogPosts.mockResolvedValue(posts);

    expect(await getBlogPostsWithBackoff(1_000)).toBe(posts);
  });

  it("returns null on failure and does not retry inside the backoff window", async () => {
    getCachedBlogPosts.mockRejectedValue(new Error("rate limited"));

    expect(await getBlogPostsWithBackoff(1_000)).toBeNull();
    expect(await getBlogPostsWithBackoff(1_000 + FAILURE_BACKOFF_MS - 1)).toBeNull();
    expect(getCachedBlogPosts).toHaveBeenCalledTimes(1);
  });

  it("retries once the backoff window has passed and clears the failure on success", async () => {
    const posts: Posts = fromPartial([{}]);
    getCachedBlogPosts.mockRejectedValueOnce(new Error("down")).mockResolvedValue(posts);

    expect(await getBlogPostsWithBackoff(1_000)).toBeNull();
    expect(await getBlogPostsWithBackoff(1_000 + FAILURE_BACKOFF_MS)).toBe(posts);
    expect(await getBlogPostsWithBackoff(1_000 + FAILURE_BACKOFF_MS + 1)).toBe(posts);
    expect(getCachedBlogPosts).toHaveBeenCalledTimes(3);
  });
});
