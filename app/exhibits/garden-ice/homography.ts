/**
 * Perspective mapping from the ice to a photograph.
 *
 * The ice is flat, so any photo of it relates to rink coordinates by a
 * homography: a 3×3 matrix fixed by four point pairs. The photo lab stores, for
 * each photograph, where the four corners of the rink would sit in it, and
 * everything drawn on the photo is projected through the matrix those corners
 * define. Only the ice plane is mapped; the tops of the boards are not.
 */
import { type Point, type Rink } from "./geometry";

/** Row-major 3×3 matrix mapping (x, z, 1) on the ice to (u, v, w) in the photo. */
export type Homography = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/**
 * The four corners of the rink's rectangle, before the corners are rounded:
 * where the straight boards would meet. In this order: (+x, +z), (−x, +z),
 * (−x, −z), (+x, −z).
 */
export function rinkCorners(rink: Rink): [Point, Point, Point, Point] {
  const a = rink.length / 2;
  const b = rink.width / 2;
  return [
    [a, b],
    [-a, b],
    [-a, -b],
    [a, -b],
  ];
}

/**
 * A point a visitor can find in almost any photo of a rink: where a line on the
 * ice meets the boards, or the center dot. The photo lab pins its handles to
 * four of these.
 */
export type Landmark =
  | "red-far"
  | "red-near"
  | "blue-left-far"
  | "blue-left-near"
  | "blue-right-far"
  | "blue-right-near"
  | "goal-left-far"
  | "goal-left-near"
  | "goal-right-far"
  | "goal-right-near"
  | "net-left"
  | "net-right"
  | "dot-left-far"
  | "dot-left-near"
  | "dot-right-far"
  | "dot-right-near"
  | "neutral-left-far"
  | "neutral-left-near"
  | "neutral-right-far"
  | "neutral-right-near"
  | "center";

export const LANDMARK_LABELS: Record<Landmark, string> = {
  "red-far": "Red line, far boards",
  "red-near": "Red line, near boards",
  "blue-left-far": "Left blue line, far boards",
  "blue-left-near": "Left blue line, near boards",
  "blue-right-far": "Right blue line, far boards",
  "blue-right-near": "Right blue line, near boards",
  "goal-left-far": "Left goal line, far boards",
  "goal-left-near": "Left goal line, near boards",
  "goal-right-far": "Right goal line, far boards",
  "goal-right-near": "Right goal line, near boards",
  "net-left": "Left net, middle of the goal line",
  "net-right": "Right net, middle of the goal line",
  "dot-left-far": "Left end-zone faceoff dot, far side",
  "dot-left-near": "Left end-zone faceoff dot, near side",
  "dot-right-far": "Right end-zone faceoff dot, far side",
  "dot-right-near": "Right end-zone faceoff dot, near side",
  "neutral-left-far": "Left neutral-zone dot, far side",
  "neutral-left-near": "Left neutral-zone dot, near side",
  "neutral-right-far": "Right neutral-zone dot, far side",
  "neutral-right-near": "Right neutral-zone dot, near side",
  center: "Center dot",
};

/**
 * Where a landmark sits on the ice, with +x to the right and +z away from the
 * camera, so "far" and "left" read the way they look in the photo.
 */
export function landmarkPoint(rink: Rink, landmark: Landmark): Point {
  const far = rink.width / 2;
  const goalX = rink.length / 2 - rink.goal;
  // A goal line meets the boards partway round the corner curve.
  const cornerStart = rink.length / 2 - rink.corner;
  const goalZ =
    rink.width / 2 -
    rink.corner +
    Math.sqrt(Math.max(0, rink.corner ** 2 - (goalX - cornerStart) ** 2));
  const table: Record<Landmark, Point> = {
    "red-far": [0, far],
    "red-near": [0, -far],
    "blue-left-far": [-rink.blue, far],
    "blue-left-near": [-rink.blue, -far],
    "blue-right-far": [rink.blue, far],
    "blue-right-near": [rink.blue, -far],
    "goal-left-far": [-goalX, goalZ],
    "goal-left-near": [-goalX, -goalZ],
    "goal-right-far": [goalX, goalZ],
    "goal-right-near": [goalX, -goalZ],
    "net-left": [-goalX, 0],
    "net-right": [goalX, 0],
    "dot-left-far": [-(goalX - 20), 22],
    "dot-left-near": [-(goalX - 20), -22],
    "dot-right-far": [goalX - 20, 22],
    "dot-right-near": [goalX - 20, -22],
    "neutral-left-far": [-(rink.blue - 5), 22],
    "neutral-left-near": [-(rink.blue - 5), -22],
    "neutral-right-far": [rink.blue - 5, 22],
    "neutral-right-near": [rink.blue - 5, -22],
    center: [0, 0],
  };
  return table[landmark];
}

/** Solve a small dense linear system by Gaussian elimination with partial pivoting. */
function solve(matrix: number[][], rhs: number[]): number[] | null {
  const n = rhs.length;
  const m = matrix.map((row, i) => [...row, rhs[i] ?? 0]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(m[r]?.[col] ?? 0) > Math.abs(m[pivot]?.[col] ?? 0)) pivot = r;
    }
    const pivotRow = m[pivot];
    const current = m[col];
    if (!pivotRow || !current || Math.abs(pivotRow[col] ?? 0) < 1e-12) return null;
    m[pivot] = current;
    m[col] = pivotRow;
    for (let r = 0; r < n; r++) {
      const row = m[r];
      if (r === col || !row) continue;
      const factor = (row[col] ?? 0) / (pivotRow[col] ?? 1);
      for (let c = col; c <= n; c++) row[c] = (row[c] ?? 0) - factor * (pivotRow[c] ?? 0);
    }
  }
  return m.map((row, i) => (row[n] ?? 0) / (row[i] ?? 1));
}

/**
 * The homography taking each of four points on the ice to its place in the
 * photo. Null when the points are degenerate (three of them in a line).
 */
export function solveHomography(ice: readonly Point[], photo: readonly Point[]): Homography | null {
  if (ice.length !== 4 || photo.length !== 4) return null;
  const rows: number[][] = [];
  const rhs: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, z] = ice[i] ?? [0, 0];
    const [u, v] = photo[i] ?? [0, 0];
    rows.push([x, z, 1, 0, 0, 0, -u * x, -u * z]);
    rhs.push(u);
    rows.push([0, 0, 0, x, z, 1, -v * x, -v * z]);
    rhs.push(v);
  }
  const h = solve(rows, rhs);
  if (!h || h.some((value) => !Number.isFinite(value))) return null;
  const [a = 0, b = 0, c = 0, d = 0, e = 0, f = 0, g = 0, k = 0] = h;
  return [a, b, c, d, e, f, g, k, 1];
}

/** Where a point on the ice lands in the photo, or null if it is behind the camera. */
export function project(h: Homography, [x, z]: Point): Point | null {
  const [a, b, c, d, e, f, g, k, i] = h;
  const w = g * x + k * z + i;
  if (w <= 1e-9) return null;
  return [(a * x + b * z + c) / w, (d * x + e * z + f) / w];
}

/**
 * An SVG path through the projected points. Runs that cross behind the camera
 * are broken rather than joined across the horizon.
 */
export function projectedPath(h: Homography, points: readonly Point[], close: boolean): string {
  let d = "";
  let drawing = false;
  let all = true;
  for (const point of points) {
    const p = project(h, point);
    if (!p) {
      drawing = false;
      all = false;
      continue;
    }
    d += `${drawing ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    drawing = true;
  }
  return close && all && d ? `${d}Z` : d;
}
