"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

import { ChatContainerContent, ChatContainerRoot, ChatContainerScrollAnchor } from "@/components/prompt-kit/chat-container";
import { ScrollButton } from "@/components/prompt-kit/scroll-button";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatMinimap } from "@/components/chat/chat-minimap";
import { SessionHeader } from "@/components/chat/session-header";
import { Card } from "@/components/ui/card";
import { useConversationChat } from "@/hooks/use-conversation-chat";
import { useChatStore } from "@/stores/chat-store";
import { useChatActions } from "@/hooks/use-chat-actions";

export default function ChatSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params?.sessionId;
  const { getToken, isLoaded } = useAuth();
  
  // Zustand store
  const profiles = useChatStore((state) => state.profiles);
  const sessionDetail = useChatStore((state) => state.sessionDetail);
  const sessionLoading = useChatStore((state) => state.sessionLoading);
  const sessionError = useChatStore((state) => state.sessionError);
  const messages = useChatStore((state) => state.messages);
  const isStreaming = useChatStore((state) => state.isStreaming);
  const isStreamingRecommendation = useChatStore((state) => state.isStreamingRecommendation);
  
  // Actions
  const { loadSessionDetail, updateSessionData, deleteSession, archiveSession, restoreSession } = useChatActions();
  
  const {
    sendMessageStream,
    streamRecommendation,
    stopStreaming,
  } = useConversationChat();

  const [input, setInput] = useState("");

  // Load session detail on mount
  useEffect(() => {
    if (!isLoaded || !sessionId) return;
    loadSessionDetail(sessionId);
  }, [isLoaded, sessionId, loadSessionDetail]);

  const handleSend = async () => {
    if (!sessionId) return;
    const token = await getToken();
    if (!token) return;
    const message = input.trim();
    if (!message) return;
    setInput("");
    await sendMessageStream(token, sessionId, message);
  };

  const handleArchiveToggle = async () => {
    if (!sessionId || !sessionDetail) return;
    try {
      if (sessionDetail.status === "archived") {
        await restoreSession(sessionId);
      } else {
        await archiveSession(sessionId);
      }
      // Force reload session detail to sync with store update
      await loadSessionDetail(sessionId);
    } catch (error) {
      console.error("Failed to toggle archive:", error);
    }
  };

  const handleAttachProfileToActive = async (profileId: string) => {
    if (!sessionId) return;
    try {
      await updateSessionData(sessionId, { profile_id: profileId });
      // Reload session detail to get updated profile
      await loadSessionDetail(sessionId);
    } catch (error) {
      console.error("Failed to attach profile:", error);
    }
  };

  const handleGenerateRecommendation = async () => {
    if (!sessionId) return;
    const token = await getToken();
    if (!token) return;
    await streamRecommendation(token, sessionId);
  };

  const handleNavigateToMessage = (messageId: string) => {
    const element = document.getElementById(`message-${messageId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const chatMessages = useMemo(() => messages ?? [], [messages]);
  const hasProfile = Boolean(sessionDetail?.profile_id || sessionDetail?.profile);
  // Block recommendation if any streaming is happening OR if already generating recommendation
  const canGenerateRecommendation = !isStreaming && !isStreamingRecommendation;

  return (
    <>
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
            onRename={async (newTitle) => {
              if (!sessionId) return;
              try {
                await updateSessionData(sessionId, { title: newTitle });
                await loadSessionDetail(sessionId);
                toast.success("Conversation renamed successfully");
              } catch (error) {
                console.error("Failed to rename session:", error);
              }
            }}
            onDelete={() => {
              if (sessionId) deleteSession(sessionId);
            }}
            onToggleArchive={handleArchiveToggle}
            onAttachProfile={() => {
              if (!profiles.length) {
                toast.error("No profiles available. Create a profile first.");
                return;
              }
              if (sessionId) {
                useChatStore.getState().setActiveSessionForDialog(sessionId);
                useChatStore.getState().setProfileDialogOpen(true);
              }
            }}
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
            <ChatMinimap messages={chatMessages} onNavigate={handleNavigateToMessage} />
          </div>

          <div className="bg-background z-10 shrink-0 px-3 pb-3 md:px-5 md:pb-5">
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              onStop={stopStreaming}
              onRecommend={handleGenerateRecommendation}
              onAttachProfile={handleAttachProfileToActive}
              profiles={profiles}
              hasProfile={hasProfile}
              recommendationDisabled={!canGenerateRecommendation}
              disabled={sessionDetail.status !== "active"}
              isStreaming={isStreaming}
              isStreamingRecommendation={isStreamingRecommendation}
            />
          </div>
        </>
      )}
    </>
  );
}
