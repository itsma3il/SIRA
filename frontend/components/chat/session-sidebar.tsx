"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, PlusIcon, Sparkles, MoreHorizontal, UserSquare2, Pencil, Archive, Trash } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { NavUser } from "@/components/nav-user";

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
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SettingsDialog } from "@/components/settings-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SessionSidebarProps {
  sessions: SessionListResponse | null;
  isLoading: boolean;
  error?: string | null;
  activeSessionId?: string | null;
  onAttachProfile?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string) => void;
  onArchiveSession?: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  onRestoreSession?: (sessionId: string) => void;
}

export function SessionSidebar({
  sessions,
  isLoading,
  error,
  activeSessionId,
  onAttachProfile,
  onRenameSession,
  onArchiveSession,
  onDeleteSession,
  onRestoreSession,
}: SessionSidebarProps) {
  const { user } = useUser();
  const [search, setSearch] = useState("");

  // Extract archived sessions
  const archivedSessions = useMemo(() => {
    if (!sessions?.sessions?.length) return [];
    const archived = sessions.sessions
      .flatMap((group) => group.sessions)
      .filter((session) => session.status === "archived");

    // console.log('[SessionSidebar] All sessions:', sessions.sessions.flatMap(g => g.sessions).map(s => ({ id: s.id, title: s.title, status: s.status })));
    // console.log('[SessionSidebar] Archived sessions found:', archived.length);

    return archived.map((session) => ({
      id: session.id,
      title: session.title,
      archivedAt: session.last_message_at
        ? new Date(session.last_message_at).toLocaleDateString()
        : session.created_at
          ? new Date(session.created_at).toLocaleDateString()
          : 'Unknown',
      messageCount: session.message_count,
    }));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!sessions?.sessions?.length) return [];
    const query = search.trim().toLowerCase();

    // Filter out archived sessions and apply search
    const activeSessions = sessions.sessions
      .map((group) => {
        const groupSessions = group.sessions.filter((session) => {
          // Exclude archived sessions - check for explicit 'archived' status
          if (session.status === "archived") {
            return false;
          }

          // Apply search filter if exists
          if (!query) return true;
          return [session.title, session.profile_name, session.last_message]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);
        });
        return { ...group, sessions: groupSessions };
      })
      .filter((group) => group.sessions.length > 0);

    // console.log('[SessionSidebar] Active sessions after filter:', activeSessions.flatMap(g => g.sessions).length);
    return activeSessions;
  }, [search, sessions]);

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-2">
          <Link href="/dashboard" className="flex items-center gap-2 flex-1">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">SIRA</span>
              <span className="truncate text-xs">Smart Academic Advisor</span>
            </div>
          </Link>
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/dashboard/chat?new=1">
              <PlusIcon className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="px-2 mt-2">
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9"
          />
        </div>
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
                  return (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={`/dashboard/chat/${session.id}`}>
                          <span className={cn("truncate", isActive && "font-medium")}>
                            {session.title}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction showOnHover>
                            <MoreHorizontal className="h-4 w-4" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start" className="w-44">
                          {onAttachProfile && (
                            <DropdownMenuItem onClick={() => onAttachProfile(session.id)}>
                              <UserSquare2 className="mr-2 h-4 w-4" />
                              Attach Profile
                            </DropdownMenuItem>
                          )}
                          {onRenameSession && (
                            <DropdownMenuItem onClick={() => onRenameSession(session.id)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {onArchiveSession && (
                            <DropdownMenuItem onClick={() => onArchiveSession(session.id)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          )}
                          {onDeleteSession && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => onDeleteSession(session.id)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))
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
  );
}
