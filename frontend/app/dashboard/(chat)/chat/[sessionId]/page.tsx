"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import { ChatContainerContent, ChatContainerRoot, ChatContainerScrollAnchor } from "@/components/prompt-kit/chat-container";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { RecommendationOverview } from "@/components/chat/recommendation-overview";
import { SessionHeader } from "@/components/chat/session-header";
import { SessionSidebar } from "@/components/chat/session-sidebar";
import { Card } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useConversationChat } from "@/hooks/use-conversation-chat";
import { profilesApi } from "@/lib/profile-api";
import type { ProfileListResponse } from "@/lib/profile-api-types";

export default function ChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();

  const {
    sessions,
    sessionsLoading,
    sessionsError,
    sessionDetail,
    sessionLoading,
    sessionError,
    messages,
    isStreaming,
    loadSessions,
    loadSession,
    updateExistingSession,
    deleteExistingSession,
    sendMessageStream,
    streamRecommendation,
  } = useConversationChat();

  const [input, setInput] = useState("");
  const [profiles, setProfiles] = useState<ProfileListResponse[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const profilesFetchedSessionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !sessionId) return;

    const load = async () => {
      const token = await getToken();
      if (!token) return;
      await Promise.all([loadSessions(token), loadSession(token, sessionId)]);
    };

    void load();
  }, [getToken, isLoaded, loadSession, loadSessions, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    profilesFetchedSessionRef.current = null;
  }, [sessionId]);

  useEffect(() => {
    if (!isLoaded || !sessionId || !sessionDetail) return;
    if (sessionDetail.profile || profilesLoading) return;
    if (profilesFetchedSessionRef.current === sessionId) return;

    const loadProfiles = async () => {
      const token = await getToken();
      if (!token) return;
      setProfilesLoading(true);
      try {
        const data = await profilesApi.list(token);
        setProfiles(data);
        profilesFetchedSessionRef.current = sessionId;
      } finally {
        setProfilesLoading(false);
      }
    };

    void loadProfiles();
  }, [getToken, isLoaded, profilesLoading, sessionDetail, sessionId]);

  const handleSend = async () => {
    if (!sessionId) return;
    const token = await getToken();
    if (!token) return;
    const message = input.trim();
    if (!message) return;
    setInput("");
    await sendMessageStream(token, sessionId, message);
  };

  const handleRename = async (title: string) => {
    if (!sessionId) return;
    const token = await getToken();
    if (!token) return;
    await updateExistingSession(token, sessionId, { title });
    await loadSession(token, sessionId);
  };

  const handleArchiveToggle = async () => {
    if (!sessionId || !sessionDetail) return;
    const token = await getToken();
    if (!token) return;
    const nextStatus = sessionDetail.status === "archived" ? "active" : "archived";
    await updateExistingSession(token, sessionId, { status: nextStatus });
    await loadSession(token, sessionId);
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    const confirmDelete = window.confirm(
      "Delete this session? This will remove all messages and recommendations."
    );
    if (!confirmDelete) return;

    const token = await getToken();
    if (!token) return;
    const deleted = await deleteExistingSession(token, sessionId);
    if (deleted) {
      router.push("/dashboard/chat");
    }
  };

  const handleAttachProfile = async (profileId: string) => {
    if (!sessionId) return;
    const token = await getToken();
    if (!token) return;
    await updateExistingSession(token, sessionId, { profile_id: profileId });
    await loadSession(token, sessionId);
    toast.success("Profile attached to this session");
  };

  const handleGenerateRecommendation = async () => {
    if (!sessionId) return;
    const token = await getToken();
    if (!token) return;
    await streamRecommendation(token, sessionId);
  };

  const chatMessages = useMemo(() => messages ?? [], [messages]);

  return (
    <SidebarProvider defaultOpen>
      <SessionSidebar
        sessions={sessions}
        isLoading={sessionsLoading}
        error={sessionsError}
        activeSessionId={sessionId ?? null}
      />
      <SidebarInset className="flex min-h-[70vh] flex-col overflow-hidden">
        {sessionLoading && !sessionDetail ? (
          <div className="p-6">
            <Card className="p-4 text-sm text-muted-foreground">Loading conversation...</Card>
          </div>
        ) : sessionError ? (
          <div className="p-6">
            <Card className="p-4 text-sm text-destructive">{sessionError}</Card>
          </div>
        ) : !sessionDetail ? (
          <div className="p-6">
            <Card className="p-4 text-sm text-muted-foreground">
              Session not found or access denied.
            </Card>
          </div>
        ) : (
          <>
            <SessionHeader
              session={sessionDetail}
              onRename={handleRename}
              onDelete={handleDelete}
              onToggleArchive={handleArchiveToggle}
              isUpdating={isStreaming}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="relative flex-1 overflow-y-auto">
                <ChatContainerRoot className="h-full">
                  <ChatContainerContent className="space-y-6 px-5 py-8">
                    <RecommendationOverview
                      recommendation={sessionDetail.recommendation}
                      profileName={sessionDetail.profile?.profile_name}
                      isStreaming={isStreaming}
                      profiles={profiles}
                      onGenerate={handleGenerateRecommendation}
                      onAttachProfile={handleAttachProfile}
                    />

                    {chatMessages.length === 0 ? (
                      <Card className="p-6 text-sm text-muted-foreground">
                        Ask a question to begin the conversation.
                      </Card>
                    ) : (
                      chatMessages.map((message) => (
                        <ChatMessage key={message.id} message={message} />
                      ))
                    )}
                    <ChatContainerScrollAnchor />
                  </ChatContainerContent>
                  <div className="absolute bottom-4 right-4">
                    <ScrollButton />
                  </div>
                </ChatContainerRoot>
              </div>

              <div className="border-t bg-card px-4 py-4">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSend={handleSend}
                  disabled={sessionDetail.status === "archived"}
                  isStreaming={isStreaming}
                />
                {sessionDetail.status === "archived" && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    This session is archived. Restore it to continue chatting.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
