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
    stopStreaming,
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
  const hasProfile = Boolean(sessionDetail?.profile_id || sessionDetail?.profile);
  
  // Allow multiple recommendations - show button if:
  // 1. Not currently streaming
  // 2. Has at least 2 new messages since last recommendation (for subsequent ones)
  const canGenerateRecommendation = !isStreaming;

  return (
    <SidebarProvider defaultOpen>
      <SessionSidebar
        sessions={sessions}
        isLoading={sessionsLoading}
        error={sessionsError}
        activeSessionId={sessionId ?? null}
      />
      <SidebarInset className="flex h-screen flex-col overflow-hidden bg-background">
        {sessionLoading && !sessionDetail ? (
          <div className="p-6">
            <Card className="p-4 text-sm text-muted-foreground">Loading conversation...</Card>
          </div>
        ) : sessionError ? (
          <div className="p-6">
            <Card className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-destructive/10 p-2">
                  <svg className="h-5 w-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Unable to Load Session</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{sessionError}</p>
                  {sessionError.includes("expired") && (
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh Page
                    </button>
                  )}
                </div>
              </div>
            </Card>
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

            <div className="relative flex-1 overflow-y-auto">
              <ChatContainerRoot className="h-full">
                <ChatContainerContent className="space-y-0 px-5 py-12">
                  {chatMessages.length === 0 ? (
                    <Card className="p-6 text-sm text-muted-foreground">
                      Ask a question to begin the conversation.
                    </Card>
                  ) : (
                    chatMessages.map((message) => {
                      // Find if this message is linked to a recommendation
                      const linkedRecommendation = message.metadata?.type === "recommendation_generated"
                        ? sessionDetail.recommendations?.find(r => r.id === message.metadata?.recommendation_id)
                        : null;
                      
                      return (
                        <ChatMessage
                          key={message.id}
                          message={message}
                          recommendationSummary={linkedRecommendation || null}
                        />
                      );
                    })
                  )}
                  <ChatContainerScrollAnchor />
                </ChatContainerContent>
                <div className="absolute bottom-4 right-4">
                  <ScrollButton />
                </div>
              </ChatContainerRoot>
            </div>

            <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onStop={stopStreaming}
                onRecommend={handleGenerateRecommendation}
                onAttachProfile={handleAttachProfile}
                profiles={profiles}
                hasProfile={hasProfile}
                recommendationDisabled={!canGenerateRecommendation}
                disabled={sessionDetail.status === "archived"}
                isStreaming={isStreaming}
              />
              {sessionDetail.status === "archived" && (
                <p className="mt-2 text-xs text-muted-foreground">
                  This session is archived. Restore it to continue chatting.
                </p>
              )}
            </div>
          </>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
