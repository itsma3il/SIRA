"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
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
import { useChatStore } from "@/stores/chat-store";
import { useChatActions } from "@/hooks/use-chat-actions";

export default function ChatPage() {
  const { isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Zustand store
  const profiles = useChatStore((state) => state.profiles);
  
  // Actions
  const { createSession } = useChatActions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string>("general");
  const [customTitle, setCustomTitle] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (searchParams.get("new") === "1") {
      setDialogOpen(true);
    }
  }, [isLoaded, searchParams]);

  const handleCreate = async () => {
    setCreating(true);
    setFormError(null);
    try {
      const session = await createSession({
        profile_id: selectedProfile === "general" ? null : selectedProfile,
        title: customTitle.trim() ? customTitle.trim() : undefined,
      });

      if (session?.id) {
        setDialogOpen(false);
        setCustomTitle("");
        setSelectedProfile("general");
        router.push(`/dashboard/chat/${session.id}`);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to create conversation");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="flex h-screen flex-col items-center justify-center p-6">
        <Card className="w-full max-w-2xl p-8">
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">Academic Chat Assistant</h1>
              <p className="text-muted-foreground">
                Get personalized academic program recommendations and guidance
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full">
                    <svg
                      className="mr-2 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Start new conversation
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Start a new conversation</DialogTitle>
                    <DialogDescription>
                      Configure your chat session. You can attach a profile for personalized
                      recommendations or start a general chat.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Conversation title (optional)</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Master's programs in AI"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
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
          </div>
        </Card>
      </div>
    </>
  );
}
