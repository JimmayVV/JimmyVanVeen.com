import { fromPartial } from "@total-typescript/shoehorn";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Contentful fetchers so we can assert whether a cache miss or a
// validation fall-through actually triggers a fresh fetch.
vi.mock("./contentful", () => ({
  getProjects: vi.fn(),
  getAllBlogPosts: vi.fn(),
  getBlogPostBySlug: vi.fn(),
}));

// Mock the Netlify Blobs store. In the test env `NODE_ENV` is "test" (not
// "development"), so `getCachedData` takes the Netlify Blobs branch and reads
// through `getWithMetadata`.
const getWithMetadata = vi.fn();
const setJSON = vi.fn();
vi.mock("@netlify/blobs", () => ({
  getStore: vi.fn(() => ({
    getWithMetadata,
    setJSON,
    list: vi.fn(),
    delete: vi.fn(),
    getMetadata: vi.fn(),
  })),
}));

import * as contentful from "./contentful";
import { getCachedProjects } from "./contentful-cache";

type Projects = Awaited<ReturnType<typeof contentful.getProjects>>;

describe("contentful-cache validation guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the cached value when the blob is a fresh, well-typed array", async () => {
    const cached: Projects = fromPartial([{}]);
    getWithMetadata.mockResolvedValue({ data: { data: cached, timestamp: Date.now() } });

    const result = await getCachedProjects();

    expect(result).toBe(cached);
    expect(contentful.getProjects).not.toHaveBeenCalled();
  });

  it("refetches when the cached payload fails the type guard (not an array)", async () => {
    const fresh: Projects = fromPartial([{}]);
    vi.mocked(contentful.getProjects).mockResolvedValue(fresh);
    // `data` is an object, not an array — `isProjects` (Array.isArray) rejects it.
    getWithMetadata.mockResolvedValue({
      data: { data: { not: "an array" }, timestamp: Date.now() },
    });

    const result = await getCachedProjects();

    expect(contentful.getProjects).toHaveBeenCalledOnce();
    expect(result).toBe(fresh);
  });

  it("refetches when the cache-entry wrapper is malformed (no timestamp)", async () => {
    const fresh: Projects = fromPartial([{}]);
    vi.mocked(contentful.getProjects).mockResolvedValue(fresh);
    // Missing `timestamp` — `isCacheEntry` rejects the wrapper entirely.
    getWithMetadata.mockResolvedValue({ data: { data: [{ id: "stale" }] } });

    const result = await getCachedProjects();

    expect(contentful.getProjects).toHaveBeenCalledOnce();
    expect(result).toBe(fresh);
  });

  it("refetches when the cached entry is expired", async () => {
    const fresh: Projects = fromPartial([{}]);
    vi.mocked(contentful.getProjects).mockResolvedValue(fresh);
    // timestamp epoch 0 — age far exceeds the TTL.
    getWithMetadata.mockResolvedValue({ data: { data: [{ id: "old" }], timestamp: 0 } });

    const result = await getCachedProjects();

    expect(contentful.getProjects).toHaveBeenCalledOnce();
    expect(result).toBe(fresh);
  });

  it("refetches when the blob store has no cached entry", async () => {
    const fresh: Projects = fromPartial([{}]);
    vi.mocked(contentful.getProjects).mockResolvedValue(fresh);
    getWithMetadata.mockResolvedValue(null);

    const result = await getCachedProjects();

    expect(contentful.getProjects).toHaveBeenCalledOnce();
    expect(result).toBe(fresh);
  });
});
