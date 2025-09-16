// Shared analytics tracking utility for clientLoaders
// Cache analytics module to avoid re-imports on navigation
let analyticsModule: typeof import("~/utils/analytics.client") | null = null;

/**
 * Shared analytics tracking function for use in route clientLoaders
 * Call this at the end of your clientLoader to automatically track page views
 */
export async function trackPageView(): Promise<void> {
  console.log("🔥 [DEBUG] trackPageView started - URL:", window.location.href);
  console.log("🔥 [DEBUG] trackPageView timestamp:", new Date().toISOString());

  // Import analytics dynamically with memoization to avoid SSR issues
  if (!analyticsModule) {
    console.log("🔥 [DEBUG] Analytics module not cached, importing...");
    try {
      analyticsModule = await import("~/utils/analytics.client");
      console.log(
        "🔥 [DEBUG] Analytics module imported successfully:",
        !!analyticsModule,
      );
      console.log(
        "🔥 [DEBUG] Analytics instance available:",
        !!analyticsModule?.analytics,
      );
    } catch (error) {
      console.error("🔥 [DEBUG] Failed to import analytics module:", error);
      return; // Exit early if module can't be loaded
    }
  } else {
    console.log("🔥 [DEBUG] Using cached analytics module");
  }

  // Check analytics state before calling
  try {
    console.log("🔥 [DEBUG] About to call analytics.page()...");

    // Debug analytics internal state
    console.log("🔥 [DEBUG] Analytics debug info:", {
      isOptedOut: analyticsModule.analytics.isOptedOut(),
      DNT: navigator.doNotTrack,
      envVar: import.meta.env?.JVV_ANALYTICS_ENABLED,
      userAgent: navigator.userAgent.substring(0, 100), // First 100 chars
    });

    await analyticsModule.analytics.page();
    console.log("🔥 [DEBUG] analytics.page() completed successfully");
  } catch (error) {
    console.error("🔥 [DEBUG] Failed to track page view:", error);
  }

  console.log("🔥 [DEBUG] trackPageView completed");
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
