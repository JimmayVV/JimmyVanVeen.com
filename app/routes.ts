import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  ...prefix("blog", [
    layout("routes/blog/layout.tsx", [
      index("routes/blog/blog-index.tsx"),
      route(":slug", "routes/blog/$slug.tsx"),
    ]),
  ]),
  route("email", "routes/email.tsx"),
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
