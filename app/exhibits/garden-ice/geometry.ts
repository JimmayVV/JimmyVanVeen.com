/**
 * Rink geometry for the Garden Ice exhibit, in feet.
 *
 * Origin is the center dot. X runs along the rink, Z across it, and both rinks
 * share the red line. Ported from the original Garden / Ice study (v7); its
 * research notes are the source for every number and caveat here.
 */

export type RinkId = "old" | "modern";

export interface Rink {
  id: RinkId;
  name: string;
  season: string;
  /** Board-to-board length. */
  length: number;
  /** Board-to-board width. */
  width: number;
  /** Corner radius. Documented for TD (NHL rule 1.2); a placeholder for the old Garden. */
  corner: number;
  /** Goal line distance from the end boards. */
  goal: number;
  /** Blue line distance from the red line. */
  blue: number;
  /** Board height. */
  board: number;
  /** Net depth behind the goal line. */
  netDepth: number;
}

export const OLD_GARDEN: Rink = {
  id: "old",
  name: "Boston Garden",
  season: "1994–95",
  length: 191,
  width: 83,
  corner: 28,
  goal: 11,
  blue: 24.5,
  board: 4,
  netDepth: 4,
};

export const TD_GARDEN: Rink = {
  id: "modern",
  name: "TD Garden",
  season: "2026–27",
  length: 200,
  width: 85,
  corner: 28,
  goal: 11,
  blue: 25,
  board: 3.5,
  netDepth: 3.667,
};

/** The old-Garden values a visitor can adjust, because no survey pins them down. */
export const ASSUMPTION_RANGES = {
  corner: { min: 18, max: 36, step: 0.5 },
  goal: { min: 10, max: 13, step: 0.5 },
  blue: { min: 22, max: 27, step: 0.5 },
} as const;

export type Point = readonly [x: number, z: number];

/**
 * Board line as a closed loop of points, corners included, starting at the
 * +X/+Z corner and running counter-clockwise when viewed from above.
 */
export function perimeter(rink: Rink, segments = 24): Point[] {
  const a = rink.length / 2;
  const b = rink.width / 2;
  const r = rink.corner;
  const centers: [number, number, number][] = [
    [a - r, b - r, 0],
    [-a + r, b - r, 90],
    [-a + r, -b + r, 180],
    [a - r, -b + r, 270],
  ];
  const out: Point[] = [];
  for (const [cx, cz, start] of centers) {
    for (let i = 0; i <= segments; i++) {
      const t = ((start + (i / segments) * 90) * Math.PI) / 180;
      out.push([cx + r * Math.cos(t), cz + r * Math.sin(t)]);
    }
  }
  return out;
}

/** The four corner arcs on their own, for drawing the uncertain part differently. */
export function cornerArcs(rink: Rink, segments = 24): Point[][] {
  const loop = perimeter(rink, segments);
  const perCorner = segments + 1;
  return [0, 1, 2, 3].map((i) => loop.slice(i * perCorner, (i + 1) * perCorner));
}

/** Area of the ice inside the boards, in square feet. */
export function iceArea(rink: Rink): number {
  return rink.length * rink.width - (4 - Math.PI) * rink.corner * rink.corner;
}

/** Depth of each attacking zone: blue line to goal line. */
export function zoneDepth(rink: Rink): number {
  return rink.length / 2 - rink.goal - rink.blue;
}

export function lerpRink(from: Rink, to: Rink, t: number): Rink {
  const mix = (a: number, b: number) => a + (b - a) * t;
  return {
    ...(t < 0.5 ? from : to),
    length: mix(from.length, to.length),
    width: mix(from.width, to.width),
    corner: mix(from.corner, to.corner),
    goal: mix(from.goal, to.goal),
    blue: mix(from.blue, to.blue),
    board: mix(from.board, to.board),
    netDepth: mix(from.netDepth, to.netDepth),
  };
}

export type Unit = "ft" | "m";

const FEET_TO_METERS = 0.3048;

export function formatLength(feet: number, unit: Unit): string {
  if (unit === "m") return `${(feet * FEET_TO_METERS).toFixed(2)} m`;
  return `${Number(feet.toFixed(1))} ft`;
}

export function formatArea(squareFeet: number, unit: Unit): string {
  if (unit === "m") {
    return `${Math.round(squareFeet * FEET_TO_METERS * FEET_TO_METERS).toLocaleString("en-US")} m²`;
  }
  return `${Math.round(squareFeet).toLocaleString("en-US")} sq ft`;
}

/**
 * Planar fit of the ice in Troy Parla's circa-1995 photograph: a homography
 * from rink coordinates (x, z) to photo pixels. Both straight sideboards
 * constrain it. It aligns perspective; it is not a recovered camera or a
 * survey of the old corners.
 */
export const PARLA_PHOTO_FIT = {
  width: 1231,
  height: 848,
  h: [
    6.263037491702646, 5.94375655118276, 633.9366945487144, 1.9106924614405996,
    -0.031509756649329874, 614.5815680760039, 0.006435363011725744, -0.0014585106758910865, 1,
  ],
} as const;

/** Project a point on the ice into the photograph, in photo pixels. */
export function projectToPhoto([x, z]: Point): Point {
  const [a, b, c, d, e, f, g, h, i] = PARLA_PHOTO_FIT.h;
  const w = g * x + h * z + i;
  return [(a * x + b * z + c) / w, (d * x + e * z + f) / w];
}
