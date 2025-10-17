import { beforeEach, describe, expect, it, vi } from "vitest";

import { analytics } from "./analytics.client";

describe("Analytics Client", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Also clear sessionStorage
    sessionStorage.clear();

    // Reset navigator.doNotTrack
    Object.defineProperty(navigator, "doNotTrack", {
      value: null,
      writable: true,
      configurable: true,
    });

    // Reset fetch mock
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    // Mock document and window properties
    Object.defineProperty(document, "title", {
      value: "Test Page",
      writable: true,
      configurable: true,
    });

    Object.defineProperty(document, "referrer", {
      value: "https://example.com",
      writable: true,
      configurable: true,
    });

    Object.defineProperty(window, "location", {
      value: {
        href: "https://test.com/page",
        pathname: "/page",
      },
      writable: true,
      configurable: true,
    });
  });

  describe("track()", () => {
    it("should send analytics events to the server", async () => {
      await analytics.track("test_event", { foo: "bar" });

      expect(fetch).toHaveBeenCalledWith(
        "/api/events",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("test_event");
      expect(payload.properties).toMatchObject({
        foo: "bar",
        page_url: "https://test.com/page",
        page_title: "Test Page",
        page_referrer: "https://example.com",
      });
      expect(payload.properties.client_id).toBeDefined();
      expect(payload.properties.timestamp).toBeDefined();
    });

    it("should not track when DNT is enabled", async () => {
      Object.defineProperty(navigator, "doNotTrack", {
        value: "1",
        writable: true,
        configurable: true,
      });

      // Reset the module cache to force re-initialization with new DNT setting
      vi.resetModules();

      // Create new analytics instance to pick up DNT setting
      const { analytics: newAnalytics } = await import("./analytics.client");
      await newAnalytics.track("test_event");

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should not track when user has opted out", async () => {
      analytics.optOut();
      await analytics.track("test_event");

      // Should not send analytics after opt-out
      expect(fetch).not.toHaveBeenCalled();
    });

    it("should handle server errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      // Should not throw error
      await expect(analytics.track("test_event")).resolves.toBeUndefined();
    });

    it("should include client_id in all events", async () => {
      await analytics.track("event1");
      await analytics.track("event2");

      const call1 = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
      );
      const call2 = JSON.parse(
        (fetch as ReturnType<typeof vi.fn>).mock.calls[1][1].body,
      );

      expect(call1.properties.client_id).toBeDefined();
      expect(call2.properties.client_id).toBeDefined();
      expect(call1.properties.client_id).toBe(call2.properties.client_id);
    });
  });

  describe("page()", () => {
    it("should track page views with default path", async () => {
      await analytics.page();

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("page_view");
      expect(payload.properties.page_path).toBe("/page");
      expect(payload.properties.page_location).toBe("https://test.com/page");
    });

    it("should track page views with custom path", async () => {
      await analytics.page("/custom-page", { utm_source: "test" });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("page_view");
      expect(payload.properties.page_path).toBe("/custom-page");
      expect(payload.properties.utm_source).toBe("test");
    });
  });

  describe("identify()", () => {
    it("should track user identification", async () => {
      await analytics.identify("user123", { name: "Test User", plan: "pro" });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("user_identify");
      expect(payload.properties.user_id).toBe("user123");
      expect(payload.properties.name).toBe("Test User");
      expect(payload.properties.plan).toBe("pro");
    });
  });

  describe("trackClick()", () => {
    it("should track click events", async () => {
      await analytics.trackClick("cta_button", { location: "hero" });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("click");
      expect(payload.properties.element).toBe("cta_button");
      expect(payload.properties.location).toBe("hero");
    });
  });

  describe("trackError()", () => {
    it("should track error events", async () => {
      const error = new Error("Test error");
      await analytics.trackError(error, { component: "Header" });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("error");
      expect(payload.properties.error_message).toBe("Test error");
      expect(payload.properties.error_stack).toContain("Error: Test error");
      expect(payload.properties.component).toBe("Header");
    });
  });

  describe("trackTiming()", () => {
    it("should track timing events", async () => {
      await analytics.trackTiming("api_call", 1234, { endpoint: "/api/data" });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.event).toBe("timing");
      expect(payload.properties.timing_name).toBe("api_call");
      expect(payload.properties.timing_duration).toBe(1234);
      expect(payload.properties.endpoint).toBe("/api/data");
    });
  });

  describe("Privacy Controls", () => {
    it("should allow users to opt out", () => {
      analytics.optOut();
      expect(localStorage.getItem("analytics_opt_out")).toBe("true");
    });

    it("should allow users to opt in", () => {
      analytics.optOut();
      expect(localStorage.getItem("analytics_opt_out")).toBe("true");

      analytics.optIn();
      expect(localStorage.getItem("analytics_opt_out")).toBeNull();
    });

    it("should check opt-out status correctly", () => {
      expect(analytics.isOptedOut()).toBe(false);

      analytics.optOut();
      expect(analytics.isOptedOut()).toBe(true);

      analytics.optIn();
      expect(analytics.isOptedOut()).toBe(false);
    });
  });

  describe("Client ID Persistence", () => {
    it("should generate and persist client ID", async () => {
      await analytics.track("test_event");

      const clientId = localStorage.getItem("analytics_client_id");
      expect(clientId).not.toBeNull();
      expect(typeof clientId).toBe("string");
      // Client ID format: timestamp.entropy.random
      expect(clientId).toMatch(/^\d+\.\d+\.[a-z0-9]+$/);
    });

    it("should reuse existing client ID", async () => {
      await analytics.track("event1");
      const firstClientId = localStorage.getItem("analytics_client_id");

      await analytics.track("event2");
      const secondClientId = localStorage.getItem("analytics_client_id");

      expect(firstClientId).toBe(secondClientId);
    });
  });
});
