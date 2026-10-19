import { describe, expect, it } from "vitest";

import { OLD_GARDEN, type Point, projectToPhoto } from "./geometry";
import { project, projectedPath, rinkCorners, solveHomography } from "./homography";

describe("solveHomography", () => {
  it("reproduces the original study's fit of the 1995 photo from its four corners", () => {
    const corners = rinkCorners(OLD_GARDEN);
    const photo = corners.map((c) => projectToPhoto(c));
    const h = solveHomography(corners, photo);
    expect(h).not.toBeNull();
    if (!h) return;
    // Any other point on the ice must then land where the original fit puts it.
    for (const point of [
      [0, 0],
      [24.5, -41.5],
      [-60, 20],
    ] satisfies Point[]) {
      const ours = project(h, point);
      const theirs = projectToPhoto(point);
      expect(ours?.[0]).toBeCloseTo(theirs[0], 4);
      expect(ours?.[1]).toBeCloseTo(theirs[1], 4);
    }
  });

  it("maps each corner exactly where it was placed", () => {
    const ice: Point[] = [
      [100, 42.5],
      [-100, 42.5],
      [-100, -42.5],
      [100, -42.5],
    ];
    const photo: Point[] = [
      [900, 300],
      [200, 320],
      [50, 700],
      [1100, 680],
    ];
    const h = solveHomography(ice, photo);
    if (!h) throw new Error("expected a homography");
    ice.forEach((point, i) => {
      expect(project(h, point)?.[0]).toBeCloseTo(photo[i]?.[0] ?? NaN, 6);
      expect(project(h, point)?.[1]).toBeCloseTo(photo[i]?.[1] ?? NaN, 6);
    });
  });

  it("refuses corners that collapse onto a line", () => {
    const ice = rinkCorners(OLD_GARDEN);
    const photo: Point[] = [
      [0, 0],
      [100, 0],
      [200, 0],
      [300, 0],
    ];
    expect(solveHomography(ice, photo)).toBeNull();
  });
});

describe("projectedPath", () => {
  it("breaks a path where it passes behind the camera instead of joining across", () => {
    // w = 1 - x/100: points at x >= 100 are behind the camera.
    const h = [1, 0, 0, 0, 1, 0, -0.01, 0, 1] as const;
    const path = projectedPath(
      h,
      [
        [0, 0],
        [50, 0],
        [150, 0],
        [50, 10],
      ],
      true,
    );
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path.endsWith("Z")).toBe(false);
  });
});
