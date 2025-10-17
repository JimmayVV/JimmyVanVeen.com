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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);
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

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

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
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      } as Response);

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

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.hits[0].ref).toBe("https://www.google.com/search");
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

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

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

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.hits[0].path).toBe("/minimal");
    });
  });

  describe("Provider Metadata", () => {
    it("should have correct provider name", () => {
      expect(provider.name).toBe("goatcounter");
    });
  });
});
