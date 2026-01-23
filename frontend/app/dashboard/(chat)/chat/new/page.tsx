"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/chat?new=1");
  }, [router]);

  return null;
}
