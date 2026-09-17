import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { isRecord } from "~/utils/is-record";
import { articleJsonLd, resolveAuthor } from "~/utils/seo";

import { PostHero } from "./post-hero";

/**
 * The byline exists because the `Article` structured data on a post claims an
 * author, and structured data may only describe content a visitor can actually
 * see. These assertions are the other half of `articleJsonLd`'s tests in
 * app/utils/seo.test.ts: if the two ever disagree about who wrote a post, the
 * markup is making a claim the page does not back up.
 */

describe("PostHero", () => {
  const base = {
    title: "The Window I Wanted to Work In",
    publishDate: "2026-07-05",
  };

  it("renders a visible byline naming the site owner by default", () => {
    render(<PostHero {...base} />);
    expect(screen.getByText(/By Jimmy Van Veen/)).toBeTruthy();
  });

  it("prefers a post's own author", () => {
    render(<PostHero {...base} author="A Guest" />);
    expect(screen.getByText(/By A Guest/)).toBeTruthy();
  });

  it("puts the byline, date, and reading time in one dateline", () => {
    render(<PostHero {...base} readingMinutes={4} />);
    expect(screen.getByText("By Jimmy Van Veen · July 5, 2026 · 4 min read")).toBeTruthy();
  });

  it("drops the reading time when there isn't one, without leaving a stray separator", () => {
    render(<PostHero {...base} />);
    expect(screen.getByText("By Jimmy Van Veen · July 5, 2026")).toBeTruthy();
  });

  // The case that was missing, and that a review caught. PostHero used `??`
  // while articleJsonLd used `||`; those agree on undefined and diverge on "".
  // A Contentful author field filled in and later cleared yields "".
  it.each(["", "   "])("falls back to the site owner for a blank author (%j)", (author) => {
    const { container } = render(<PostHero {...base} author={author} />);
    const dateline = container.querySelector(".dateline");
    expect(dateline?.textContent).toBe("By Jimmy Van Veen · July 5, 2026");
  });

  // The actual invariant: the visible byline and the name the Article markup
  // claims must be the same string for every input, or the structured data is
  // describing something the page does not show.
  it.each([undefined, "", "   ", "A Guest"])("byline and Article author agree for %j", (author) => {
    const { container } = render(<PostHero {...base} author={author} />);
    const dateline = container.querySelector(".dateline")?.textContent ?? "";

    const ld = articleJsonLd({
      title: base.title,
      publishDate: base.publishDate,
      author,
      pathname: "/blog/x",
    });

    // No `as` — narrow the JSON-LD author node the way the project requires.
    const node: unknown = ld["author"];
    expect(isRecord(node)).toBe(true);
    const claimed = isRecord(node) ? node["name"] : undefined;

    expect(typeof claimed).toBe("string");
    expect(claimed).toBe(resolveAuthor(author));
    expect(dateline).toContain(`By ${String(claimed)} ·`);
  });

  it("renders the title as the page's only h1", () => {
    render(<PostHero {...base} />);
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]?.textContent).toBe(base.title);
  });

  it("renders the dek only when the post has a description", () => {
    const { container, unmount } = render(<PostHero {...base} description="A calm window." />);
    expect(screen.getByText("A calm window.")).toBeTruthy();
    expect(container.querySelector(".dek")).not.toBeNull();
    unmount();

    const bare = render(<PostHero {...base} />);
    expect(bare.container.querySelector(".dek")).toBeNull();
  });
});
