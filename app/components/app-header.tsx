"use client";

import * as React from "react";
import { Link, href } from "react-router";

import { SidebarIcon } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { useSidebar } from "~/components/ui/sidebar";

export interface BlogTopics {
  /** The title of the blog to display */
  title: string;
  /** A textual representation of the date the blog was posted */
  date: string;
  /** The URL to the blog post */
  link: string;
}

export function AppHeader({
  blogs = [],
  mode = "ticker",
}: {
  blogs?: BlogTopics[];
  mode?: "marquee" | "latest" | "stats" | "ticker";
}) {
  const { toggleSidebar } = useSidebar();
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // For ticker mode, cycle through posts
  React.useEffect(() => {
    if (mode === "ticker" && blogs.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % blogs.length);
      }, 7000); // Change every 7 seconds

      return () => clearInterval(interval);
    }
  }, [mode, blogs.length]);

  // For true marquee, duplicate content for seamless loop
  const displayBlogs =
    mode === "marquee" && blogs.length > 0 ? [...blogs, ...blogs] : blogs;

  const renderContent = () => {
    if (blogs.length === 0) return null;

    switch (mode) {
      case "ticker": {
        return (
          <div className="flex-1 flex justify-center items-center relative h-full overflow-hidden px-4">
            <div className="relative h-6 w-full max-w-3xl">
              {blogs.map((blog, index) => (
                <div
                  key={`${blog.title}-${index}`}
                  className={`absolute w-full flex items-center justify-center gap-3 transition-all duration-500 ${
                    index === currentIndex
                      ? "translate-y-0 opacity-100"
                      : index ===
                          (currentIndex - 1 + blogs.length) % blogs.length
                        ? "-translate-y-full opacity-0"
                        : "translate-y-full opacity-0"
                  }`}
                >
                  {index === 0 && (
                    <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap animate-pulse">
                      LATEST
                    </span>
                  )}
                  <Link
                    to={href("/blog/:slug", { slug: blog.link })}
                    className="hover:underline hover:text-white/90 transition-colors font-medium truncate"
                  >
                    {blog.title}
                  </Link>
                  <span className="text-sm text-white/70 whitespace-nowrap">
                    • {blog.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "marquee": {
        return (
          <div className="overflow-x-hidden w-full">
            <div className="flex animate-marquee whitespace-nowrap gap-8">
              {displayBlogs.map((blog, index) => (
                <span
                  key={`${blog.title}-${index}`}
                  className="inline-flex items-center gap-2"
                >
                  <Link
                    to={href("/blog/:slug", { slug: blog.link })}
                    className="hover:underline hover:text-white/90 transition-colors"
                  >
                    {blog.title}
                  </Link>
                  <span className="text-white/60">•</span>
                  <span className="text-sm text-white/70">{blog.date}</span>
                  {index < displayBlogs.length - 1 && (
                    <span className="mx-4 text-white/40">|</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      }

      case "latest": {
        const latestBlog = blogs[0];
        return (
          <div className="flex items-center gap-3">
            <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold animate-pulse">
              LATEST
            </span>
            <Link
              to={href("/blog/:slug", { slug: latestBlog.link })}
              className="hover:underline hover:text-white/90 transition-colors font-medium"
            >
              {latestBlog.title}
            </Link>
            <span className="text-sm text-white/70">— {latestBlog.date}</span>
          </div>
        );
      }

      case "stats": {
        return (
          <div className="flex items-center gap-6 text-sm">
            <span className="text-white/70">
              <span className="font-bold text-white">{blogs.length}</span> blog
              posts
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">
              Latest: <span className="text-white">{blogs[0]?.date}</span>
            </span>
            <Link
              to="/blog"
              className="ml-auto text-white hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full items-center border-b bg-(--color-brand-hsl)">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        {renderContent()}
      </div>
    </header>
  );
}
