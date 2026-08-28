import { describe, expect, it } from "vitest";

import { MAX_MARKS, coverageSummary, marksFor, parseCoverage, scatter } from "./coverage-grid";

describe("parseCoverage", () => {
  it("reads the documented keys", () => {
    const spec = parseCoverage("total: 262\nstored: 45\nlabel: files that reached the store");
    expect(spec.total).toBe(262);
    expect(spec.stored).toBe(45);
    expect(spec.label).toBe("files that reached the store");
  });

  it("ignores unknown keys and junk lines instead of throwing", () => {
    const spec = parseCoverage("total: 10\nnonsense\ncolour: blue\nstored: 3");
    expect(spec.total).toBe(10);
    expect(spec.stored).toBe(3);
  });

  it("never reports more covered than exist", () => {
    expect(parseCoverage("total: 5\nstored: 99").stored).toBe(5);
  });

  it("survives an empty fence", () => {
    expect(parseCoverage("").total).toBe(0);
  });
});

describe("coverageSummary", () => {
  it("states the proportion with the configured labels", () => {
    const spec = parseCoverage(
      "total: 262\nstored: 45\nstoredLabel: in the shared store\nemptyLabel: local only",
    );
    expect(coverageSummary(spec)).toBe(
      "45 of 262 in the shared store; the remaining 217 local only.",
    );
  });
});

describe("scatter", () => {
  it("fills exactly the covered count", () => {
    const filled = scatter(262, 45);
    expect(filled).toHaveLength(262);
    expect(filled.filter(Boolean)).toHaveLength(45);
  });

  it("is deterministic, so the figure does not reshuffle between renders", () => {
    expect(scatter(262, 45)).toEqual(scatter(262, 45));
  });

  it("does not simply fill from the left", () => {
    const filled = scatter(262, 45);
    const firstForty = filled.slice(0, 45).filter(Boolean).length;
    expect(firstForty).toBeLessThan(45);
  });
});

describe("marksFor", () => {
  it("returns one mark per item, with stable ids", () => {
    const marks = marksFor(262, 45);
    expect(marks).toHaveLength(262);
    expect(marks?.[0]?.id).toBe("mark-0");
    expect(marks?.filter((m) => m.on)).toHaveLength(45);
  });

  it("declines to draw a grid too large to be legible", () => {
    expect(marksFor(MAX_MARKS + 1, 10)).toBeNull();
  });

  it("draws right up to the cap", () => {
    expect(marksFor(MAX_MARKS, 10)).toHaveLength(MAX_MARKS);
  });

  it("declines an empty set", () => {
    expect(marksFor(0, 0)).toBeNull();
  });
});
