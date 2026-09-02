// PROTOTYPE — throwaway. Variant table for the ink-dot scene prototype
// (issue #482). Three presets that disagree structurally: dot density, how
// the load-in assembles the car, and how hard the scroll morph is eased.
import type { PrototypeVariant } from "./prototype-switcher";

export const INK_VARIANTS = [
  { key: "A", name: "Sparse ink" },
  { key: "B", name: "Dense halftone" },
  { key: "C", name: "Overshoot" },
] as const satisfies readonly PrototypeVariant<string>[];

export type InkVariant = (typeof INK_VARIANTS)[number]["key"];

export function parseInkVariant(value: string | null): InkVariant | null {
  for (const v of INK_VARIANTS) {
    if (v.key === value) return v.key;
  }
  return null;
}

export type LoadIn = "scatter" | "fade";
export type Easing = "linear" | "eased" | "overshoot";

export interface InkConfig {
  /** Points sampled from the mesh on a full-tier device; halved on low tier. */
  points: number;
  /** Dot diameter in CSS pixels. */
  pointSize: number;
  loadIn: LoadIn;
  easing: Easing;
}

export const INK_CONFIG: Record<InkVariant, InkConfig> = {
  A: { points: 14000, pointSize: 2.6, loadIn: "scatter", easing: "eased" },
  B: { points: 60000, pointSize: 1.5, loadIn: "fade", easing: "linear" },
  C: { points: 28000, pointSize: 2.1, loadIn: "scatter", easing: "overshoot" },
};
