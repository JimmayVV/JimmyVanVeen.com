// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

// netlify.toml ships the .wasm files the share-card renderer reads by path.
// A wrong path only shows up on a deploy, as a crash on the first card request,
// so this checks each one against the installed packages instead.
const root = resolve(import.meta.dirname, "../..");

function includedFiles(): string[] {
  const toml = readFileSync(resolve(root, "netlify.toml"), "utf8");
  const block = /included_files\s*=\s*\[([^\]]*)\]/.exec(toml)?.[1] ?? "";
  return [...block.matchAll(/"([^"]+)"/g)].map((match) => match[1] ?? "");
}

describe("netlify.toml included_files", () => {
  it("lists the renderer's WASM files", () => {
    expect(includedFiles()).toEqual(
      expect.arrayContaining([
        "node_modules/@resvg/resvg-wasm/index_bg.wasm",
        "node_modules/harfbuzzjs/hb.wasm",
      ]),
    );
  });

  it.each(includedFiles())("%s exists in the installed packages", (path) => {
    expect(existsSync(resolve(root, path))).toBe(true);
  });
});
