"use client";

import Link from "next/link";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="grid gap-4 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage student profiles, recommendations, and conversations in one place.
          </p>
        </div>
      </header>

      <div className="flex-1 flex-col overflow-y-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Profiles</p>
            <p className="text-2xl font-semibold text-foreground">Create & manage</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Build student profiles to unlock tailored recommendations.
            </p>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href="/dashboard/profiles/new">New profile</Link>
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Recommendations</p>
            <p className="text-2xl font-semibold text-foreground">RAG pipeline</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate AI-driven program matches and explainability insights.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/profiles">View profiles</Link>
              </Button>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-xs text-muted-foreground">Chat</p>
            <p className="text-2xl font-semibold text-foreground">Conversational UX</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep a running conversation with students and the AI assistant.
            </p>
            <div className="mt-4">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/chat">Open chat</Link>
              </Button>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-[1.2fr,1fr]">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-foreground">
                Ready to guide a student?
              </h2>
              <p className="text-sm text-muted-foreground">
                Start by creating a profile or open an existing chat session. The assistant will use
                the profile and your conversation to generate recommendations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild>
                <Link href="/dashboard/profiles/new">Create profile</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/chat?new=1">Start chat</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
