import { useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { useChatStore } from "@/stores/chat-store";
import { api } from "@/lib/api";
import type { SessionCreate, SessionUpdate } from "@/lib/types/conversation";

/**
 * Professional hook for chat operations with Zustand state management.
 * Provides real-time updates across all components.
 */
export function useChatActions() {
  const { getToken } = useAuth();
  
  // Zustand actions
  const {
    setSessions,
    setSessionsLoading,
    setSessionsError,
    addSession,
    updateSession,
    removeSession,
    setSessionDetail,
    setSessionLoading,
    setSessionError,
    setMessages,
    setProfiles,
    setProfilesLoading,
    setProfilesError,
    setCurrentSessionId,
  } = useChatStore();
  
  // Get current sessionDetail
  const getSessionDetail = () => useChatStore.getState().sessionDetail;

  // ============================================================================
  // Sessions API
  // ============================================================================

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError(null);
      
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const data = await api.conversations.listSessions(token);
      setSessions(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load conversations";
      setSessionsError(message);
      toast.error(message);
    } finally {
      setSessionsLoading(false);
    }
  }, [getToken, setSessions, setSessionsLoading, setSessionsError]);

  const loadSessionDetail = useCallback(async (sessionId: string) => {
    try {
      setSessionLoading(true);
      setSessionError(null);
      setCurrentSessionId(sessionId);
      
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const detail = await api.conversations.getSession(token, sessionId);

      setSessionDetail(detail);
      setMessages(detail.messages || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load conversation";
      setSessionError(message);
      toast.error(message);
    } finally {
      setSessionLoading(false);
    }
  }, [getToken, setSessionDetail, setSessionLoading, setSessionError, setMessages, setCurrentSessionId]);

  const createSession = useCallback(async (data: SessionCreate) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const session = await api.conversations.createSession(token, data);
      
      // Optimistic update - add to store immediately
      addSession({
        id: session.id,
        title: session.title,
        profile_id: session.profile_id,
        profile_name: session.title || null,
        last_message: null,
        last_message_at: null,
        message_count: 0,
        created_at: session.created_at,
        status: "active",
      });

      toast.success("Conversation created");
      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create conversation";
      toast.error(message);
      throw error;
    }
  }, [getToken, addSession]);

  const updateSessionData = useCallback(
    async (sessionId: string, updates: SessionUpdate) => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Authentication required");
        }

        await api.conversations.updateSession(token, sessionId, updates);
        
        // Optimistic update - update store immediately
        updateSession(sessionId, updates as any);
        
        // Refresh full session data in background
        await loadSessionDetail(sessionId);
        
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to update conversation";
        toast.error(message);
        throw error;
      }
    },
    [getToken, updateSession, loadSessionDetail]
  );

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      await api.conversations.deleteSession(token, sessionId);
      
      // Optimistic update - remove from store immediately
      removeSession(sessionId);
      
      toast.success("Conversation deleted");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete conversation";
      toast.error(message);
      return false;
    }
  }, [getToken, removeSession]);

  const archiveSession = useCallback(async (sessionId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      await api.conversations.archiveSession(token, sessionId);
      
      // Optimistic update - update both sessions list AND sessionDetail if this is current session
      updateSession(sessionId, { status: "archived" });
      
      const currentDetail = getSessionDetail();
      if (currentDetail?.id === sessionId) {
        setSessionDetail({ ...currentDetail, status: "archived" });
      }
      
      toast.success("Conversation archived");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to archive conversation";
      toast.error(message);
      throw error;
    }
  }, [getToken, updateSession, setSessionDetail]);

  const restoreSession = useCallback(async (sessionId: string) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      await api.conversations.restoreSession(token, sessionId);
      
      // Optimistic update - update both sessions list AND sessionDetail if this is current session
      updateSession(sessionId, { status: "active" });
      
      const currentDetail = getSessionDetail();
      if (currentDetail?.id === sessionId) {
        setSessionDetail({ ...currentDetail, status: "active" });
      }
      
      toast.success("Conversation restored");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to restore conversation";
      toast.error(message);
      throw error;
    }
  }, [getToken, updateSession, setSessionDetail]);

  // ============================================================================
  // Profiles API
  // ============================================================================

  const loadProfiles = useCallback(async () => {
    try {
      setProfilesLoading(true);
      setProfilesError(null);
      
      const token = await getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const data = await api.profiles.list(token);
      setProfiles(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profiles";
      setProfilesError(message);
      toast.error(message);
    } finally {
      setProfilesLoading(false);
    }
  }, [getToken, setProfiles, setProfilesLoading, setProfilesError]);

  return {
    // Sessions
    loadSessions,
    loadSessionDetail,
    createSession,
    updateSessionData,
    deleteSession,
    archiveSession,
    restoreSession,
    
    // Profiles
    loadProfiles,
  };
}
