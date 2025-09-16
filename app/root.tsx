import * as React from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import { AppHeader, type BlogTopics } from "~/components/app-header";
import { AppSidebar } from "~/components/app-sidebar/app-sidebar";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
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
      href: "https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&family=Source+Sans+3:ital,wght@0,200..900;1,200..900&display=swap",
    },
    { rel: "stylesheet", href: styles },
  ];
};

export async function loader() {
  const blogPosts = await getCachedBlogPosts();

  return blogPosts.map((blog) => ({
    title: blog.fields.title,
    date: new Date(blog.fields.publishDate)
      .toLocaleDateString("en-us", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
      .toString(),
    link: blog.fields.slug,
  }));
}

// Cache analytics module to avoid re-imports on navigation
let analyticsModule: typeof import("~/utils/analytics.client") | null = null;

export async function clientLoader({ serverLoader }: Route.ClientLoaderArgs) {
  // Get server data first
  const serverData = await serverLoader();

  // Import analytics dynamically with memoization to avoid SSR issues
  if (!analyticsModule) {
    analyticsModule = await import("~/utils/analytics.client");
  }

  // Track page view
  await analyticsModule.analytics.page().catch((error) => {
    console.error("Failed to track page view:", error);
  });

  return serverData;
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={"box-border"}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className={"min-w-(--min-width) min-h-screen"}>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  return (
    <Template blogPosts={loaderData}>
      <Outlet />
    </Template>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Template>
      <main className="pt-16 p-4 container mx-auto">
        <h1>{message}</h1>
        <p>{details}</p>
        {stack && (
          <pre className="w-full p-4 overflow-x-auto">
            <code>{stack}</code>
          </pre>
        )}
      </main>
    </Template>
  );
}

function Template({
  children,
  blogPosts,
}: {
  children: React.ReactNode;
  blogPosts?: BlogTopics[];
}) {
  return (
    <SidebarProvider className="flex flex-col">
      <AppHeader blogs={blogPosts} />
      <div className="flex flex-1">
        <AppSidebar />
        <SidebarInset className="bg-black">{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
