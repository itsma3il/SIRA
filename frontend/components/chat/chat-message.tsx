"use client";

import { Copy, Loader2 } from "lucide-react";
import { Message, MessageAction, MessageActions, MessageContent } from "@/components/prompt-kit/message";
import { RecommendationCard } from "@/components/recommendation-card";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { RecommendationSkeleton } from "@/components/chat/recommendation-skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-conversation-chat";
import type { RecommendationSummary } from "@/lib/types/conversation";
import type { RecommendationFeedback } from "@/lib/types/recommendation";

interface ChatMessageProps {
  message: ChatMessage;
  recommendationSummary?: RecommendationSummary | null;
  sessionId?: string;
  onFeedback?: (recommendationId: string, feedback: RecommendationFeedback) => void;
}

export function ChatMessage({ message, recommendationSummary, sessionId, onFeedback }: ChatMessageProps) {
  const isAssistant = message.role !== "user";
  const isRecommendation = message.metadata?.type === "recommendation_generated";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // Silent copy failure to avoid interrupting flow.
    }
  };

  return (
    <Message
      id={`message-${message.id}`}
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col gap-2 px-6",
        isAssistant ? "items-start" : "items-end"
      )}
    >
      {isAssistant ? (
        <div className="group flex w-full flex-col gap-2">
          {isRecommendation ? (
            // Show skeleton while streaming recommendation
            message.isStreaming ? (
              <RecommendationSkeleton />
            ) : (
              <div className="relative w-full rounded-xl border-2 border-primary/20 bg-linear-to-br from-primary/5 via-background to-primary/5 p-6 shadow-lg">
                <div className="absolute -top-3 left-4 bg-background px-3 py-1 rounded-full border-2 border-primary/30">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Recommendation Generated
                  </div>
                </div>
                <RecommendationCard
                  recommendation={
                    recommendationSummary
                      ? {
                          id: recommendationSummary.id,
                          profile_id: "",
                          session_id: sessionId || "",
                          query: recommendationSummary.query,
                          retrieved_context: recommendationSummary.retrieved_context ?? null,
                          ai_response: recommendationSummary.ai_response,
                          structured_data: recommendationSummary.structured_data ?? null,
                          created_at: recommendationSummary.created_at,
                          feedback_rating: recommendationSummary.feedback_rating ?? null,
                          feedback_comment: recommendationSummary.feedback_comment ?? null,
                        }
                      : {
                          id: message.id,
                          profile_id: "",
                          session_id: sessionId || "",
                          query: "",
                          retrieved_context: null,
                          ai_response: message.content || "",
                          structured_data: null,
                          created_at: message.created_at,
                          feedback_rating: null,
                          feedback_comment: null,
                        }
                  }
                  onFeedbackSubmitted={onFeedback}
                />
              </div>
            )
          ) : (
            // Show typing indicator while streaming regular message, content when done
            message.isStreaming && !message.content ? (
              <TypingIndicator />
            ) : (
              <MessageContent
                className="text-foreground prose max-w-none rounded-lg bg-transparent p-0"
                markdown
              >
                {message.content || ""}
              </MessageContent>
            )
          )}
          <MessageActions
            className={cn(
              "-ml-2.5 flex items-center gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
              message.isStreaming && "opacity-100"
            )}
          >
            {message.isStreaming && message.content ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Streaming response
              </div>
            ) : !message.isStreaming ? (
              <MessageAction tooltip="Copy response" delayDuration={100}>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCopy}>
                  <Copy />
                </Button>
              </MessageAction>
            ) : null}
          </MessageActions>
        </div>
      ) : (
        <div className="group flex max-w-[85%] flex-col items-end gap-1 sm:max-w-[75%]">
          <MessageContent className="bg-muted text-primary rounded-3xl px-5 py-2.5">
            {message.content}
          </MessageContent>
          <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <MessageAction tooltip="Copy message" delayDuration={100}>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCopy}>
                <Copy />
              </Button>
            </MessageAction>
          </MessageActions>
        </div>
      )}
    </Message>
  );
}
