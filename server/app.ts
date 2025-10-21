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
  return requestHandler(request, context as unknown as AppLoadContext);
};

export const config: Config = {
  path: "/*",
  preferStatic: true,
};
