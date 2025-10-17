// Shared analytics tracking utility for clientLoaders
// Import the proper React Router types
import type { ClientLoaderFunctionArgs } from "react-router";

import { getLogger } from "./logger.client";

// Cache analytics module to avoid re-imports on navigation
let analyticsModule: typeof import("~/utils/analytics.client") | null = null;

// Create logger for route tracking
const routeLogger = getLogger("route-analytics");

/**
 * Shared analytics tracking function for use in route clientLoaders
 * Call this at the end of your clientLoader to automatically track page views
 */
export async function trackPageView(): Promise<void> {
  const startTime = new Date().toISOString();
  const url = window.location.href;

  routeLogger.debug({ url, timestamp: startTime }, "trackPageView started");

  // Import analytics dynamically with memoization to avoid SSR issues
  if (!analyticsModule) {
    routeLogger.debug("Analytics module not cached, importing...");
    try {
      analyticsModule = await import("~/utils/analytics.client");
      routeLogger.debug(
        {
          moduleImported: !!analyticsModule,
          instanceAvailable: !!analyticsModule?.analytics,
        },
        "Analytics module imported successfully",
      );
    } catch (error) {
      routeLogger.error({ error }, "Failed to import analytics module");
      return; // Exit early if module can't be loaded
    }
  } else {
    routeLogger.debug("Using cached analytics module");
  }

  // Check analytics state before calling
  try {
    routeLogger.debug("About to call analytics.page()...");

    // Debug analytics internal state
    const debugInfo = {
      isOptedOut: analyticsModule.analytics.isOptedOut(),
      DNT: navigator.doNotTrack,
      envVar: import.meta.env?.JVV_ANALYTICS_ENABLED,
      // Only log browser type in production, not full user agent for privacy
      browserInfo: import.meta.env.PROD
        ? "browser-detected"
        : navigator.userAgent.substring(0, 50),
    };
    routeLogger.debug({ debugInfo }, "Analytics debug info");

    await analyticsModule.analytics.page();
    routeLogger.debug("analytics.page() completed successfully");
  } catch (error) {
    routeLogger.error({ error }, "Failed to track page view");
  }

  routeLogger.debug("trackPageView completed");
}

/**
 * Helper function to track analytics and call server loader
 * This preserves type inference by not wrapping the entire function
 */
export async function withServerLoaderAnalytics(
  args: ClientLoaderFunctionArgs,
) {
  const result = await args.serverLoader();

  // Track page view in background to not block the loader
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });

  return result;
}

/**
 * Helper function to track analytics for custom loader data
 * This preserves type inference by not wrapping the entire function
 */
export async function withCustomLoaderAnalytics<T>(data: T): Promise<T> {
  // Track page view in background to not block the loader
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });

  return data;
}

/**
 * Legacy wrapper function for backwards compatibility
 * @deprecated Use withServerLoaderAnalytics or withCustomLoaderAnalytics instead
 */
export function withAnalytics() {
  const clientLoader = async (args: ClientLoaderFunctionArgs) => {
    return withServerLoaderAnalytics(args);
  };

  clientLoader.hydrate = true;
  return clientLoader;
}
