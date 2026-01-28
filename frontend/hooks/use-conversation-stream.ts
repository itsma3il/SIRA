/**
 * Hook for streaming chat messages with SSE
 */

import { useState, useCallback, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

interface UseConversationStreamOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useConversationStream(options: UseConversationStreamOptions = {}) {
  const [content, setContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const streamMessage = useCallback(
    async (sessionId: string, message: string, token: string) => {
      setContent("");
      setError(null);
      setIsStreaming(true);

      abortControllerRef.current = new AbortController();

      try {
        const url = `${API_BASE}/api/conversations/sessions/${sessionId}/stream`;

        await fetchEventSource(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: message }),
          signal: abortControllerRef.current.signal,
          onmessage(event) {
            if (event.data === "[DONE]") {
              setIsStreaming(false);
              options.onComplete?.();
              return;
            }

            if (event.data.startsWith("[ERROR]")) {
              const errorMsg = event.data.replace("[ERROR]", "").trim();
              const error = new Error(errorMsg);
              setError(error);
              setIsStreaming(false);
              options.onError?.(error);
              return;
            }

            // Handle empty chunks (connection confirmation) - just skip them
            if (!event.data || event.data.trim() === "") {
              return;
            }

            setContent((prev) => {
              const updated = prev + event.data;
              options.onChunk?.(event.data);
              return updated;
            });
          },
          onerror(err) {
            console.error("SSE error:", err);
            const error = new Error("Stream connection error");
            setError(error);
            setIsStreaming(false);
            options.onError?.(error);
            throw err; // Stop reconnection attempts
          },
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          options.onError?.(err);
        }
        setIsStreaming(false);
      }
    },
    [options]
  );

  const streamRecommendation = useCallback(
    async (sessionId: string, token: string) => {
      setContent("");
      setError(null);
      setIsStreaming(true);

      abortControllerRef.current = new AbortController();

      try {
        const url = `${API_BASE}/api/conversations/sessions/${sessionId}/recommend/stream`;

        await fetchEventSource(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
          onmessage(event) {
            if (event.data === "[DONE]") {
              setIsStreaming(false);
              options.onComplete?.();
              return;
            }

            if (event.data.startsWith("[ERROR]")) {
              const errorMsg = event.data.replace("[ERROR]", "").trim();
              const error = new Error(errorMsg);
              setError(error);
              setIsStreaming(false);
              options.onError?.(error);
              return;
            }

            // Handle empty chunks (connection confirmation) - just skip them
            if (!event.data || event.data.trim() === "") {
              return;
            }

            setContent((prev) => {
              const updated = prev + event.data;
              options.onChunk?.(event.data);
              return updated;
            });
          },
          onerror(err) {
            console.error("SSE error:", err);
            const error = new Error("Stream connection error");
            setError(error);
            setIsStreaming(false);
            options.onError?.(error);
            throw err;
          },
        });
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err);
          options.onError?.(err);
        }
        setIsStreaming(false);
      }
    },
    [options]
  );

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    content,
    isStreaming,
    error,
    streamMessage,
    streamRecommendation,
    cancel,
  };
}
