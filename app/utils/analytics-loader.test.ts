// Import types for proper mocking
import type { ClientLoaderFunctionArgs } from "react-router";

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("Analytics Loader", () => {
  beforeEach(() => {
    // Clear all mocks and module cache
    vi.clearAllMocks();
    vi.resetModules();

    // Clear localStorage
    localStorage.clear();

    // Mock window.location
    Object.defineProperty(window, "location", {
      value: {
        href: "https://test.com/test-page",
        pathname: "/test-page",
      },
      writable: true,
      configurable: true,
    });

    // Mock navigator
    Object.defineProperty(navigator, "doNotTrack", {
      value: null,
      writable: true,
      configurable: true,
    });
  });

  describe("SSR Safety", () => {
    it("should not import logger.client at module top-level", async () => {
      // This test ensures that the module can be imported without
      // causing SSR issues by attempting top-level imports of client-only code

      // Mock the logger.client module to throw if accessed during SSR
      vi.doMock("./logger.client", () => {
        throw new Error(
          "logger.client should not be imported at top-level during SSR",
        );
      });

      // Import the module - this should NOT throw because logger is lazy-loaded
      await expect(import("./analytics-loader")).resolves.toBeDefined();
    });

    it("should lazy-load logger only when trackPageView is called", async () => {
      const mockGetLogger = vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn(),
      }));

      // Mock logger.client to track when it's imported
      vi.doMock("./logger.client", () => ({
        getLogger: mockGetLogger,
      }));

      // Mock analytics.client
      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockResolvedValue(undefined),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      // Import the module - logger should NOT be loaded yet
      const { trackPageView } = await import("./analytics-loader");
      expect(mockGetLogger).not.toHaveBeenCalled();

      // Call trackPageView - NOW logger should be loaded
      await trackPageView();
      expect(mockGetLogger).toHaveBeenCalledWith("route-analytics");
    });

    it("should cache logger after first load", async () => {
      const mockGetLogger = vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn(),
      }));

      vi.doMock("./logger.client", () => ({
        getLogger: mockGetLogger,
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockResolvedValue(undefined),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { trackPageView } = await import("./analytics-loader");

      // First call should load logger
      await trackPageView();
      expect(mockGetLogger).toHaveBeenCalledTimes(1);

      // Second call should reuse cached logger
      await trackPageView();
      expect(mockGetLogger).toHaveBeenCalledTimes(1); // Still only called once
    });
  });

  describe("trackPageView", () => {
    beforeEach(() => {
      // Reset module state between tests
      vi.resetModules();
    });

    it("should track page views successfully", async () => {
      const mockPageFn = vi.fn().mockResolvedValue(undefined);

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: mockPageFn,
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { trackPageView } = await import("./analytics-loader");
      await trackPageView();

      expect(mockPageFn).toHaveBeenCalledTimes(1);
    });

    it("should handle analytics module import failure gracefully", async () => {
      const mockErrorLogger = vi.fn();

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: mockErrorLogger,
          child: vi.fn(),
        }),
      }));

      // Mock analytics.client to throw on import
      vi.doMock("~/utils/analytics.client", () => {
        throw new Error("Failed to import analytics module");
      });

      const { trackPageView } = await import("./analytics-loader");

      // Should not throw, but handle error gracefully
      await expect(trackPageView()).resolves.toBeUndefined();

      // Should log the error
      expect(mockErrorLogger).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to import analytics module",
      );
    });

    it("should handle analytics.page() failure gracefully", async () => {
      const mockErrorLogger = vi.fn();

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: mockErrorLogger,
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockRejectedValue(new Error("Analytics API failed")),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { trackPageView } = await import("./analytics-loader");

      // Should not throw
      await expect(trackPageView()).resolves.toBeUndefined();

      // Should log the error
      expect(mockErrorLogger).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to track page view",
      );
    });

    it("should cache analytics module after first import", async () => {
      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockResolvedValue(undefined),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      // Note: We can't directly test the caching of dynamic imports
      // as vi.doMock affects all imports. This test documents the
      // expected behavior even though we can't fully verify it in this test.
      const { trackPageView } = await import("./analytics-loader");

      await trackPageView();
      await trackPageView();

      // Both calls should succeed without re-importing
      // (In real implementation, second call uses cached analyticsModule)
    });
  });

  describe("withServerLoaderAnalytics", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("should call serverLoader and track analytics", async () => {
      const mockServerLoader = vi.fn().mockResolvedValue({ data: "test" });
      const mockPageFn = vi.fn().mockResolvedValue(undefined);

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: mockPageFn,
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { withServerLoaderAnalytics } = await import("./analytics-loader");

      const args = {
        serverLoader: mockServerLoader,
      } as unknown as ClientLoaderFunctionArgs;

      const result = await withServerLoaderAnalytics(args);

      // Should return server loader result
      expect(result).toEqual({ data: "test" });
      expect(mockServerLoader).toHaveBeenCalledTimes(1);

      // Give async tracking time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should track page view in background
      expect(mockPageFn).toHaveBeenCalled();
    });

    it("should not block on analytics tracking failure", async () => {
      const mockServerLoader = vi.fn().mockResolvedValue({ data: "test" });
      const mockErrorLogger = vi.fn();

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: mockErrorLogger,
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockRejectedValue(new Error("Analytics failed")),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { withServerLoaderAnalytics } = await import("./analytics-loader");

      const args = {
        serverLoader: mockServerLoader,
      } as unknown as ClientLoaderFunctionArgs;

      // Should return server loader result even if analytics fails
      const result = await withServerLoaderAnalytics(args);
      expect(result).toEqual({ data: "test" });

      // Give async tracking time to complete and log error
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Error should be logged by the logger
      expect(mockErrorLogger).toHaveBeenCalledWith(
        { error: expect.any(Error) },
        "Failed to track page view",
      );
    });
  });

  describe("withCustomLoaderAnalytics", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("should return data and track analytics", async () => {
      const mockPageFn = vi.fn().mockResolvedValue(undefined);

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: mockPageFn,
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { withCustomLoaderAnalytics } = await import("./analytics-loader");

      const testData = { custom: "data", value: 123 };
      const result = await withCustomLoaderAnalytics(testData);

      // Should return the same data
      expect(result).toEqual(testData);

      // Give async tracking time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should track page view in background
      expect(mockPageFn).toHaveBeenCalled();
    });

    it("should preserve type information", async () => {
      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockResolvedValue(undefined),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { withCustomLoaderAnalytics } = await import("./analytics-loader");

      // Test with different types
      const stringResult = await withCustomLoaderAnalytics("test");
      expect(typeof stringResult).toBe("string");

      const numberResult = await withCustomLoaderAnalytics(42);
      expect(typeof numberResult).toBe("number");

      const objectResult = await withCustomLoaderAnalytics({ foo: "bar" });
      expect(objectResult).toEqual({ foo: "bar" });
    });
  });

  describe("withAnalytics (legacy)", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("should return a clientLoader function with hydrate property", async () => {
      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: vi.fn().mockResolvedValue(undefined),
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { withAnalytics } = await import("./analytics-loader");
      const clientLoader = withAnalytics();

      expect(typeof clientLoader).toBe("function");
      expect(clientLoader.hydrate).toBe(true);
    });

    it("should call serverLoader through withServerLoaderAnalytics", async () => {
      const mockServerLoader = vi.fn().mockResolvedValue({ legacy: "data" });
      const mockPageFn = vi.fn().mockResolvedValue(undefined);

      vi.doMock("./logger.client", () => ({
        getLogger: () => ({
          debug: vi.fn(),
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn(),
          child: vi.fn(),
        }),
      }));

      vi.doMock("~/utils/analytics.client", () => ({
        analytics: {
          page: mockPageFn,
          isOptedOut: vi.fn().mockReturnValue(false),
        },
      }));

      const { withAnalytics } = await import("./analytics-loader");
      const clientLoader = withAnalytics();

      const args = {
        serverLoader: mockServerLoader,
      } as unknown as ClientLoaderFunctionArgs;

      const result = await clientLoader(args);

      expect(result).toEqual({ legacy: "data" });
      expect(mockServerLoader).toHaveBeenCalledTimes(1);

      // Give async tracking time to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockPageFn).toHaveBeenCalled();
    });
  });
});
