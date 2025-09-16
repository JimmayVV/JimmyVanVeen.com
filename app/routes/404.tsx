import { trackPageView } from "~/utils/analytics-loader";

import type { Route } from "./+types/404";

// Add analytics tracking to this route
export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  const data = await serverLoader();
  await trackPageView();
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
