import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { CENTER_ICE } from "./center-ice";

const PUBLIC_DIR = join(import.meta.dirname, "..", "..", "..", "public");

describe("center-ice art", () => {
  it.each(Object.entries(CENTER_ICE))("%s ships a self-contained SVG", (_id, art) => {
    const svg = readFileSync(join(PUBLIC_DIR, art.src), "utf8");
    expect(svg).toMatch(/^<svg /);
    // Drawn from an <img> into a canvas: nothing to run and nothing to fetch.
    expect(svg).not.toMatch(/<script|\son\w+=|<foreignObject/i);
    expect(svg).not.toMatch(/href="(?!#)/);
  });

  it("paints the 1995 ring 14.4 ft across and today's B across the 30 ft center circle", () => {
    // The 1995 SVG is 2100 units wide with a 715-unit ring radius.
    expect((CENTER_ICE.old.size * 1430) / 2100).toBeCloseTo(14.4, 1);
    // Today's is 236 units wide with a 113-unit radius.
    expect((CENTER_ICE.modern.size * 226) / 236).toBeCloseTo(30, 0);
  });
});
