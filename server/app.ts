import { createRequestHandler, RouterContextProvider } from "react-router";

import type { Config, Context } from "@netlify/functions";

const requestHandler = createRequestHandler(
  async () => {
    const build = await import("virtual:react-router/server-build");
    // React Router 8's generated `virtual:react-router/server-build` types a few
    // required ServerBuild fields as `| undefined`. Fill in the router defaults at
    // this boundary (rather than asserting) so the build satisfies ServerBuild.
    return {
      ...build,
      basename: build.basename ?? "/",
      unstable_getCriticalCss: build.unstable_getCriticalCss ?? (() => undefined),
      allowedActionOrigins: build.allowedActionOrigins ?? false,
    };
  },
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
