"use client";

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

export function AppHeader({ blogs = [] }: { blogs?: BlogTopics[] }) {
  const { toggleSidebar } = useSidebar();

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
        {blogs.length > 0 ? (
          <div className="overflow-x-hidden w-full">
            <div className="animate-marquee whitespace-nowrap gap-5 flex">
              <span className="font-black underline">Recent Blogs:</span>

              {blogs.map((blog) => (
                <span key={blog.title}>
                  <Link
                    to={href("/blog/:slug", { slug: blog.link })}
                    className="italic hover:underline"
                  >
                    {blog.title}
                  </Link>{" "}
                  - <span className="font-bold">{blog.date}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
