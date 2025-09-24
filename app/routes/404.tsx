import { trackPageView } from "~/utils/analytics-loader";

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
