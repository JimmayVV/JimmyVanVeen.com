import { trackPageView } from "~/utils/analytics-loader";
import { getLogger } from "~/utils/logger";

import type { Route } from "./+types/404";

// Create route-specific logger
const notFoundLogger = getLogger("404-route");

// Add analytics tracking to this route
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  notFoundLogger.debug("clientLoader started");

  const data = await serverLoader();
  notFoundLogger.debug({ hasData: !!data }, "serverLoader completed");

  await trackPageView();
  notFoundLogger.debug("trackPageView completed");

  return data;
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
