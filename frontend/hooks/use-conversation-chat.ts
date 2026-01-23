"use client";

import { useCallback, useRef, useState } from "react";
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  updateSession,
} from "@/lib/api/conversations";
import type {
  MessageResponse,
  SessionCreate,
  SessionDetailResponse,
  SessionListResponse,
  SessionResponse,
  SessionUpdate,
} from "@/lib/types/conversation";
import { useConversationStream } from "@/hooks/use-conversation-stream";

export type ChatMessage = MessageResponse & {
  isStreaming?: boolean;
};

interface UseConversationChatResult {
  sessions: SessionListResponse | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  sessionDetail: SessionDetailResponse | null;
  sessionLoading: boolean;
  sessionError: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  loadSessions: (token: string, params?: {
    profile_id?: string;
    status?: string;
    limit?: number;
  }) => Promise<void>;
  loadSession: (token: string, sessionId: string) => Promise<void>;
  createNewSession: (token: string, payload: SessionCreate) => Promise<SessionResponse | null>;
  updateExistingSession: (token: string, sessionId: string, payload: SessionUpdate) => Promise<SessionResponse | null>;
  deleteExistingSession: (token: string, sessionId: string) => Promise<boolean>;
  sendMessageStream: (token: string, sessionId: string, content: string) => Promise<void>;
  streamRecommendation: (token: string, sessionId: string) => Promise<void>;
  resetSessionState: () => void;
}

export function useConversationChat(): UseConversationChatResult {
  const [sessions, setSessions] = useState<SessionListResponse | null>(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetailResponse | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const activeRequestRef = useRef<{ token: string; sessionId: string } | null>(null);
  const streamingAssistantId = useRef<string | null>(null);

  const {
    isStreaming,
    streamMessage,
    streamRecommendation,
    cancel,
  } = useConversationStream({
    onChunk: (chunk) => {
      if (!streamingAssistantId.current) return;
      setMessages((prev) =>
        prev.map((message) =>
          message.id === streamingAssistantId.current
            ? {
                ...message,
                content: `${message.content}${chunk}`,
                isStreaming: true,
              }
            : message
        )
      );
    },
    onComplete: () => {
      if (streamingAssistantId.current) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === streamingAssistantId.current
              ? { ...message, isStreaming: false }
              : message
          )
        );
      }

      const active = activeRequestRef.current;
      if (active) {
        void loadSession(active.token, active.sessionId);
        void loadSessions(active.token);
      }

      streamingAssistantId.current = null;
    },
    onError: (error) => {
      setSessionError(error.message);
      streamingAssistantId.current = null;
    },
  });

  const loadSessions = useCallback(
    async (
      token: string,
      params?: {
        profile_id?: string;
        status?: string;
        limit?: number;
      }
    ) => {
      try {
        setSessionsLoading(true);
        setSessionsError(null);
        const data = await listSessions(token, params);
        setSessions(data);
      } catch (error) {
        setSessionsError(
          error instanceof Error ? error.message : "Unable to load sessions"
        );
      } finally {
        setSessionsLoading(false);
      }
    },
    []
  );

  const loadSession = useCallback(async (token: string, sessionId: string) => {
    try {
      setSessionLoading(true);
      setSessionError(null);
      const detail = await getSession(token, sessionId);
      setSessionDetail(detail);
      setMessages(detail.messages ?? []);
    } catch (error) {
      setSessionError(
        error instanceof Error ? error.message : "Unable to load session"
      );
    } finally {
      setSessionLoading(false);
    }
  }, []);

  const createNewSession = useCallback(
    async (token: string, payload: SessionCreate) => {
      try {
        const session = await createSession(token, payload);
        await loadSessions(token);
        return session;
      } catch (error) {
        setSessionsError(
          error instanceof Error ? error.message : "Unable to create session"
        );
        return null;
      }
    },
    [loadSessions]
  );

  const updateExistingSession = useCallback(
    async (token: string, sessionId: string, payload: SessionUpdate) => {
      try {
        const session = await updateSession(token, sessionId, payload);
        await loadSessions(token);
        return session;
      } catch (error) {
        setSessionError(
          error instanceof Error ? error.message : "Unable to update session"
        );
        return null;
      }
    },
    [loadSessions]
  );

  const deleteExistingSession = useCallback(
    async (token: string, sessionId: string) => {
      try {
        await deleteSession(token, sessionId);
        await loadSessions(token);
        if (sessionDetail?.id === sessionId) {
          setSessionDetail(null);
          setMessages([]);
        }
        return true;
      } catch (error) {
        setSessionError(
          error instanceof Error ? error.message : "Unable to delete session"
        );
        return false;
      }
    },
    [loadSessions, sessionDetail?.id]
  );

  const sendMessageStream = useCallback(
    async (token: string, sessionId: string, content: string) => {
      if (!content.trim()) return;

      const timestamp = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        created_at: timestamp,
      };

      const assistantMessage: ChatMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        created_at: timestamp,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      streamingAssistantId.current = assistantMessage.id;
      activeRequestRef.current = { token, sessionId };

      try {
        await streamMessage(sessionId, content, token);
      } catch (error) {
        setSessionError(
          error instanceof Error ? error.message : "Unable to send message"
        );
      }
    },
    [streamMessage]
  );

  const streamRecommendationHandler = useCallback(
    async (token: string, sessionId: string) => {
      const timestamp = new Date().toISOString();
      const assistantMessage: ChatMessage = {
        id: `temp-recommendation-${Date.now()}`,
        role: "assistant",
        content: "",
        created_at: timestamp,
        isStreaming: true,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      streamingAssistantId.current = assistantMessage.id;
      activeRequestRef.current = { token, sessionId };

      try {
        await streamRecommendation(sessionId, token);
      } catch (error) {
        setSessionError(
          error instanceof Error
            ? error.message
            : "Unable to generate recommendation"
        );
      }
    },
    [streamRecommendation]
  );

  const resetSessionState = useCallback(() => {
    cancel();
    setSessionDetail(null);
    setMessages([]);
    setSessionError(null);
    setSessionLoading(false);
  }, [cancel]);

  return {
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
    createNewSession,
    updateExistingSession,
    deleteExistingSession,
    sendMessageStream,
    streamRecommendation: streamRecommendationHandler,
    resetSessionState,
  };
}
