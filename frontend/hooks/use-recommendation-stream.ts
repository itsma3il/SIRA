/**
 * Custom hook for streaming recommendations via Server-Sent Events (SSE)
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

interface UseRecommendationStreamResult {
  content: string;
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
  generate: (profileId: string, token: string) => void;
  reset: () => void;
}

/**
 * Hook to stream recommendation generation in real-time
 *
 * @returns Streaming state and control functions
 *
 * @example
 * ```tsx
 * const { content, isLoading, generate } = useRecommendationStream();
 *
 * return (
 *   <div>
 *     <button onClick={() => generate(profileId, token)}>Generate</button>
 *     {isLoading && <p>Generating...</p>}
 *     <div>{content}</div>
 *   </div>
 * );
 * ```
 */
export function useRecommendationStream(): UseRecommendationStreamResult {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const eventSourceRef = useRef<AbortController | null>(null);

  // Cleanup function to abort the fetch stream
  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      (eventSourceRef.current as AbortController).abort();
      eventSourceRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    cleanup();
    setContent("");
    setIsLoading(false);
    setIsComplete(false);
    setError(null);
  }, [cleanup]);

  // Start streaming
  const generate = useCallback(async (profileId: string, token: string) => {
    if (!profileId || !token) {
      setError("Missing profile ID or authentication token");
      return;
    }

    // Reset previous state
    reset();
    setIsLoading(true);
    setError(null);

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const url = `${API_BASE_URL}/api/recommendations/stream/${profileId}`;

    // Create an AbortController for cleanup
    const ctrl = new AbortController();
    eventSourceRef.current = ctrl as any;

    try {
      await fetchEventSource(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: ctrl.signal,
        
        async onopen(response) {
          if (response.ok) {
            return Promise.resolve(); // Connection successful
          }
          
          // Handle HTTP errors
          if (response.status === 401) {
            throw new Error("Authentication failed. Please sign in again.");
          } else if (response.status === 403) {
            throw new Error("You don't have permission to access this profile.");
          } else if (response.status === 404) {
            throw new Error("Profile not found.");
          } else {
            throw new Error(`Server error: ${response.status}`);
          }
        },
        
        onmessage(event) {
          const data = event.data;

          // Check for completion signal
          if (data === "[DONE]") {
            setIsLoading(false);
            setIsComplete(true);
            ctrl.abort();
            return;
          }

          // Check for error signal
          if (data.startsWith("[ERROR]")) {
            const errorMessage = data.replace("[ERROR]", "").trim();
            setError(errorMessage || "An error occurred during generation");
            setIsLoading(false);
            ctrl.abort();
            return;
          }

          // Append content chunk
          setContent((prev) => prev + data);
        },
        
        onerror(err) {
          console.error("Stream connection error:", err);
          setError(err instanceof Error ? err.message : "Connection error. Please try again.");
          setIsLoading(false);
          throw err; // Stop retrying
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Failed to start streaming:", err);
        setError(err.message || "Failed to start recommendation generation");
        setIsLoading(false);
      }
    }
  }, [reset, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    content,
    isLoading,
    isComplete,
    error,
    generate,
    reset,
  };
}
