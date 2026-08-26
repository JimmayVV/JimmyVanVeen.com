import { describe, expect, it } from "vitest";

import { parseCoverage, scatter } from "./coverage-grid";

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
