import { describe, expect, it } from "vitest";

import {
  OLD_GARDEN,
  TD_GARDEN,
  cornerArcs,
  formatArea,
  formatLength,
  iceArea,
  lerpRink,
  perimeter,
  projectToPhoto,
  zoneDepth,
} from "./geometry";

function extent(points: readonly (readonly [number, number])[]) {
  const xs = points.map(([x]) => x);
  const zs = points.map(([, z]) => z);
  return { length: Math.max(...xs) - Math.min(...xs), width: Math.max(...zs) - Math.min(...zs) };
}

describe("rink geometry", () => {
  it.each([OLD_GARDEN, TD_GARDEN])("$name spans exactly its documented size", (rink) => {
    const { length, width } = extent(perimeter(rink));
    expect(length).toBeCloseTo(rink.length, 6);
    expect(width).toBeCloseTo(rink.width, 6);
  });

  it("keeps the documented envelope when the corner guess changes", () => {
    const { length, width } = extent(perimeter({ ...OLD_GARDEN, corner: 20 }));
    expect(length).toBeCloseTo(191, 6);
    expect(width).toBeCloseTo(83, 6);
  });

  it("splits the boards into four corner arcs that meet the straight sides", () => {
    const arcs = cornerArcs(TD_GARDEN);
    expect(arcs).toHaveLength(4);
    // The first arc runs from the +X end to the +Z side, tangent to both.
    expect(arcs[0]?.[0]).toEqual([100, 42.5 - 28]);
    expect(arcs[0]?.at(-1)?.[0]).toBeCloseTo(100 - 28, 6);
    expect(arcs[0]?.at(-1)?.[1]).toBeCloseTo(42.5, 6);
  });

  it("gives TD about 1,147 more square feet of ice, 7.6% more", () => {
    const extra = iceArea(TD_GARDEN) - iceArea(OLD_GARDEN);
    expect(extra).toBeCloseTo(1147, 0);
    expect((extra / iceArea(OLD_GARDEN)) * 100).toBeCloseTo(7.56, 2);
  });

  it("puts the extra length into the attacking zones", () => {
    expect(zoneDepth(OLD_GARDEN)).toBe(60);
    expect(zoneDepth(TD_GARDEN)).toBe(64);
  });

  it("interpolates between the eras and lands on each exactly", () => {
    expect(lerpRink(OLD_GARDEN, TD_GARDEN, 0).length).toBe(191);
    expect(lerpRink(OLD_GARDEN, TD_GARDEN, 1).length).toBe(200);
    expect(lerpRink(OLD_GARDEN, TD_GARDEN, 0.5).width).toBe(84);
    // The markings switch style (crease shape, trapezoid) at the halfway point.
    expect(lerpRink(OLD_GARDEN, TD_GARDEN, 0.49).id).toBe("old");
    expect(lerpRink(OLD_GARDEN, TD_GARDEN, 0.51).id).toBe("modern");
  });
});

describe("units", () => {
  it("formats feet without trailing zeros and meters to the centimeter", () => {
    expect(formatLength(191, "ft")).toBe("191 ft");
    expect(formatLength(24.5, "ft")).toBe("24.5 ft");
    expect(formatLength(200, "m")).toBe("60.96 m");
  });

  it("formats areas with separators", () => {
    expect(formatArea(16327.4, "ft")).toBe("16,327 sq ft");
    expect(formatArea(16327.4, "m")).toBe("1,517 m²");
  });
});

describe("the fitted photograph", () => {
  // Hand-picked in the original study: where the old blue lines and the red line
  // meet the sideboards in Troy Parla's photo, in photo pixels.
  const landmarks = [
    { ice: [0, -41.5], photo: [363, 581] },
    { ice: [0, 41.5], photo: [938, 654] },
    { ice: [24.5, -41.5], photo: [445, 544] },
    { ice: [24.5, 41.5], photo: [946, 601] },
    { ice: [-24.5, -41.5], photo: [260, 630] },
    { ice: [-24.5, 41.5], photo: [928, 724] },
  ] as const;

  // The fit is least-squares over these points, so a few pixels of residual is
  // expected; the worst is 3.6 px on a 1231-px-wide photograph.
  it.each(landmarks)("projects $ice onto the photo within 4 px of $photo", ({ ice, photo }) => {
    const [u, v] = projectToPhoto(ice);
    expect(Math.hypot(u - photo[0], v - photo[1])).toBeLessThan(4);
  });
});
