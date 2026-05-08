import { describe, expect, it } from "vitest";

import { formatPostDate } from "./format-post-date";

describe("formatPostDate", () => {
  it("formats an ISO date string in long-form US English", () => {
    expect(formatPostDate("2024-03-15")).toBe("March 15, 2024");
    expect(formatPostDate("2025-12-01")).toBe("December 1, 2025");
  });

  it("parses the date in local time, not UTC midnight", () => {
    // parseISO + format keeps a YYYY-MM-DD in the same calendar date
    // for any timezone west of UTC; new Date(iso) would render the
    // previous day in negative UTC offsets.
    expect(formatPostDate("2024-01-01")).toBe("January 1, 2024");
  });

  it("handles full ISO timestamps with timezone", () => {
    expect(formatPostDate("2024-07-04T12:00:00Z")).toBe("July 4, 2024");
  });

  it("returns the raw input when the date is malformed", () => {
    // parseISO throws on garbage; the helper catches and surfaces the
    // raw string instead of crashing the entire render.
    expect(formatPostDate("not-a-date")).toBe("not-a-date");
    expect(formatPostDate("")).toBe("");
  });
});
