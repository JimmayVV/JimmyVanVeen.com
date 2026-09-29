import { fetchBody } from "../../../../config/test/mock-fetch";
import { fromPartial } from "@total-typescript/shoehorn";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AnalyticsEvent, PageViewData } from "../types";
import { GoatCounterProvider } from "./goatcounter";

describe("GoatCounter Provider", () => {
  let provider: GoatCounterProvider;

  const mockConfig = {
    credentials: {
      GOATCOUNTER_SITE_CODE: "jimmyvanveen",
      GOATCOUNTER_API_TOKEN: "test_token_1234567890",
    },
    debug: false,
  };

  beforeEach(() => {
    provider = new GoatCounterProvider();
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue(
      fromPartial<Response>({
        ok: true,
        status: 200,
        text: async () => "",
      }),
    );
  });

  describe("Initialization", () => {
    it("should initialize with valid credentials", async () => {
      await provider.initialize(mockConfig);

      expect(provider.isConfigured()).toBe(true);
    });

    it("should fail with missing site code", async () => {
      await provider.initialize({
        credentials: {
          GOATCOUNTER_SITE_CODE: "",
          GOATCOUNTER_API_TOKEN: "test_token_1234567890",
        },
        debug: false,
      });

      expect(provider.isConfigured()).toBe(false);
    });

    it("should fail with missing API token", async () => {
      await provider.initialize({
        credentials: {
          GOATCOUNTER_SITE_CODE: "jimmyvanveen",
          GOATCOUNTER_API_TOKEN: "",
        },
        debug: false,
      });

      expect(provider.isConfigured()).toBe(false);
    });

    it("should validate site code format", async () => {
      await provider.initialize({
        credentials: {
          GOATCOUNTER_SITE_CODE: "invalid site code!",
          GOATCOUNTER_API_TOKEN: "test_token_1234567890",
        },
        debug: false,
      });

      expect(provider.isConfigured()).toBe(false);
    });

    it("should validate API token length", async () => {
      await provider.initialize({
        credentials: {
          GOATCOUNTER_SITE_CODE: "jimmyvanveen",
          GOATCOUNTER_API_TOKEN: "short",
        },
        debug: false,
      });

      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe("trackPageView()", () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it("should send pageview to GoatCounter API", async () => {
      const pageData: PageViewData = {
        path: "/test-page",
        url: "https://jimmyvanveen.com/test-page",
        title: "Test Page",
        referrer: "https://google.com",
        timestamp: "2025-10-17T00:00:00.000Z",
      };

      await provider.trackPageView(pageData);

      expect(fetch).toHaveBeenCalledWith(
        "https://jimmyvanveen.goatcounter.com/api/v0/count",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test_token_1234567890",
          },
        }),
      );

      const payload = fetchBody(0);

      expect(payload.hits).toHaveLength(1);
      expect(payload.hits[0]).toMatchObject({
        path: "/test-page",
        title: "Test Page",
        ref: "https://google.com",
      });
    });

    it("should not track when provider is not configured", async () => {
      const unconfiguredProvider = new GoatCounterProvider();
      await unconfiguredProvider.initialize({
        credentials: {
          GOATCOUNTER_SITE_CODE: "",
          GOATCOUNTER_API_TOKEN: "",
        },
        debug: false,
      });

      const pageData: PageViewData = {
        path: "/test",
        url: "https://test.com/test",
        title: "Test",
        timestamp: new Date().toISOString(),
      };

      await unconfiguredProvider.trackPageView(pageData);

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle API errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue(
        fromPartial<Response>({
          ok: false,
          status: 500,
          text: async () => "Internal Server Error",
        }),
      );

      const pageData: PageViewData = {
        path: "/test",
        url: "https://test.com/test",
        title: "Test",
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await expect(provider.trackPageView(pageData)).resolves.toBeUndefined();
    });

    it("should include optional referrer when provided", async () => {
      const pageData: PageViewData = {
        path: "/from-google",
        url: "https://test.com/from-google",
        title: "Landing Page",
        referrer: "https://www.google.com/search",
        timestamp: new Date().toISOString(),
      };

      await provider.trackPageView(pageData);

      const payload = fetchBody(0);

      expect(payload.hits[0].ref).toBe("https://www.google.com/search");
    });
  });

  describe("visitor forwarding", () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    const pageData: PageViewData = {
      path: "/blog/post",
      url: "https://jimmyvanveen.com/blog/post?utm_source=linkedin&utm_campaign=launch",
      title: "Post",
      timestamp: "2026-09-29T00:00:00.000Z",
    };

    const context = {
      clientIp: "198.51.100.7",
      userAgent: "Mozilla/5.0 Chrome/140",
      headers: new Headers(),
    };

    it("sends the visitor's user agent and IP, not the server's", async () => {
      await provider.trackPageView(pageData, context);

      const payload = fetchBody(0);

      expect(payload.hits[0]).toMatchObject({
        user_agent: "Mozilla/5.0 Chrome/140",
        ip: "198.51.100.7",
      });
      expect(payload.no_sessions).toBeUndefined();
    });

    it("sends the query string so utm_ parameters count as a campaign", async () => {
      await provider.trackPageView(pageData, context);

      expect(fetchBody(0).hits[0].query).toBe("?utm_source=linkedin&utm_campaign=launch");
    });

    it("omits the query when the URL has none or doesn't parse", async () => {
      await provider.trackPageView({ ...pageData, url: "https://jimmyvanveen.com/" }, context);
      await provider.trackPageView({ ...pageData, url: "" }, context);

      expect(fetchBody(0).hits[0].query).toBeUndefined();
      expect(fetchBody(1).hits[0].query).toBeUndefined();
    });

    // GoatCounter answers 400 "session or browser/IP not set" to a hit with
    // neither, which silently dropped every pageview before this was added.
    it.each([
      ["no context", undefined],
      ["an unknown IP", { ...context, clientIp: "unknown" }],
      ["no user agent", { ...context, userAgent: "" }],
    ])("sets no_sessions when there is %s", async (_label, ctx) => {
      await provider.trackPageView(pageData, ctx);

      expect(fetchBody(0).no_sessions).toBe(true);
    });

    it("sends the screen width as a string, which is the only form the API accepts", async () => {
      await provider.trackEvent(
        { event: "page_view", properties: { page_path: "/", screen_width: 1440 } },
        context,
      );

      expect(fetchBody(0).hits[0].size).toBe("1440");
    });

    it.each([
      ["a string", "1440"],
      ["zero", 0],
      ["a fraction", 1440.5],
      ["an absurd width", 99999],
    ])("drops a screen width that is %s", async (_label, width) => {
      await provider.trackEvent(
        { event: "page_view", properties: { page_path: "/", screen_width: width } },
        context,
      );

      expect(fetchBody(0).hits[0].size).toBeUndefined();
    });

    it.each([
      ["en-US,en;q=0.9", "en-US"],
      ["nl", "nl"],
      ["fr-CH;q=0.8, fr", "fr-CH"],
      ["*", undefined],
      ["<script>", undefined],
      [null, undefined],
    ])("reads language %s from Accept-Language as %s", async (header, expected) => {
      const headers = new Headers();
      if (header !== null) headers.set("accept-language", header);

      await provider.trackPageView(pageData, { ...context, headers });

      expect(fetchBody(0).hits[0].language).toBe(expected);
    });

    it("passes the context through from trackEvent", async () => {
      await provider.trackEvent(
        { event: "page_view", properties: { page_path: "/", page_location: pageData.url } },
        context,
      );

      expect(fetchBody(0).hits[0]).toMatchObject({
        ip: "198.51.100.7",
        query: "?utm_source=linkedin&utm_campaign=launch",
      });
    });
  });

  describe("trackEvent()", () => {
    beforeEach(async () => {
      await provider.initialize(mockConfig);
    });

    it("should track page_view events", async () => {
      const event: AnalyticsEvent = {
        event: "page_view",
        properties: {
          page_path: "/blog/post",
          page_location: "https://test.com/blog/post",
          page_title: "Blog Post",
          page_referrer: "https://twitter.com",
          timestamp: "2025-10-17T00:00:00.000Z",
        },
      };

      await provider.trackEvent(event);

      expect(fetch).toHaveBeenCalled();

      const payload = fetchBody(0);

      expect(payload.hits[0]).toMatchObject({
        path: "/blog/post",
        title: "Blog Post",
        ref: "https://twitter.com",
      });
    });

    it("should ignore non-pageview events", async () => {
      const event: AnalyticsEvent = {
        event: "click",
        properties: {
          element: "button",
        },
      };

      await provider.trackEvent(event);

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle events with minimal properties", async () => {
      const event: AnalyticsEvent = {
        event: "page_view",
        properties: {
          page_path: "/minimal",
        },
      };

      await provider.trackEvent(event);

      expect(fetch).toHaveBeenCalled();

      const payload = fetchBody(0);

      expect(payload.hits[0].path).toBe("/minimal");
    });
  });

  describe("Provider Metadata", () => {
    it("should have correct provider name", () => {
      expect(provider.name).toBe("goatcounter");
    });
  });
});
