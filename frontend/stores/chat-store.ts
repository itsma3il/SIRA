import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ProfileListResponse } from "@/lib/profile-api-types";
import type {
  SessionListResponse,
  SessionDetailResponse,
  MessageResponse,
} from "@/lib/types/conversation";

// ============================================================================
// Zustand Store
// ============================================================================

interface ChatState {
  // Sessions
  sessions: SessionListResponse | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  
  // Current session
  currentSessionId: string | null;
  sessionDetail: SessionDetailResponse | null;
  sessionLoading: boolean;
  sessionError: string | null;
  
  // Messages
  messages: MessageResponse[] | null;
  isStreaming: boolean;
  isStreamingRecommendation: boolean;
  
  // Profiles
  profiles: ProfileListResponse[];
  profilesLoading: boolean;
  profilesError: string | null;
  
  // Dialogs
  renameDialogOpen: boolean;
  deleteDialogOpen: boolean;
  profileDialogOpen: boolean;
  activeSessionIdForDialog: string | null;
  activeSessionTitle: string;
  
  // Actions - Sessions
  setSessions: (sessions: SessionListResponse | null) => void;
  setSessionsLoading: (loading: boolean) => void;
  setSessionsError: (error: string | null) => void;
  addSession: (session: any) => void;
  updateSession: (sessionId: string, updates: any) => void;
  removeSession: (sessionId: string) => void;
  
  // Actions - Current Session
  setCurrentSessionId: (id: string | null) => void;
  setSessionDetail: (detail: SessionDetailResponse | null) => void;
  setSessionLoading: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  
  // Actions - Messages
  setMessages: (messages: MessageResponse[] | null) => void;
  addMessage: (message: MessageResponse) => void;
  updateMessage: (messageId: string, updates: Partial<MessageResponse>) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsStreamingRecommendation: (streaming: boolean) => void;
  
  // Actions - Profiles
  setProfiles: (profiles: ProfileListResponse[]) => void;
  setProfilesLoading: (loading: boolean) => void;
  setProfilesError: (error: string | null) => void;
  
  // Actions - Dialogs
  setRenameDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setProfileDialogOpen: (open: boolean) => void;
  setActiveSessionForDialog: (sessionId: string | null, title?: string) => void;
  
  // Utility
  reset: () => void;
}

const initialState = {
  sessions: null,
  sessionsLoading: false,
  sessionsError: null,
  currentSessionId: null,
  sessionDetail: null,
  sessionLoading: false,
  sessionError: null,
  messages: null,
  isStreaming: false,
  isStreamingRecommendation: false,
  profiles: [],
  profilesLoading: false,
  profilesError: null,
  renameDialogOpen: false,
  deleteDialogOpen: false,
  profileDialogOpen: false,
  activeSessionIdForDialog: null,
  activeSessionTitle: "",
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        // ============================================================================
        // Sessions Actions
        // ============================================================================

        setSessions: (sessions) => set({ sessions }),
        
        setSessionsLoading: (loading) => set({ sessionsLoading: loading }),
        
        setSessionsError: (error) => set({ sessionsError: error }),

        addSession: (session) =>
          set((state) => {
            if (!state.sessions) {
              return {
                sessions: {
                  sessions: [
                    {
                      period: "Today",
                      sessions: [session],
                    },
                  ],
                  total: 1,
                },
              };
            }

            // Find or create "Today" group
            const sessions = [...state.sessions.sessions];
            const todayGroupIndex = sessions.findIndex((g) => g.period === "Today");

            if (todayGroupIndex >= 0) {
              // Add to existing Today group
              const todayGroup = { ...sessions[todayGroupIndex] };
              todayGroup.sessions = [session, ...todayGroup.sessions];
              sessions[todayGroupIndex] = todayGroup;
            } else {
              // Create new Today group
              sessions.unshift({
                period: "Today",
                sessions: [session],
              });
            }

            return {
              sessions: {
                sessions,
                total: (state.sessions.total || 0) + 1,
              },
            };
          }),

        updateSession: (sessionId, updates) =>
          set((state) => {
            if (!state.sessions) return state;

            const sessions = state.sessions.sessions.map((group) => ({
              ...group,
              sessions: group.sessions.map((session) =>
                session.id === sessionId ? { ...session, ...updates } : session
              ),
            }));

            return {
              sessions: {
                sessions,
                total: state.sessions.total,
              },
            };
          }),

        removeSession: (sessionId) =>
          set((state) => {
            if (!state.sessions) return state;

            const sessions = state.sessions.sessions
              .map((group) => ({
                ...group,
                sessions: group.sessions.filter((s) => s.id !== sessionId),
              }))
              .filter((group) => group.sessions.length > 0);

            return {
              sessions: {
                sessions,
                total: Math.max(0, (state.sessions.total || 0) - 1),
              },
            };
          }),

        // ============================================================================
        // Current Session Actions
        // ============================================================================

        setCurrentSessionId: (id) => set({ currentSessionId: id }),
        
        setSessionDetail: (detail) => set({ sessionDetail: detail }),
        
        setSessionLoading: (loading) => set({ sessionLoading: loading }),
        
        setSessionError: (error) => set({ sessionError: error }),

        // ============================================================================
        // Messages Actions
        // ============================================================================

        setMessages: (messages) => set({ messages }),
        
        addMessage: (message) =>
          set((state) => ({
            messages: [...(state.messages || []), message],
          })),
        
        updateMessage: (messageId, updates) =>
          set((state) => ({
            messages: state.messages?.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ) || null,
          })),
        
        setIsStreaming: (streaming) => set({ isStreaming: streaming }),
        
        setIsStreamingRecommendation: (streaming) => set({ isStreamingRecommendation: streaming }),

        // ============================================================================
        // Profiles Actions
        // ============================================================================

        setProfiles: (profiles) => set({ profiles }),
        
        setProfilesLoading: (loading) => set({ profilesLoading: loading }),
        
        setProfilesError: (error) => set({ profilesError: error }),

        // ============================================================================
        // Dialogs Actions
        // ============================================================================

        setRenameDialogOpen: (open) => set({ renameDialogOpen: open }),
        
        setDeleteDialogOpen: (open) => set({ deleteDialogOpen: open }),
        
        setProfileDialogOpen: (open) => set({ profileDialogOpen: open }),
        
        setActiveSessionForDialog: (sessionId, title = "") =>
          set({ activeSessionIdForDialog: sessionId, activeSessionTitle: title }),

        // ============================================================================
        // Utility
        // ============================================================================

        reset: () => set(initialState),
      }),
      {
        name: "chat-storage",
        partialize: (state) => ({
          // Only persist minimal data
          currentSessionId: state.currentSessionId,
        }),
      }
    ),
    { name: "ChatStore" }
  )
);

// ============================================================================
// Selectors (for better performance)
// ============================================================================

export const selectSessions = (state: ChatState) => state.sessions;
export const selectSessionsLoading = (state: ChatState) => state.sessionsLoading;
export const selectSessionsError = (state: ChatState) => state.sessionsError;
export const selectProfiles = (state: ChatState) => state.profiles;
export const selectProfilesLoading = (state: ChatState) => state.profilesLoading;
export const selectCurrentSession = (state: ChatState) => state.sessionDetail;
export const selectMessages = (state: ChatState) => state.messages;
export const selectIsStreaming = (state: ChatState) => state.isStreaming;
