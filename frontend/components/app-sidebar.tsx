"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MessagesSquare, UserSquare2, Sparkles } from "lucide-react"
import { UserButton } from "@clerk/nextjs"

import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings-dialog"

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
              <Link href="/dashboard" className="group">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/70 size-8 rounded-lg flex items-center justify-center">
                    <Sparkles className="size-5 text-primary-foreground" />
                  </div>
                </div>
                <div className="flex flex-col flex-1">
                  <span className="font-bold text-base tracking-tight">SIRA</span>
                  <span className="text-[10px] text-muted-foreground">Smart Academic Advisor</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter className="border-t p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "size-8",
                },
              }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Account</p>
              <p className="text-xs text-muted-foreground">Manage settings</p>
            </div>
          </div>
          <SettingsDialog />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
