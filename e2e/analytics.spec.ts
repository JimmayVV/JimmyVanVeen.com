import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __dntProbe?: { gateReads: number; analyticsSends: number };
  }
}

test.describe("Analytics E2E Tests", () => {
  test.beforeEach(async ({ page, context }) => {
    // Clear cookies and localStorage before each test
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should track page views on navigation", async ({ page }) => {
    // Track network requests to /api/events
    const analyticsRequests: {
      event: string;
      properties: Record<string, unknown>;
    }[] = [];

    await page.route("**/api/events", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData) {
        analyticsRequests.push(postData);
      }

      // Continue with a successful response
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Navigate to home page
    await page.goto("/");
    await page.waitForTimeout(1000); // Wait for analytics to fire

    // Should have tracked page view
    expect(analyticsRequests.length).toBeGreaterThan(0);

    const pageViewEvent = analyticsRequests.find((req) => req.event === "page_view");
    expect(pageViewEvent).toBeDefined();
    expect(pageViewEvent?.properties["page_path"]).toBe("/");
  });

  test("should persist client ID across page navigations", async ({ page }) => {
    const clientIds: string[] = [];

    await page.route("**/api/events", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.properties?.client_id) {
        clientIds.push(String(postData.properties.client_id));
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Visit home page
    await page.goto("/");
    await page.waitForTimeout(500);

    // Navigate to privacy page
    await page.goto("/privacy");
    await page.waitForTimeout(500);

    // All client IDs should be the same
    expect(clientIds.length).toBeGreaterThan(0);
    const uniqueIds = [...new Set(clientIds)];
    expect(uniqueIds.length).toBe(1);
  });

  test("should include proper page metadata in events", async ({ page }) => {
    let capturedEvent: Record<string, unknown> | null = null;

    await page.route("**/api/events", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.event === "page_view") {
        capturedEvent = postData;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    expect(capturedEvent).toBeDefined();
    expect(capturedEvent).toHaveProperty("properties");
    expect(capturedEvent!["properties"]).toMatchObject({
      page_url: expect.stringContaining("/"),
      page_title: expect.any(String),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      client_id: expect.stringMatching(/^\d+\.\d+\.[a-z0-9]+$/),
    });
  });

  test("should allow users to opt out of tracking", async ({ page }) => {
    const analyticsRequests: unknown[] = [];

    await page.route("**/api/events", async (route) => {
      const request = route.request();
      analyticsRequests.push(request.postDataJSON());

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Navigate and verify tracking works initially
    await page.goto("/");
    await page.waitForTimeout(1000);

    const requestsBeforeOptOut = analyticsRequests.length;
    expect(requestsBeforeOptOut).toBeGreaterThan(0);

    // Opt out via console (simulating user action)
    await page.evaluate(() => {
      localStorage.setItem("analytics_opt_out", "true");
    });

    // Clear requests and navigate again
    analyticsRequests.length = 0;
    await page.goto("/privacy");
    await page.waitForTimeout(1000);

    // Should not track after opt-out
    expect(analyticsRequests.length).toBe(0);
  });

  test("should handle analytics API errors gracefully", async ({ page }) => {
    // Make the analytics API return errors
    await page.route("**/api/events", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal Server Error" }),
      });
    });

    // Page should still load and function normally
    await page.goto("/");

    // Verify page loaded successfully
    await expect(page.locator("body")).toBeVisible();
    const pageTitle = await page.title();
    expect(pageTitle).toBeDefined();
  });

  test("should generate valid client IDs", async ({ page }) => {
    let clientId: string | null = null;

    await page.route("**/api/events", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.properties?.client_id) {
        clientId = String(postData.properties.client_id);
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Verify client ID is in the format: timestamp.entropy.random
    expect(clientId).toBeDefined();
    expect(clientId).toMatch(/^\d+\.\d+\.[a-z0-9]+$/);
  });

  test("should store client ID in localStorage", async ({ page }) => {
    await page.route("**/api/events", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/");
    await page.waitForTimeout(1000);

    // Check localStorage for client ID
    const storedClientId = await page.evaluate(() => {
      return localStorage.getItem("analytics_client_id");
    });

    expect(storedClientId).toBeDefined();
    // Verify client ID is in the format: timestamp.entropy.random
    expect(storedClientId).toMatch(/^\d+\.\d+\.[a-z0-9]+$/);
  });

  test("should track multiple page views during session", async ({ page }) => {
    const pageViews: string[] = [];

    await page.route("**/api/events", async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData?.event === "page_view" && postData?.properties?.page_path) {
        pageViews.push(String(postData.properties.page_path));
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Navigate to multiple pages
    await page.goto("/");
    await page.waitForTimeout(500);

    await page.goto("/privacy");
    await page.waitForTimeout(500);

    // Verify both page views were tracked
    expect(pageViews).toContain("/");
    expect(pageViews).toContain("/privacy");
  });
});

// Kept out of the describe above on purpose: its beforeEach loads "/" without
// DNT, and that page's page_view is sent after hydration, which can land after
// `goto` resolves. A route registered then catches the old page's event and the
// test fails with one request that the DNT page never sent (#419).
test.describe("Analytics with Do Not Track", () => {
  test("should respect DNT (Do Not Track) header", async ({ page }) => {
    const analyticsRequests: unknown[] = [];

    await page.route("**/api/events", async (route) => {
      analyticsRequests.push(route.request().postDataJSON());

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Before the first navigation, so every document this page loads has DNT set.
    // The getter counts reads, which tells the test when analytics has reached its
    // gate; the fetch wrapper counts sends inside the page, so the assertion does
    // not depend on when Playwright's route handler happens to run.
    await page.addInitScript(() => {
      const probe = { gateReads: 0, analyticsSends: 0 };
      window.__dntProbe = probe;

      Object.defineProperty(navigator, "doNotTrack", {
        configurable: true,
        get: () => {
          probe.gateReads += 1;
          return "1";
        },
      });

      const originalFetch = window.fetch.bind(window);
      window.fetch = (input, init) => {
        const url = input instanceof Request ? input.url : String(input);
        if (url.includes("/api/events")) {
          probe.analyticsSends += 1;
        }
        return originalFetch(input, init);
      };
    });

    await page.goto("/");

    // The page view is sent from the route's clientLoader after hydration. Wait
    // until analytics has read the DNT flag, then let one task pass: from that
    // read to the fetch is a chain of microtasks, so a send would have happened.
    await page.waitForFunction(() => (window.__dntProbe?.gateReads ?? 0) > 0);
    await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 0)));

    const sends = await page.evaluate(() => window.__dntProbe?.analyticsSends);
    expect(sends).toBe(0);
    expect(analyticsRequests).toHaveLength(0);
  });
});
