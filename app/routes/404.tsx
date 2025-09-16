import { trackPageView } from "~/utils/analytics-loader";
import { getLogger } from "~/utils/logger.client";

// Create route-specific logger
const notFoundLogger = getLogger("404-route");

// Add analytics tracking to this route
export async function clientLoader() {
  notFoundLogger.debug("clientLoader started");

  await trackPageView();
  notFoundLogger.debug("trackPageView completed");

  return null; // No server data for this route
}

// Enable clientLoader during initial hydration
clientLoader.hydrate = true;

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-2xl">Page not found</p>
    </div>
  );
}
