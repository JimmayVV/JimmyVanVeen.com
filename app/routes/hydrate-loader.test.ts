import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guards an SSR failure that is invisible in a browser and fatal to a crawler.
 *
 * A route that exports `clientLoader` and sets `clientLoader.hydrate = true`
 * but has no server `loader` makes React Router render the HydrateFallback
 * during SSR instead of the route component. The response still carries the
 * right status and the right <title>, so it looks fine in devtools and fine on
 * screen once JS runs — but the served HTML body is empty, and that is all a
 * crawler gets.
 *
 * /privacy shipped in exactly that state and nobody noticed. /about, the page
 * whose entire purpose is to be read by a search engine, nearly did too.
 */

const ROUTES_DIR = join(import.meta.dirname, ".");

function routeFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...routeFiles(full));
    } else if (entry.name.endsWith(".tsx") && !entry.name.endsWith(".test.tsx")) {
      found.push(full);
    }
  }
  return found;
}

describe("routes that hydrate their clientLoader", () => {
  const files = routeFiles(ROUTES_DIR);

  it("finds route modules to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const source = readFileSync(file, "utf8");
    if (!/clientLoader\.hydrate\s*=\s*true/.test(source)) continue;

    const name = file.slice(ROUTES_DIR.length + 1);

    it(`${name} also exports a server loader, so the component is server-rendered`, () => {
      const hasServerLoader = /export\s+(async\s+)?function\s+loader\b/.test(source);
      expect(
        hasServerLoader,
        `${name} sets clientLoader.hydrate = true without exporting a server loader. ` +
          "React Router will SSR the HydrateFallback instead of the route component, " +
          "serving an empty body to crawlers.",
      ).toBe(true);
    });
  }
});
