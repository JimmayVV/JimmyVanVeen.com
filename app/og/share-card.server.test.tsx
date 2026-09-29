// @vitest-environment node
// Satori resolves its browser build under happy-dom, where its layout engine never
// initialises. The card only ever renders on the server.

import { describe, expect, it } from "vitest";

import {
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
  cardKicker,
  clampText,
  renderShareCard,
  titleSize,
} from "./share-card.server";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  // IHDR is always the first chunk: width and height sit at bytes 16 and 20.
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe("renderShareCard", () => {
  it("renders a PNG at the size X and Bluesky expect for large cards", async () => {
    const png = await renderShareCard({
      title: "Auto-Merge for a Fleet of One",
      description:
        "I copied Amplitude's risk-scored auto-merge onto my own repos. Two weeks later it had merged one pull request by itself.",
      publishDate: "2026-09-28",
    });

    expect(Array.from(png.subarray(0, 8))).toEqual(PNG_SIGNATURE);
    expect(pngSize(png)).toEqual({ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT });
  });

  it("renders without a description or date", async () => {
    const png = await renderShareCard({ title: "Conditional Prop Types" });
    expect(pngSize(png)).toEqual({ width: SHARE_CARD_WIDTH, height: SHARE_CARD_HEIGHT });
  });
});

describe("titleSize", () => {
  it("steps down as titles get longer", () => {
    const short = titleSize("Conditional Prop Types");
    const medium = titleSize("Auto-Merge for a Fleet of One: two weeks of data");
    const long = titleSize(
      "Never Put Your Work Down: A Git Worktrees Workflow for Constant Context-Switching",
    );
    expect(short).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(long);
  });
});

describe("clampText", () => {
  it("leaves short text alone", () => {
    expect(clampText("short", 20)).toBe("short");
  });

  it("cuts at a word boundary and adds an ellipsis", () => {
    expect(clampText("the quick brown fox jumps over", 17)).toBe("the quick brown…");
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(clampText("first clause, second clause", 14)).toBe("first clause…");
  });
});

describe("cardKicker", () => {
  it("puts the date in the top line, clear of the platform label in the bottom corner", () => {
    expect(cardKicker("2026-09-28")).toBe("JIMMYVANVEEN.COM / BLOG · SEPTEMBER 28, 2026");
  });

  it("leaves the date off when the post has none", () => {
    expect(cardKicker()).toBe("JIMMYVANVEEN.COM / BLOG");
  });
});
