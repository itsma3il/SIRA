"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { SessionSidebar } from "@/components/chat/session-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useConversationChat } from "@/hooks/use-conversation-chat";
import { profilesApi } from "@/lib/profile-api";
import type { ProfileListResponse } from "@/lib/profile-api-types";

export default function ChatPage() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    sessions,
    sessionsLoading,
    sessionsError,
    loadSessions,
    createNewSession,
  } = useConversationChat();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [profiles, setProfiles] = useState<ProfileListResponse[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("general");
  const [customTitle, setCustomTitle] = useState("");
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const profilesLoadedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;

    const load = async () => {
      const token = await getToken();
      if (!token) return;
      await loadSessions(token);
    };

    void load();
  }, [getToken, isLoaded, loadSessions]);

  useEffect(() => {
    if (!isLoaded) return;
    if (searchParams.get("new") === "1") {
      setDialogOpen(true);
    }
  }, [isLoaded, searchParams]);

  useEffect(() => {
    if (!dialogOpen) {
      profilesLoadedRef.current = false;
      return;
    }

    if (!isLoaded || profilesLoadedRef.current || profiles.length > 0) return;

    const loadProfiles = async () => {
      try {
        setProfilesLoading(true);
        setFormError(null);
        const token = await getToken();
        if (!token) {
          setFormError("Authentication required");
          return;
        }
        const data = await profilesApi.list(token);
        setProfiles(data);
        profilesLoadedRef.current = true;
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Unable to load profiles");
      } finally {
        setProfilesLoading(false);
      }
    };

    void loadProfiles();
  }, [dialogOpen, getToken, isLoaded, profiles.length]);

  const handleCreate = async () => {
    const token = await getToken();
    if (!token) {
      setFormError("Authentication required");
      return;
    }

    setCreating(true);
    setFormError(null);
    try {
      const session = await createNewSession(token, {
        profile_id: selectedProfile === "general" ? null : selectedProfile,
        title: customTitle.trim() ? customTitle.trim() : undefined,
      });

      if (session?.id) {
        setDialogOpen(false);
        setCustomTitle("");
        setSelectedProfile("general");
        router.push(`/dashboard/chat/${session.id}`);
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <SidebarProvider defaultOpen>
      <SessionSidebar
        sessions={sessions}
        isLoading={sessionsLoading}
        error={sessionsError}
        activeSessionId={null}
      />
      <SidebarInset className="flex min-h-[70vh] flex-col">
        <div className="flex h-full flex-col items-center justify-center gap-6 px-4 py-10 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-2xl font-semibold text-foreground">
                Academic conversations
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Start a chat to explore programs, pathways, and next steps tailored to a student profile.
            </p>
          </div>
          <Card className="max-w-xl space-y-3 p-6 text-left">
            <p className="text-sm font-medium text-foreground">Get started</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Choose a profile or start a general chat.</li>
              <li>• Ask about programs, match scores, and requirements.</li>
              <li>• Generate recommendations when you are ready.</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>New chat</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start a new chat</DialogTitle>
                    <DialogDescription>
                      Choose a profile for context-aware recommendations or start a general chat.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="chat-title">Session title (optional)</Label>
                      <Input
                        id="chat-title"
                        placeholder="e.g. MBA options for 2026"
                        value={customTitle}
                        onChange={(event) => setCustomTitle(event.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Profile context</Label>
                      <Select value={selectedProfile} onValueChange={setSelectedProfile}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select profile" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General chat (no profile)</SelectItem>
                          {profiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id}>
                              {profile.profile_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {profilesLoading && (
                      <p className="text-xs text-muted-foreground">Loading profiles...</p>
                    )}
                    {formError && <p className="text-xs text-destructive">{formError}</p>}
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={creating}>
                      {creating ? "Creating..." : "Start chat"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="outline" asChild>
                <Link href="/dashboard/profiles">Manage profiles</Link>
              </Button>
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
