import { describe, expect, it } from "vitest";

import { framing, visibility } from "./scene-layout";

const layers = { boards: true, dimensions: true };

describe("visibility", () => {
  it("lays the 1995 rink over today's, with the added ice, in 'old inside new'", () => {
    expect(visibility("both", "stands", layers)).toMatchObject({
      old: false,
      modern: true,
      oldGhost: true,
      extraIce: true,
    });
  });

  it("shows both full models side by side, and nothing laid over", () => {
    expect(visibility("split", "stands", layers)).toMatchObject({
      old: true,
      modern: true,
      oldGhost: false,
      extraIce: false,
    });
  });

  it.each([
    ["old", { old: true, modern: false }],
    ["modern", { old: false, modern: true }],
  ] as const)("shows only one rink in '%s'", (mode, expected) => {
    expect(visibility(mode, "stands", layers)).toMatchObject({ ...expected, oldGhost: false });
  });

  it("hides dimension labels at ice level, where they float in front of the boards", () => {
    expect(visibility("both", "ice", layers).dimensions).toBe(false);
    expect(visibility("both", "overhead", layers).dimensions).toBe(true);
  });

  it("follows the boards and dimensions switches", () => {
    expect(visibility("both", "stands", { boards: false, dimensions: false })).toMatchObject({
      boards: false,
      dimensions: false,
    });
  });
});

describe("framing", () => {
  it("keeps the base field of view on a wide stage", () => {
    const f = framing(1600, 900, "both");
    expect(f.aspect).toBeCloseTo(1600 / 900, 6);
    expect(f.fov).toBeCloseTo(42, 6);
  });

  it("widens the view on a tall phone stage so the rink still fits across", () => {
    expect(framing(390, 488, "both").fov).toBeGreaterThan(60);
  });

  it("frames each half separately side by side", () => {
    const whole = framing(1600, 900, "both");
    const half = framing(1600, 900, "split");
    expect(half.aspect).toBeCloseTo(whole.aspect / 2, 6);
    expect(half.fov).toBeGreaterThan(whole.fov);
  });

  it("never lets the overhead view crop the 200 ft rink's width", () => {
    for (const [w, h] of [
      [1600, 900],
      [390, 488],
      [800, 800],
    ] as const) {
      expect(framing(w, h, "both").overheadHalfHeight).toBeGreaterThanOrEqual(70);
    }
  });
});
