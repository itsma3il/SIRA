"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";
import { DocSearch } from '@/components/doc-search';
import { UserNav } from '@/components/user-nav';
import { ThemeToggle } from '@/components/theme-toggle';

export function DocsNav() {
    const pathname = usePathname();
    const isDocsPage = pathname?.startsWith("/docs");

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center px-4 sm:px-6 lg:px-8">
                <Link href="/" className="mr-4 flex items-center space-x-2 lg:mr-6">
                    <BookOpen className="h-5 w-5" />
                    <span className="hidden font-bold sm:inline-block">SIRA</span>
                </Link>
                <nav className="flex items-center gap-4 text-sm font-medium lg:gap-6">
                    <Link
                        href="/docs"
                        className={cn(
                            "transition-colors hover:text-foreground/80",
                            isDocsPage ? "text-foreground" : "text-foreground/60"
                        )}
                    >
                        <span className="hidden sm:inline">Documentation</span>
                        <span className="sm:hidden">Docs</span>
                    </Link>
                    <Link
                        href="/dashboard"
                        className="transition-colors hover:text-foreground/80 text-foreground/60"
                    >
                        Dashboard
                    </Link>
                </nav>
                <div className="ml-auto flex items-center gap-2">
                    {/* Documentation Search - Primary Feature */}
                    <DocSearch />
                    <ThemeToggle />
                    <div className="hidden sm:block">
                        <UserNav />
                    </div>
                    <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
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
        </header>
    );
}
