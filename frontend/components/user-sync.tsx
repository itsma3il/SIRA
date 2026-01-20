"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export function UserSync() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!isUserLoaded || !isAuthLoaded || !user || hasSynced.current) {
      return;
    }

    const syncUser = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        await fetch(`${API_BASE_URL}/api/users/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: user.primaryEmailAddress?.emailAddress ?? null }),
        });
        console.log("[UserSync] User synced successfully", token);
        hasSynced.current = true;
      } catch {
        // Intentionally silent to avoid blocking the UI.
      }
    };

    void syncUser();
  }, [getToken, isAuthLoaded, isUserLoaded, user]);

  return null;
}
