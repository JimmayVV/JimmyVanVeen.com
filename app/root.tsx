import * as React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import { TopBar } from "~/components/site/top-bar";
import { getCachedBlogPosts } from "~/utils/contentful-cache";

import type { Route } from "./+types/root";
import styles from "./app.css?url";

export const meta: Route.MetaFunction = () => [
  {
    title: "Jimmy Van Veen",
  },
];

export const links: Route.LinksFunction = () => {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..800;1,6..72,300..800&family=Source+Serif+4:ital,opsz,wght@0,8..60,300..900;1,8..60,300..900&family=JetBrains+Mono:ital,wght@0,400..700;1,400..700&display=swap",
    },
    { rel: "stylesheet", href: styles },
  ];
};

export async function loader() {
  try {
    const blogPosts = await getCachedBlogPosts();
    return blogPosts.map((blog) => ({
      title: blog.fields.title,
      description: blog.fields.description ?? undefined,
      slug: blog.fields.slug,
      publishDate: blog.fields.publishDate,
    }));
  } catch (error) {
    console.error("Root loader: failed to load blog posts", error);
    return [];
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={"box-border"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {/* Render-blocking on purpose: must run synchronously before
            first paint to set the .dark class. defer/async would defeat
            the no-flash guarantee. */}
        <script src="/theme-init.js" />
      </head>
      <body className={"min-w-(--min-width) min-h-screen"}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Shell>
      <Outlet />
    </Shell>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Shell>
      <main className="blog-page error-page">
        <h1 className="error-title">{message}</h1>
        <p className="error-body">{details}</p>
        {stack ? (
          <pre className="error-stack">
            <code>{stack}</code>
          </pre>
        ) : null}
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="editorial-theme">
      <TopBar />
      {children}
    </div>
  );
}
