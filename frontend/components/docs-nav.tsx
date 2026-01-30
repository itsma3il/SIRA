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
        <header className="sticky top-0 z-50 w-full flex justify-center border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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
                            href="https://github.com/itsma3il/sira"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {/* GitHub */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide size-4 lucide-github-icon lucide-github"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
}
