/**
 * Type guard for a plain object with string keys — a non-null, non-array
 * `object`. Use this to narrow untyped input (`request.json()`, cached blobs,
 * `children.props`, …) instead of asserting its shape with `as`.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
