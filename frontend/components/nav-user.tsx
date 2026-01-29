"use client"

import { SignOutButton, UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { SettingsDialog } from "@/components/settings-dialog"
import { useState } from "react"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Get initials for avatar fallback
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <>
      <SidebarContent
        className="flex flex-row justify-between bg-accent hover:bg-accent/60 rounded-md py-2 px-3"
      >
        <SignedIn>
          <UserButton showName />
        </SignedIn>
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      </SidebarContent>
    </>
  )
}