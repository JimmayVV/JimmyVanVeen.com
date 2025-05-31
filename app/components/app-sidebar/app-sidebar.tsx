import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar"

import * as React from "react"
import Bluesky from "~/components/icons/bluesky"
import Github from "~/components/icons/github"

import logo from "~/components/app-sidebar/jimmyvanveen.svg?url"
import { href, Link } from "react-router"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="top-(--header-height) !h-[calc(100svh-var(--header-height))] bg-(--sidebar-background)"
      id="app-sidebar"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="xl" asChild className="mb-3">
              <Link to={href("/")}>
                <div className="flex aspect-square size-16 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <img src={logo} alt="Jimmy Van Veen" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-2xl">Jimmy</span>
                  <span className="truncate text-xl">Van Veen</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-4 px-5">
        <div className="bg-accent-foreground py-4 px-6 text-center rounded-xl">
          I specialize in crafting visually striking and user-friendly digital
          experiences. With a passion for blending aesthetics and functionality,
          I bring ideas to life, creating innovative solutions in the dynamic
          world of web design and game development.
        </div>
        <Link
          to={href("/blog")}
          className="bg-accent-foreground hover:bg-accent hover:text-accent-foreground font-bold py-4 px-6 rounded-xl"
        >
          Jimmy's Blog
        </Link>
      </SidebarContent>
      <SidebarFooter id="sidebar-footer">
        <div className="flex flex-row gap-6 justify-center mb-2">
          <a
            href="https://bsky.app/profile/jimmyvanveen.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Bluesky />
          </a>
          <a
            href="https://github.com/JimmayVV"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github />
          </a>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
