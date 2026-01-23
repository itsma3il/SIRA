"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, PlusIcon } from "lucide-react";

import type { SessionListResponse } from "@/lib/types/conversation";
import {
  Sidebar,
  SidebarContent,
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
      <SidebarHeader className="flex flex-col gap-3 px-3 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 size-8 rounded-md" />
            <div className="text-sm font-semibold text-primary tracking-tight">
              SIRA Chat
            </div>
          </div>
          <Button variant="ghost" className="size-8" asChild>
            <Link href="/dashboard/chat">
              <Search className="size-4" />
            </Link>
          </Button>
        </div>
        <Button
          variant="outline"
          className="flex w-full items-center gap-2"
          asChild
        >
          <Link href="/dashboard/chat?new=1">
            <PlusIcon className="size-4" />
            <span>New chat</span>
          </Link>
        </Button>
        <Input
          placeholder="Search sessions"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-8"
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
              <SidebarMenu>
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
                          <div className="flex w-full flex-col gap-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className={cn("truncate", isActive && "font-medium")}>
                                {session.title}
                              </span>
                              <Badge variant="secondary" className="text-[10px]">
                                {messageCount}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground line-clamp-2">
                              {preview}
                            </span>
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
    </Sidebar>
  );
}
