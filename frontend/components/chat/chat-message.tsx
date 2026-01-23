"use client";

import { Copy, Loader2 } from "lucide-react";
import { Message, MessageAction, MessageActions, MessageContent } from "@/components/prompt-kit/message";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/use-conversation-chat";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role !== "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {
      // Silent copy failure to avoid interrupting flow.
    }
  };

  return (
    <Message
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-col gap-2 px-6",
        isAssistant ? "items-start" : "items-end"
      )}
    >
      {isAssistant ? (
        <div className="group flex w-full flex-col gap-2">
          <MessageContent
            className="text-foreground prose max-w-none rounded-lg bg-transparent p-0"
            markdown
          >
            {message.content || (message.isStreaming ? "…" : "")}
          </MessageContent>
          <MessageActions
            className={cn(
              "-ml-2.5 flex items-center gap-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100",
              message.isStreaming && "opacity-100"
            )}
          >
            {message.isStreaming ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Streaming response
              </div>
            ) : (
              <MessageAction tooltip="Copy response" delayDuration={100}>
                <Button variant="ghost" size="icon" className="rounded-full" onClick={handleCopy}>
                  <Copy />
                </Button>
              </MessageAction>
            )}
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
