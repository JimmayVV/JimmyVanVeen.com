import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { EXHIBITS, findExhibit } from "./registry";

describe("exhibit registry", () => {
  it("has unique slugs", () => {
    const slugs = EXHIBITS.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("registers a route for every exhibit, so the index and sitemap never link to a 404", () => {
    const routes = readFileSync(join(import.meta.dirname, "..", "routes.ts"), "utf8");
    for (const { slug } of EXHIBITS) {
      expect(routes).toContain(`route("${slug}", "routes/exhibits/${slug}.tsx")`);
    }
  });

  it.each(EXHIBITS)("$slug ships a 1200 × 630 PNG share card", ({ card }) => {
    const png = readFileSync(join(import.meta.dirname, "..", "..", "public", card.src));
    // PNG signature, then the IHDR chunk's width and height.
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([card.width, card.height]);
    expect(card.alt.length).toBeGreaterThan(40);
  });

  it("finds an exhibit by slug and refuses an unknown one", () => {
    expect(findExhibit("garden-ice").title).toBe("Garden ice");
    expect(() => findExhibit("nope")).toThrow('No exhibit registered for "nope"');
  });
});
