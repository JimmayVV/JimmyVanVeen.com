import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
