import { vi } from "vitest";

/**
 * Test helper: JSON-parse the request body of the Nth global `fetch` mock call.
 * `vi.mocked(fetch)` gives a precisely-typed body (`BodyInit | null | undefined`),
 * so this narrows to a string at runtime instead of asserting — then returns the
 * parsed payload for specs to read arbitrary fields from.
 */
export function fetchBody(index: number) {
  const body = vi.mocked(fetch).mock.calls[index]?.[1]?.body;
  if (typeof body !== "string") {
    throw new Error(`fetch mock call #${index} had no string body`);
  }
  return JSON.parse(body);
}
