"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessagesSquare, UserSquare2 } from "lucide-react"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Profiles",
    url: "/dashboard/profiles",
    icon: UserSquare2,
    items: [
      { title: "All profiles", url: "/dashboard/profiles" },
      { title: "New profile", url: "/dashboard/profiles/new" },
    ],
  },
  {
    title: "Chat",
    url: "/dashboard/chat",
    icon: MessagesSquare,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const items = React.useMemo(
    () =>
      navMain.map((item) => ({
        ...item,
        isActive:
          pathname === item.url ||
          (pathname.startsWith(item.url + "/") && item.url !== "/dashboard"),
      })),
    [pathname]
  )

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  S
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">SIRA</span>
                  <span className="truncate text-xs">Academic intelligence</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
    </Sidebar>
  )
}
