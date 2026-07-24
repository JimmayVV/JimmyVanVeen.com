import { describe, expect, it } from "vitest";

import { isRecord } from "./is-record";

describe("isRecord", () => {
  it("accepts plain objects", () => {
    expect(isRecord({})).toBe(true);
    expect(isRecord({ a: 1, b: "two" })).toBe(true);
    expect(isRecord(Object.create(null))).toBe(true);
  });

  it("rejects null and undefined", () => {
    expect(isRecord(null)).toBe(false);
    expect(isRecord(undefined)).toBe(false);
  });

  it("rejects arrays", () => {
    expect(isRecord([])).toBe(false);
    expect(isRecord([1, 2, 3])).toBe(false);
  });

  it("rejects primitives", () => {
    expect(isRecord("string")).toBe(false);
    expect(isRecord(42)).toBe(false);
    expect(isRecord(true)).toBe(false);
    expect(isRecord(Symbol("s"))).toBe(false);
  });

  it("narrows so property access is type-safe", () => {
    const value: unknown = { name: "x" };
    if (isRecord(value)) {
      expect(typeof value["name"]).toBe("string");
    }
  });
});
