import { describe, expect, it } from "vitest";

import { readingStats } from "./reading-time";

describe("readingStats", () => {
  it("returns zero words and minimum 1 minute for empty input", () => {
    expect(readingStats("")).toEqual({ words: 0, minutes: 1, long: false });
    expect(readingStats(null)).toEqual({ words: 0, minutes: 1, long: false });
    expect(readingStats(undefined)).toEqual({
      words: 0,
      minutes: 1,
      long: false,
    });
  });

  it("counts plain prose words", () => {
    const { words } = readingStats(
      "the quick brown fox jumps over the lazy dog",
    );
    expect(words).toBe(9);
  });

  it("strips fenced code blocks before counting", () => {
    const md = [
      "Some prose here.",
      "```js",
      "const a = 1;",
      "const b = 2;",
      "```",
      "More prose.",
    ].join("\n");
    const { words } = readingStats(md);
    // "Some prose here. More prose." = 5 words
    expect(words).toBe(5);
  });

  it("strips inline backtick code", () => {
    const { words } = readingStats("Use `Array.prototype.map` carefully");
    expect(words).toBe(2); // Use, carefully
  });

  it("preserves link text but drops URLs", () => {
    const { words } = readingStats(
      "See [the docs](https://example.com/foo) for more",
    );
    expect(words).toBe(5); // See, the, docs, for, more
  });

  it("does not split hyphenated words", () => {
    const { words } = readingStats(
      "self-contained well-written runtime-only code",
    );
    expect(words).toBe(4);
  });

  it("strips list markers but keeps item content", () => {
    const md = ["- first item", "- second item", "- third item"].join("\n");
    const { words } = readingStats(md);
    expect(words).toBe(6);
  });

  it("strips ATX heading markers without dropping the heading text", () => {
    const md = ["# Title here", "## Subheading text", "### Smaller one"].join(
      "\n",
    );
    const { words } = readingStats(md);
    // Title, here, Subheading, text, Smaller, one
    expect(words).toBe(6);
  });

  it("strips numbered list markers", () => {
    const md = ["1. first item", "2. second item", "12. twelfth item"].join(
      "\n",
    );
    const { words } = readingStats(md);
    expect(words).toBe(6);
  });

  it("preserves identifiers with underscores and hash characters", () => {
    const { words } = readingStats("Use super_fast and C# in your code");
    // Use, super_fast, and, C#, in, your, code
    expect(words).toBe(7);
  });

  it("flags long posts at the 400-word threshold", () => {
    const shortPost = "word ".repeat(399).trim();
    const longPost = "word ".repeat(400).trim();
    expect(readingStats(shortPost).long).toBe(false);
    expect(readingStats(longPost).long).toBe(true);
  });

  it("computes minutes at ~220 wpm with a 1-minute floor", () => {
    expect(readingStats("word ".repeat(50)).minutes).toBe(1);
    expect(readingStats("word ".repeat(220)).minutes).toBe(1);
    expect(readingStats("word ".repeat(440)).minutes).toBe(2);
    expect(readingStats("word ".repeat(660)).minutes).toBe(3);
  });
});
