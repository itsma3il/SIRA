"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function UserSync() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const hasSynced = useRef(false);
  const isSyncing = useRef(false);

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded || !user) {
      return;
    }

    // Check if already synced in session storage
    if (typeof window !== "undefined") {
      const syncKey = `sira:user-synced:${user.id}`;
      const alreadySynced = window.sessionStorage.getItem(syncKey);
      if (alreadySynced) {
        console.log("[UserSync] User already synced in this session");
        hasSynced.current = true;
        return;
      }
    }

    // Prevent concurrent sync attempts
    if (hasSynced.current || isSyncing.current) {
      return;
    }

    const syncUser = async () => {
      isSyncing.current = true;
      try {
        console.log("[UserSync] Starting sync for user:", user.id);
        
        // Get the default token (OIDC format works with Clerk's JWT)
        const token = await getToken();
        
        console.log("[UserSync] Token received:", token ? "yes" : "no");
        if (!token) {
          console.warn("[UserSync] No token received from Clerk");
          isSyncing.current = false;
          return;
        }

        console.log("[UserSync] Syncing user:", user.id);
        const response = await fetch(`${API_BASE_URL}/api/users/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress ?? null }),
        });

        console.log("[UserSync] Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[UserSync] Sync failed:", response.status, errorText);
          isSyncing.current = false;
          return;
        }

        const data = await response.json();
        console.log("[UserSync] User synced successfully:", data);
        
        if (typeof window !== "undefined") {
          const syncKey = `sira:user-synced:${user.id}`;
          window.sessionStorage.setItem(syncKey, "true");
        }
        hasSynced.current = true;
      } catch (error) {
        console.error("[UserSync] Error syncing user:", error);
        isSyncing.current = false;
      }
    };

    void syncUser();
  }, [user?.id, getToken, isAuthLoaded, isUserLoaded]);

  return null;
}
