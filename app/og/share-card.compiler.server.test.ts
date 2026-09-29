// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { transformAsync } from "@babel/core";
import { describe, expect, it } from "vitest";

// The React Compiler runs in the production build (vite.config.ts) but not in
// Vitest, so the renderer's own tests can't see what it does to ShareCard.
// Satori calls ShareCard as a plain function, where the compiler's memo-cache
// hook throws "Invalid hook call"; `"use no memo"` is what keeps it out. This
// compiles the file with the build's Babel setup and checks the directive held.

const source = readFileSync(resolve(import.meta.dirname, "share-card.server.tsx"), "utf8");

async function compile(code: string): Promise<string> {
  const result = await transformAsync(code, {
    filename: "share-card.server.tsx",
    babelrc: false,
    configFile: false,
    presets: [["@babel/preset-typescript", { isTSX: true, allExtensions: true }]],
    plugins: [["babel-plugin-react-compiler", { target: "19" }]],
  });
  return result?.code ?? "";
}

describe("ShareCard under the React Compiler", () => {
  it("is compiled without the memo-cache hook", async () => {
    expect(source).toContain('"use no memo"');
    expect(await compile(source)).not.toContain("react/compiler-runtime");
  });

  it("would get the hook without the directive, so the check above means something", async () => {
    const withoutDirective = source.replace('"use no memo";', "");
    expect(await compile(withoutDirective)).toContain("react/compiler-runtime");
  });
});
