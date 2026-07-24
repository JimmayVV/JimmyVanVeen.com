import { createRequestHandler, RouterContextProvider } from "react-router";

import type { Config, Context } from "@netlify/functions";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

// React Router 8 makes middleware baseline: the request handler takes a
// RouterContextProvider (its new context container) rather than a plain
// AppLoadContext object. No loader/action in this app reads the load context,
// so we hand it a fresh empty provider. If a loader ever needs the Netlify
// per-request Context, create a typed context with `createContext()` and
// `.set()` it here.
export default async (request: Request, _context: Context) => {
  return requestHandler(request, new RouterContextProvider());
};

export const config: Config = {
  path: "/*",
  preferStatic: true,
};
