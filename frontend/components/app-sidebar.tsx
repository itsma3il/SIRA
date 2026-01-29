"use client"

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessagesSquare, UserSquare2, Sparkles, Shield, Users, FileText, MessageCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

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

const adminNavItems = [
  {
    title: "Admin Dashboard",
    url: "/dashboard/admin",
    icon: Shield,
  },
  {
    title: "User Profiles",
    url: "/dashboard/admin/profiles",
    icon: Users,
  },
  {
    title: "Sessions",
    url: "/dashboard/admin/sessions",
    icon: MessageCircle,
  },
  {
    title: "Recommendations",
    url: "/dashboard/admin/recommendations",
    icon: FileText,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useUser()
  
  // Check if user is admin (you can adjust this logic based on your admin check)
  const isAdmin = React.useMemo(() => {
    if (!user?.emailAddresses) return false
    const email = user.emailAddresses[0]?.emailAddress
    const adminEmails = ["admin@sira.com", "ismail@sira.com", "signmousdik@gmail.com"]
    return adminEmails.includes(email || "")
  }, [user])

  const items = React.useMemo(
    () => {
      const result = navMain.map((item) => {
        let isActive = false;
        
        if (item.items && item.items.length > 0) {
          // For parent items with children, check if any child matches
          isActive = item.items.some(subItem => pathname === subItem.url || pathname.startsWith(subItem.url + "/"));
        } else {
          // For regular items, check exact match or starts with (but not for dashboard root)
          isActive = pathname === item.url || 
                    (item.url !== "/dashboard" && pathname.startsWith(item.url + "/"));
        }
        
        return {
          ...item,
          isActive,
        };
      });
      
      // console.log('Nav items active state:', result.map(i => ({ title: i.title, isActive: i.isActive, pathname })));
      return result;
    },
    [pathname]
  )

  const adminItems = React.useMemo(
    () =>
      adminNavItems.map((item) => ({
        ...item,
        isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
      })),
    [pathname]
  )

  return (
    <Sidebar collapsible="offcanvas" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SIRA</span>
                  <span className="truncate text-xs">Smart Academic Advisor</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} label="Platform" />
        {isAdmin && (
          <NavMain items={adminItems} label="Administration" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.fullName || user?.firstName || "User",
            email: user?.emailAddresses[0]?.emailAddress || "",
            avatar: user?.imageUrl || "",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
