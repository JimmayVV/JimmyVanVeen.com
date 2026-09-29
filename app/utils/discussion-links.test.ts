import { describe, expect, it } from "vitest";

import { discussionLinks } from "./discussion-links";

describe("discussionLinks", () => {
  it("lists X then Bluesky when both threads are set", () => {
    expect(
      discussionLinks({
        xThreadUrl: "https://x.com/JimmayVV/status/1972500000000000000",
        blueskyThreadUrl: "https://bsky.app/profile/jimmyvanveen.com/post/3lzabc123",
      }),
    ).toEqual([
      { platform: "X", href: "https://x.com/JimmayVV/status/1972500000000000000" },
      { platform: "Bluesky", href: "https://bsky.app/profile/jimmyvanveen.com/post/3lzabc123" },
    ]);
  });

  it("accepts twitter.com links and trims stray whitespace", () => {
    expect(discussionLinks({ xThreadUrl: "  https://twitter.com/JimmayVV/status/123  " })).toEqual([
      { platform: "X", href: "https://twitter.com/JimmayVV/status/123" },
    ]);
  });

  it("returns nothing when neither field is set", () => {
    expect(discussionLinks({})).toEqual([]);
    expect(discussionLinks({ xThreadUrl: "", blueskyThreadUrl: null })).toEqual([]);
  });

  it("drops a link that isn't a post on the platform it's labelled with", () => {
    expect(
      discussionLinks({
        xThreadUrl: "https://evil.example/JimmayVV/status/1",
        blueskyThreadUrl: "javascript:alert(1)",
      }),
    ).toEqual([]);
    expect(discussionLinks({ xThreadUrl: "https://x.com.evil.example/a/status/1" })).toEqual([]);
    expect(discussionLinks({ xThreadUrl: "http://x.com/JimmayVV/status/1" })).toEqual([]);
  });
});
