import type { Config, Context } from "@netlify/functions"
import { createRequestHandler } from "react-router"

declare module "react-router" {
  interface AppLoadContext {}
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
)

export default async (request: Request, context: Context) => {
  return requestHandler(request, {})
}

export const config: Config = {
  path: "/*",
  preferStatic: true,
}
