// @vitest-environment node
// Its own file on purpose: the renderer is loaded once per module instance,
// and resvg's WASM can only be initialised once per process, so the failed
// first load has to happen before anything else in this file renders.

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ failNextRead: false, reads: 0 }));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: (...args: Parameters<typeof actual.readFile>) => {
      state.reads += 1;
      if (state.failNextRead) {
        state.failNextRead = false;
        return Promise.reject(new Error("transient read failure"));
      }
      return actual.readFile(...args);
    },
  };
});

import { renderShareCard } from "./share-card.server";

describe("renderShareCard after a failed renderer load", () => {
  beforeEach(() => {
    state.reads = 0;
  });

  it("retries the load on the next call instead of replaying the stale failure", async () => {
    state.failNextRead = true;
    await expect(renderShareCard({ title: "First try" })).rejects.toThrow("transient read failure");

    const png = await renderShareCard({ title: "Second try" });

    expect(png[0]).toBe(0x89);
    expect(state.reads).toBe(2);
  });
});
