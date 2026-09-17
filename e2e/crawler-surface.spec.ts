import { expect, test } from "@playwright/test";

/**
 * What a crawler sees, asserted against the production build.
 *
 * Every check here uses the `request` fixture rather than `page`, on purpose:
 * it performs a plain HTTP GET and never runs JavaScript, which is the whole
 * point. The bugs this file guards against were all invisible in a browser —
 * the pages looked right once JS had run — and only showed up in the raw
 * response:
 *
 * - `/robots.txt` answered with 10 KB of HTML shell and a 200.
 * - Every unknown URL returned 200 while rendering the 404 page.
 * - `/privacy` served a correct <title> over a completely empty <body>,
 *   because a `clientLoader` with `hydrate = true` and no server `loader`
 *   makes React Router SSR the HydrateFallback instead of the component.
 * - Every page shared one identical <title> with no description or canonical.
 *
 * `hydrate-loader.test.ts` catches the third of those statically. This file is
 * the end-to-end backstop, running against the same `build/server/index.js`
 * the deploy consumes.
 */

test.describe("crawler surface", () => {
  test("unknown URLs return 404, not a soft 404", async ({ request }) => {
    const res = await request.get("/this-page-does-not-exist-xyz", { maxRedirects: 0 });
    expect(res.status()).toBe(404);
  });

  test("robots.txt is a real text file that advertises the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");

    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");

    const body = await res.text();
    expect(body).toContain("Sitemap: https://www.jimmyvanveen.com/sitemap.xml");
    // Would mean the SSR catch-all answered instead of the static file.
    expect(body).not.toContain("<!DOCTYPE html>");
  });

  test("sitemap omits the tags Google ignores and the lastmod it cannot verify", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");

    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");

    const body = await res.text();
    expect(body).toContain("<loc>https://www.jimmyvanveen.com</loc>");
    expect(body).toContain("<loc>https://www.jimmyvanveen.com/about</loc>");

    // Documented as ignored by Google; emitting them was noise.
    expect(body).not.toContain("<changefreq>");
    expect(body).not.toContain("<priority>");

    // The static pages have no per-page modification data available inside a
    // serverless function, so they must carry no lastmod at all rather than a
    // request-time timestamp that is wrong every time it regenerates.
    // E2E runs with Contentful stubbed off, so there may be no post entries
    // at all; indexOf returns -1 then, and slice(0, -1) would silently trim a
    // character instead of selecting the static block.
    const firstPost = body.indexOf("/blog/");
    const staticBlock = firstPost === -1 ? body : body.slice(0, firstPost);
    expect(staticBlock).not.toContain("<lastmod>");
  });

  // Each page must carry its own title, description, and canonical. Sharing one
  // title across the site is what made Google rewrite it and invent a snippet.
  const pages = [
    { path: "/", title: "Jimmy Van Veen — Web Engineer in Greater Boston" },
    { path: "/about", title: "About · Jimmy Van Veen" },
    { path: "/privacy", title: "Privacy Policy · Jimmy Van Veen" },
  ];

  for (const { path, title } of pages) {
    test(`${path} serves its own title, description, and canonical`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);

      const html = await res.text();
      const canonical =
        path === "/" ? "https://www.jimmyvanveen.com" : `https://www.jimmyvanveen.com${path}`;

      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(`href="${canonical}"`);
      expect(html).toMatch(/<meta name="description" content="[^"]{20,}"/);
    });
  }

  test("titles are unique across pages", async ({ request }) => {
    const titles = await Promise.all(
      pages.map(async ({ path }) => {
        const html = await (await request.get(path)).text();
        return /<title>(.*?)<\/title>/.exec(html)?.[1];
      }),
    );

    expect(new Set(titles).size).toBe(titles.length);
  });

  // The regression that nearly shipped: a correct <title> over an empty body.
  // Each needle must appear ONLY in the rendered body. "Senior Web Developer"
  // would have been useless here: it is also the jobTitle inside the JSON-LD,
  // which is emitted from `meta` and survives even when the body is empty — so
  // the assertion would pass on exactly the bug it exists to catch.
  const mustRenderServerSide = [
    { path: "/about", needle: "What I build" },
    { path: "/privacy", needle: "Information We Collect" },
  ];

  for (const { path, needle } of mustRenderServerSide) {
    test(`${path} server-renders its body, not a hydrate fallback`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      expect(html).toContain(needle);
    });
  }

  test("/about carries ProfilePage structured data with only verified profiles", async ({
    request,
  }) => {
    const html = await (await request.get("/about")).text();

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
      (m) => JSON.parse(m[1] ?? "{}"),
    );
    const profile = blocks.find((b) => b["@type"] === "ProfilePage");

    expect(profile).toBeDefined();
    expect(profile.mainEntity.name).toBe("Jimmy Van Veen");
    // sameAs must list only profiles confirmed to be his. A plausible-looking
    // URL for someone else with the same name would assert a false identity.
    expect(profile.mainEntity.sameAs).toEqual([
      "https://github.com/JimmayVV",
      "https://bsky.app/profile/jimmyvanveen.com",
    ]);
  });

  test("the home page declares its site name", async ({ request }) => {
    const html = await (await request.get("/")).text();

    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
      (m) => JSON.parse(m[1] ?? "{}"),
    );
    const site = blocks.find((b) => b["@type"] === "WebSite");

    expect(site).toBeDefined();
    expect(site.name).toBe("Jimmy Van Veen");
  });
});
