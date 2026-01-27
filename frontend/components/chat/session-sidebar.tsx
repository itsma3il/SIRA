"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, PlusIcon, Sparkles } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

import type { SessionListResponse } from "@/lib/types/conversation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

interface SessionSidebarProps {
  sessions: SessionListResponse | null;
  isLoading: boolean;
  error?: string | null;
  activeSessionId?: string | null;
}

export function SessionSidebar({
  sessions,
  isLoading,
  error,
  activeSessionId,
}: SessionSidebarProps) {
  const [search, setSearch] = useState("");

  const filteredSessions = useMemo(() => {
    if (!sessions?.sessions?.length) return [];
    const query = search.trim().toLowerCase();
    if (!query) return sessions.sessions;

    return sessions.sessions
      .map((group) => {
        const groupSessions = group.sessions.filter((session) =>
          [session.title, session.profile_name, session.last_message]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query)
        );
        return { ...group, sessions: groupSessions };
      })
      .filter((group) => group.sessions.length > 0);
  }, [search, sessions]);

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm group-hover:blur-md transition-all" />
              <div className="relative bg-gradient-to-br from-primary to-primary/70 size-9 rounded-lg flex items-center justify-center">
                <Sparkles className="size-5 text-primary-foreground" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight">SIRA</span>
              <span className="text-[10px] text-muted-foreground">Smart Academic Advisor</span>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="size-8 shrink-0" asChild>
            <Link href="/dashboard/chat?new=1">
              <PlusIcon className="size-4" />
            </Link>
          </Button>
        </div>
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-9 mt-3"
        />
      </SidebarHeader>
      <SidebarContent className="pt-2">
        {isLoading ? (
          <div className="px-4 text-xs text-muted-foreground">
            Loading sessions...
          </div>
        ) : error ? (
          <div className="px-4 text-xs text-destructive">{error}</div>
        ) : filteredSessions.length === 0 ? (
          <div className="px-4">
            <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              No conversations yet. Start a new chat to begin.
            </div>
          </div>
        ) : (
          filteredSessions.map((group) => (
            <SidebarGroup key={group.period}>
              <SidebarGroupLabel>{group.period}</SidebarGroupLabel>
              <SidebarMenu className="gap-2">
                {group.sessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  const preview = session.last_message || "No messages yet";
                  const messageCount = Number.isFinite(session.message_count)
                    ? session.message_count
                    : 0;

                  return (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={`/dashboard/chat/${session.id}`}>
                          <div className="flex w-full flex-col">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn("truncate", isActive && "font-medium")}>
                                {session.title}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {messageCount}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))
        )}
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
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
