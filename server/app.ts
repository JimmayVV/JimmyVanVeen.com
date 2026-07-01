import { type AppLoadContext, createRequestHandler } from "react-router";

import type { Config, Context } from "@netlify/functions";

declare module "react-router" {
  interface AppLoadContext extends Context {
    [key: string]: unknown;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default async (request: Request, context: Context) => {
  // React Router's AppLoadContext isn't structurally assignable from Netlify's
  // Context, so we bridge with a fresh object literal (which satisfies the
  // index-signature augmentation above without a type assertion). This is a
  // shallow spread, which is safe here: `@netlify/types` defines Context as a
  // plain per-request object of data fields plus function-valued *properties*
  // (`json`, `log`, `cookies`, …) — not a class with prototype methods — so
  // every field is copied, and nested objects like `cookies` are preserved by
  // reference (their methods stay intact).
  const loadContext: AppLoadContext = { ...context };
  return requestHandler(request, loadContext);
};

export const config: Config = {
  path: "/*",
  preferStatic: true,
};
