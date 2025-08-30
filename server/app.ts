import { createRequestHandler } from "react-router";

import type { Config, Context } from "@netlify/functions";

declare module "react-router" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AppLoadContext {}
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default async (request: Request, _context: Context) => {
  return requestHandler(request, {});
};

export const config: Config = {
  path: "/*",
  preferStatic: true,
};
