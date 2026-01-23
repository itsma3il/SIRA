"use client";

import { ArrowUp } from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/prompt-kit/prompt-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled, isStreaming }: ChatInputProps) {
  const canSend = value.trim().length > 0 && !disabled && !isStreaming;

  return (
    <div className="space-y-2">
      <PromptInput
        value={value}
        onValueChange={onChange}
        onSubmit={canSend ? onSend : undefined}
        isLoading={isStreaming}
        disabled={disabled}
        className="w-full"
      >
        <div className="flex items-end gap-2">
          <PromptInputTextarea placeholder="Ask about programs, pathways, or goals..." />
          <PromptInputActions className="pb-1">
            <PromptInputAction tooltip={canSend ? "Send" : "Write a message"}>
              <Button
                size="icon"
                variant={canSend ? "default" : "outline"}
                disabled={!canSend}
                className={cn("rounded-full", isStreaming && "opacity-60")}
                onClick={onSend}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </div>
      </PromptInput>
      <p className="text-xs text-muted-foreground">Press Enter to send · Shift + Enter for a new line</p>
    </div>
  );
}
