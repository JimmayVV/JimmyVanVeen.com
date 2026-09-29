import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";

import { PostFooter } from "./post-footer";

function renderFooter(props: Parameters<typeof PostFooter>[0]) {
  const Stub = createRoutesStub([{ path: "/", Component: () => <PostFooter {...props} /> }]);
  return render(<Stub />);
}

describe("PostFooter", () => {
  it("invites a reply on each discussion thread, opening in a new tab", () => {
    renderFooter({
      publishDate: "2026-09-28",
      discussion: [
        { platform: "X", href: "https://x.com/JimmayVV/status/1" },
        { platform: "Bluesky", href: "https://bsky.app/profile/jimmyvanveen.com/post/abc" },
      ],
    });

    expect(screen.getByText("Disagree? Tell me.")).toBeTruthy();
    expect(screen.getByText("The conversation about this post is on X and Bluesky.")).toBeTruthy();

    const x = screen.getByRole("link", { name: "Reply on X" });
    expect(x.getAttribute("href")).toBe("https://x.com/JimmayVV/status/1");
    expect(x.getAttribute("target")).toBe("_blank");
    // Matches every other outbound link on the site: no opener, no referrer.
    expect(x.getAttribute("rel")).toBe("noreferrer");
    expect(screen.getByRole("link", { name: "Reply on Bluesky" }).getAttribute("href")).toBe(
      "https://bsky.app/profile/jimmyvanveen.com/post/abc",
    );
  });

  it("names only the platforms a post has a thread on", () => {
    renderFooter({
      publishDate: "2026-09-28",
      discussion: [{ platform: "X", href: "https://x.com/JimmayVV/status/1" }],
    });
    expect(screen.getByText("The conversation about this post is on X.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Reply on Bluesky" })).toBeNull();
  });

  it("omits the invitation entirely when the post has no threads", () => {
    renderFooter({ publishDate: "2026-09-28" });
    expect(screen.queryByText("Disagree? Tell me.")).toBeNull();
    // No slug, no share links: the buttons would have nothing to build.
    expect(screen.queryByRole("button", { name: /Copy link/ })).toBeNull();
    expect(screen.getByRole("link", { name: /All posts/ })).toBeTruthy();
  });

  it("offers share-link buttons when it knows the post's slug", () => {
    renderFooter({ publishDate: "2026-09-28", slug: "auto-merge-for-a-fleet-of-one" });
    expect(screen.getByRole("button", { name: "Copy link for X" })).toBeTruthy();
  });
});
