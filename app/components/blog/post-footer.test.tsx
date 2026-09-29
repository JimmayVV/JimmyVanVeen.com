import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { PostFooter } from "./post-footer";

function renderFooter(props: Parameters<typeof PostFooter>[0]) {
  const Stub = createRoutesStub([{ path: "/", Component: () => <PostFooter {...props} /> }]);
  return render(<Stub />);
}

describe("PostFooter", () => {
  it("links each discussion thread, opening in a new tab", () => {
    renderFooter({
      publishDate: "2026-09-28",
      discussion: [
        { platform: "X", href: "https://x.com/JimmayVV/status/1" },
        { platform: "Bluesky", href: "https://bsky.app/profile/jimmyvanveen.com/post/abc" },
      ],
    });

    const x = screen.getByRole("link", { name: "X" });
    expect(x.getAttribute("href")).toBe("https://x.com/JimmayVV/status/1");
    expect(x.getAttribute("target")).toBe("_blank");
    // Matches every other outbound link on the site: no opener, no referrer.
    expect(x.getAttribute("rel")).toBe("noreferrer");
    expect(screen.getByRole("link", { name: "Bluesky" }).getAttribute("href")).toBe(
      "https://bsky.app/profile/jimmyvanveen.com/post/abc",
    );
    expect(screen.getByText(/Discuss this post on/).textContent).toBe(
      "Discuss this post on X or Bluesky.",
    );
  });

  it("omits the line entirely when the post has no threads", () => {
    renderFooter({ publishDate: "2026-09-28" });
    expect(screen.queryByText(/Discuss this post on/)).toBeNull();
    expect(screen.getByRole("link", { name: /All posts/ })).toBeTruthy();
  });

  it("offers share-link buttons when it knows the post's slug", () => {
    renderFooter({ publishDate: "2026-09-28", slug: "auto-merge-for-a-fleet-of-one" });
    expect(screen.getByRole("button", { name: "Copy link for X" })).toBeTruthy();
  });
});
