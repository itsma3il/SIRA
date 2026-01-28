"use client";

import { useEffect, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import Link from "next/link";

import { SessionSidebar } from "@/components/chat/session-sidebar";
import { SessionRenameDialog } from "@/components/chat/session-rename-dialog";
import { AlertDialogConfirm } from "@/components/ui/alert-dialog-confirm";
import { ChatErrorBoundary } from "@/components/chat/chat-error-boundary";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useChatStore } from "@/stores/chat-store";
import { useChatActions } from "@/hooks/use-chat-actions";

export default function ChatLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isLoaded } = useAuth();
  
  // Zustand store
  const sessions = useChatStore((state) => state.sessions);
  const sessionsLoading = useChatStore((state) => state.sessionsLoading);
  const sessionsError = useChatStore((state) => state.sessionsError);
  const profiles = useChatStore((state) => state.profiles);
  const profilesLoading = useChatStore((state) => state.profilesLoading);
  const renameDialogOpen = useChatStore((state) => state.renameDialogOpen);
  const deleteDialogOpen = useChatStore((state) => state.deleteDialogOpen);
  const profileDialogOpen = useChatStore((state) => state.profileDialogOpen);
  const activeSessionIdForDialog = useChatStore((state) => state.activeSessionIdForDialog);
  const activeSessionTitle = useChatStore((state) => state.activeSessionTitle);
  
  const setRenameDialogOpen = useChatStore((state) => state.setRenameDialogOpen);
  const setDeleteDialogOpen = useChatStore((state) => state.setDeleteDialogOpen);
  const setProfileDialogOpen = useChatStore((state) => state.setProfileDialogOpen);
  const setActiveSessionForDialog = useChatStore((state) => state.setActiveSessionForDialog);
  
  // Actions hook
  const {
    loadSessions,
    loadSessionDetail,
    updateSessionData,
    deleteSession,
    archiveSession,
    restoreSession,
    loadProfiles,
  } = useChatActions();

  // ============================================================================
  // Load sessions and profiles on mount
  // ============================================================================
  
  useEffect(() => {
    if (!isLoaded) return;
    loadSessions();
  }, [isLoaded, loadSessions]);

  useEffect(() => {
    if (!isLoaded) return;
    if (profiles.length === 0 && !profilesLoading) {
      loadProfiles();
    }
  }, [isLoaded, profiles.length, profilesLoading, loadProfiles]);

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const handleRenameSession = useCallback((sessionId: string) => {
    // Find session title
    const session = sessions?.sessions
      ?.flatMap(g => g.sessions)
      .find(s => s.id === sessionId);
    
    setActiveSessionForDialog(sessionId, session?.title || "");
    setRenameDialogOpen(true);
  }, [sessions, setActiveSessionForDialog, setRenameDialogOpen]);

  const handleArchiveSession = useCallback(async (sessionId: string) => {
    await archiveSession(sessionId);
  }, [archiveSession]);

  const handleRestoreSession = useCallback(async (sessionId: string) => {
    await restoreSession(sessionId);
  }, [restoreSession]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setActiveSessionForDialog(sessionId);
    setDeleteDialogOpen(true);
  }, [setActiveSessionForDialog, setDeleteDialogOpen]);

  const handleAttachProfile = useCallback((sessionId: string) => {
    if (profiles.length === 0) {
      toast.error("No profiles available. Create a profile first.");
      return;
    }
    setActiveSessionForDialog(sessionId);
    setProfileDialogOpen(true);
  }, [profiles.length, setActiveSessionForDialog, setProfileDialogOpen]);

  // ============================================================================
  // Confirm Actions
  // ============================================================================

  const confirmRename = useCallback(async (newTitle: string) => {
    if (!activeSessionIdForDialog) return;
    
    try {
      await updateSessionData(activeSessionIdForDialog, { title: newTitle });
      toast.success("Conversation renamed");
    } catch (error) {
      console.error("Failed to rename session:", error);
    } finally {
      setActiveSessionForDialog(null);
    }
  }, [activeSessionIdForDialog, updateSessionData, setActiveSessionForDialog]);

  const confirmDelete = useCallback(async () => {
    if (!activeSessionIdForDialog) return;
    
    try {
      const deleted = await deleteSession(activeSessionIdForDialog);
      if (deleted) {
        // Navigate to chat home if current session was deleted
        const currentPath = window.location.pathname;
        if (currentPath.includes(activeSessionIdForDialog)) {
          router.push("/dashboard/chat");
        }
      }
    } finally {
      setActiveSessionForDialog(null);
    }
  }, [activeSessionIdForDialog, deleteSession, router, setActiveSessionForDialog]);

  const confirmAttachProfile = useCallback(async (profileId: string) => {
    if (!activeSessionIdForDialog) return;
    
    try {
      await updateSessionData(activeSessionIdForDialog, { profile_id: profileId });
      toast.success("Profile attached successfully");
      setProfileDialogOpen(false);
    } catch (error) {
      console.error("Failed to attach profile:", error);
    } finally {
      setActiveSessionForDialog(null);
    }
  }, [activeSessionIdForDialog, updateSessionData, setProfileDialogOpen, setActiveSessionForDialog]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <ChatErrorBoundary>
      <SidebarProvider defaultOpen>
        <SessionSidebar
          sessions={sessions}
          isLoading={sessionsLoading}
          error={sessionsError}
          activeSessionId={null}
          onAttachProfile={handleAttachProfile}
          onRenameSession={handleRenameSession}
          onArchiveSession={handleArchiveSession}
          onDeleteSession={handleDeleteSession}
          onRestoreSession={handleRestoreSession}
        />
        
        <SidebarInset className="flex h-screen flex-col overflow-hidden bg-background">
          {children}
        </SidebarInset>

        {/* Rename Dialog */}
        <SessionRenameDialog
          open={renameDialogOpen}
          onOpenChange={setRenameDialogOpen}
          currentTitle={activeSessionTitle}
          onRename={confirmRename}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialogConfirm
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete conversation"
          description="Are you sure you want to delete this conversation? This will remove all messages and recommendations. This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={confirmDelete}
        />

        {/* Profile Attach Dialog */}
        {profileDialogOpen && (
          <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Attach a profile</DialogTitle>
                <DialogDescription>
                  Select a profile to attach to this conversation for personalized recommendations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <Select onValueChange={confirmAttachProfile}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.length === 0 ? (
                      <SelectItem value="no-profiles" disabled>
                        No profiles available
                      </SelectItem>
                    ) : (
                      profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.profile_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {profiles.length === 0 && (
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/dashboard/profiles/new">Create a profile</Link>
                  </Button>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button variant="ghost" onClick={() => { setProfileDialogOpen(false); setActiveSessionForDialog(null); }}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </SidebarProvider>
    </ChatErrorBoundary>
  );
}
