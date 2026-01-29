"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";

export function DocsNav() {
  const pathname = usePathname();
  const isDocsPage = pathname?.startsWith("/docs");

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span className="font-bold">SIRA</span>
        </Link>
        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            href="/docs"
            className={cn(
              "transition-colors hover:text-foreground/80",
              isDocsPage ? "text-foreground" : "text-foreground/60"
            )}
          >
            Documentation
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Dashboard
          </Link>
        </nav>
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="ghost" size="sm" asChild>
            <a
              href="https://github.com/yourusername/sira"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
