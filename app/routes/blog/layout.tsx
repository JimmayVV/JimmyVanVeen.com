import { Outlet } from "react-router";

import type { Route } from "./+types/layout";

// Fraunces is only used for the long-post drop cap (italic axis), so it
// loads on /blog/* routes only — non-blog pages don't pay the cost.
export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,300..700&display=swap",
  },
];

export default function Blog() {
  return <Outlet />;
}
