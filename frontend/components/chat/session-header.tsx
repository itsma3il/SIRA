"use client";

import { useEffect, useState } from "react";
import { Check, Pencil, Trash, Archive, ArchiveRestore, MoreHorizontal, UserSquare2 } from "lucide-react";

import type { SessionDetailResponse } from "@/lib/types/conversation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface SessionHeaderProps {
  session: SessionDetailResponse;
  onRename: (title: string) => void;
  onDelete: () => void;
  onToggleArchive: () => void;
  onAttachProfile?: () => void;
  isUpdating?: boolean;
}

export function SessionHeader({
  session,
  onRename,
  onDelete,
  onToggleArchive,
  onAttachProfile,
  isUpdating = false,
}: SessionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);

  useEffect(() => {
    setDraftTitle(session.title);
    setIsEditing(false);
  }, [session.title]);

  const handleSave = () => {
    const trimmed = draftTitle.trim();
    if (trimmed.length === 0 || trimmed === session.title) {
      setIsEditing(false);
      return;
    }
    onRename(trimmed);
    setIsEditing(false);
  };

  return (
    <header className="bg-background z-10 flex min-h-16 w-full flex-wrap items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 flex-wrap items-center gap-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              className="h-8 w-64"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleSave();
                }
                if (event.key === "Escape") {
                  setIsEditing(false);
                  setDraftTitle(session.title);
                }
              }}
              autoFocus
            />
            <Button size="icon" variant="ghost" onClick={handleSave} disabled={isUpdating}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {session.title}
              </p>
              <p className="text-xs text-muted-foreground">
                {session.profile?.profile_name ? `Profile: ${session.profile.profile_name}` : "General chat"}
              </p>
            </div>
            <Badge variant="outline" className="text-[11px]">
              {session.status}
            </Badge>
          </div>
        )}
      </div>
        
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {onAttachProfile && (
            <DropdownMenuItem onClick={onAttachProfile}>
              <UserSquare2 className="mr-2 h-4 w-4" />
              Attach Profile
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsEditing(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onToggleArchive}>
            {session.status === "archived" ? (
              <ArchiveRestore className="mr-2 h-4 w-4" />
            ) : (
              <Archive className="mr-2 h-4 w-4" />
            )}
            {session.status === "archived" ? "Restore" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={cn("text-destructive focus:text-destructive")}
            onClick={onDelete}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
