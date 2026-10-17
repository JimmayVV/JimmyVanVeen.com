/**
 * The 3D viewer's decisions that don't need WebGL: which parts show in each
 * mode, and how the cameras frame the rinks for a given stage size. Kept apart
 * from scene.client.ts so they can be tested directly.
 */

export type ViewerMode = "both" | "split" | "old" | "modern";
export type CameraView = "stands" | "overhead" | "ice";

export interface Visibility {
  /** The 1995 rink as a full model. */
  old: boolean;
  /** Today's rink as a full model. */
  modern: boolean;
  /** The 1995 boards and lines laid over today's ice. */
  oldGhost: boolean;
  /** The hatched ice TD Garden has and the old Garden didn't. */
  extraIce: boolean;
  boards: boolean;
  dimensions: boolean;
}

export function visibility(
  mode: ViewerMode,
  view: CameraView,
  layers: { boards: boolean; dimensions: boolean },
): Visibility {
  return {
    old: mode === "old" || mode === "split",
    modern: mode === "modern" || mode === "both" || mode === "split",
    oldGhost: mode === "both",
    extraIce: mode === "both",
    boards: layers.boards,
    // At ice level the labels float in front of the boards they describe.
    dimensions: layers.dimensions && view !== "ice",
  };
}

/** Base vertical field of view, widened on tall stages so the rink still fits across. */
const BASE_FOV = 42;
/** Narrowest aspect at which BASE_FOV still fits the rink's length. */
const FIT_ASPECT = 1.3;

export interface Framing {
  /** Aspect of each rendered view: half the stage when side by side. */
  aspect: number;
  /** Vertical field of view for the perspective camera, in degrees. */
  fov: number;
  /** Half the height the overhead camera shows, in feet. */
  overheadHalfHeight: number;
}

export function framing(width: number, height: number, mode: ViewerMode): Framing {
  const aspect = (mode === "split" ? width / 2 : width) / height;
  const widen = Math.max(1, FIT_ASPECT / aspect);
  const fov = (2 * Math.atan(Math.tan((BASE_FOV * Math.PI) / 360) * widen) * 180) / Math.PI;
  return { aspect, fov, overheadHalfHeight: Math.max(70, 120 / aspect) };
}
