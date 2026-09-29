import { describe, expect, it } from "vitest";

import { shareUrl } from "./share-links";

describe("shareUrl", () => {
  it("tags the post link with its platform and campaign", () => {
    expect(shareUrl("auto-merge-for-a-fleet-of-one", "x")).toBe(
      "https://www.jimmyvanveen.com/blog/auto-merge-for-a-fleet-of-one?ref=x&campaign=auto-merge-for-a-fleet-of-one",
    );
  });

  it("uses each platform's own ref", () => {
    expect(shareUrl("do-hard-things", "linkedin")).toBe(
      "https://www.jimmyvanveen.com/blog/do-hard-things?ref=linkedin&campaign=do-hard-things",
    );
    expect(shareUrl("do-hard-things", "bsky")).toBe(
      "https://www.jimmyvanveen.com/blog/do-hard-things?ref=bsky&campaign=do-hard-things",
    );
  });

  it("keeps a mixed-case slug exactly as published", () => {
    expect(shareUrl("type-createAsyncThunk", "x")).toBe(
      "https://www.jimmyvanveen.com/blog/type-createAsyncThunk?ref=x&campaign=type-createAsyncThunk",
    );
  });
});
