import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Rocket, Shield, TestTube, Layers } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight">
          SIRA Documentation
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete documentation for the Système Intelligent de Recommandation Académique platform.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <BookOpen className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>User Guide</CardTitle>
            <CardDescription>
              Learn how to use SIRA to find the perfect university programs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" asChild className="px-0">
              <Link href="/docs/guides/user-guide">
                Read guide
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Code className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>API Reference</CardTitle>
            <CardDescription>
              Complete API endpoint documentation with examples
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" asChild className="px-0">
              <Link href="/docs/guides/api-reference">
                View API docs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Rocket className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Deployment Guide</CardTitle>
            <CardDescription>
              Production deployment procedures and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" asChild className="px-0">
              <Link href="/docs/guides/deployment">
                Deploy SIRA
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Shield className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Security hardening and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" asChild className="px-0">
              <Link href="/docs/technical/security">
                Security docs
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <TestTube className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Testing</CardTitle>
            <CardDescription>
              Test suite documentation and coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" asChild className="px-0">
              <Link href="/docs/technical/testing">
                Testing guide
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Layers className="h-6 w-6 mb-2 text-primary" />
            <CardTitle>Architecture</CardTitle>
            <CardDescription>
              System architecture and implementation details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="ghost" size="sm" asChild className="px-0">
              <Link href="/docs/technical/conversation-system">
                View architecture
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 space-y-4">
        <h2 className="scroll-m-20 text-2xl font-semibold tracking-tight">
          Quick Links
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href="/docs/guides/user-guide"
            className="group flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="font-medium">Getting Started</p>
              <p className="text-sm text-muted-foreground">
                Create your first profile
              </p>
            </div>
            <svg
              className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
          <Link
            href="/docs/guides/api-reference"
            className="group flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div>
              <p className="font-medium">API Integration</p>
              <p className="text-sm text-muted-foreground">
                Integrate with SIRA APIs
              </p>
            </div>
            <svg
              className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
