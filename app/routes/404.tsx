import { data } from "react-router";

import { trackPageView } from "~/utils/analytics-loader";
import { SITE_NAME } from "~/utils/seo";

import type { Route } from "./+types/404";

export const meta: Route.MetaFunction = () => [{ title: `Page not found · ${SITE_NAME}` }];

/**
 * The catch-all route used to render this page with a 200, which made every
 * mistyped URL an indexable soft 404 — including /robots.txt before a real one
 * existed. `data()` keeps the rendered page while sending the status a crawler
 * needs to drop the URL.
 */
export function loader() {
  return data(null, { status: 404 });
}

// Add analytics tracking to this route
export async function clientLoader() {
  // Track page view for 404 page
  trackPageView().catch((error) => {
    console.warn("Analytics tracking failed:", error);
  });

  return null;
}
clientLoader.hydrate = true;

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-2xl">Page not found</p>
    </div>
  );
}
