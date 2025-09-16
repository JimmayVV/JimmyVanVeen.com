// Shared analytics tracking utility for clientLoaders
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
      // Only log browser type in production, not full user agent
      browserInfo: import.meta.env.PROD
        ? navigator.userAgent.includes("Chrome")
          ? "Chrome-based"
          : navigator.userAgent.includes("Firefox")
            ? "Firefox"
            : navigator.userAgent.includes("Safari")
              ? "Safari"
              : "Other"
        : navigator.userAgent.substring(0, 100),
    };
    routeLogger.debug({ debugInfo }, "Analytics debug info");

    await analyticsModule.analytics.page();
    routeLogger.debug("analytics.page() completed successfully");
  } catch (error) {
    routeLogger.error({ error }, "Failed to track page view");
  }

  routeLogger.debug("trackPageView completed");
}

// Type for React Router clientLoader args
interface ClientLoaderArgs {
  serverLoader: () => Promise<unknown>;
  request: Request;
  params: Record<string, string>;
}

/**
 * Higher-order function to wrap a clientLoader with analytics tracking
 * When no loader is provided, it calls serverLoader and returns unknown type
 * When a loader is provided, it preserves the exact return type
 */
export function withAnalytics(): (args: ClientLoaderArgs) => Promise<unknown>;
export function withAnalytics<T>(
  loader: (args: ClientLoaderArgs) => Promise<T>,
): (args: ClientLoaderArgs) => Promise<T>;
export function withAnalytics<T>(
  loader?: (args: ClientLoaderArgs) => Promise<T>,
): (args: ClientLoaderArgs) => Promise<T | unknown> {
  return async (args: ClientLoaderArgs) => {
    // Call the original loader first (if provided)
    const result = loader ? await loader(args) : await args.serverLoader();

    // Track the page view
    await trackPageView();

    return result;
  };
}
