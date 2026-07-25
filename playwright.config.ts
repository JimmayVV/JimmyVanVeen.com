import { defineConfig, devices } from "@playwright/test";

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env["CI"],

  /* Retry on CI only */
  retries: process.env["CI"] ? 2 : 0,

  /* Opt out of parallel tests on CI */
  ...(process.env["CI"] ? { workers: 1 } : {}),

  /* Reporter to use */
  reporter: [["html"], ["list"]],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: "http://localhost:3000",

    /* Collect trace when retrying the failed test */
    trace: "on-first-retry",

    /* Screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Build and serve the PRODUCTION bundle before starting the tests.
   *
   * These specs gate every PR, so they must exercise the artifact that actually
   * ships — not the Vite dev server, which differs in bundling, SSR entry, and
   * env handling. `react-router-serve` runs the same `build/server/index.js`
   * the deploy consumes. The build is only a couple of seconds, so rebuilding
   * per run is cheaper than reasoning about a stale `build/`.
   */
  webServer: {
    command: "npm run build && react-router-serve ./build/server/index.js",
    url: "http://localhost:3000",
    /* Never reuse a server already on :3000. Reusing would silently hand the
     * suite a `npm run dev` process — the dev server this config exists to stop
     * testing against. Failing loudly with "port already used" is the point:
     * stop your dev server before running e2e locally. */
    reuseExistingServer: false,
    timeout: 120000,
    /* Keep external APIs out of E2E: Contentful/GitHub are stubbed off, and the
     * JVV_* vars must be present at BUILD time since they inline into the client. */
    env: {
      DISABLE_CONTENTFUL_RUNTIME: "true",
      DISABLE_GITHUB_INTEGRATION: "true",
      JVV_ALLOW_EMAILS: "false",
      JVV_RECAPTCHA_SITE_KEY: "test-key",
    },
  },
});
