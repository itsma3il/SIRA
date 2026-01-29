"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
}

const docsConfig: NavItem[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Introduction",
        href: "/docs",
      },
    ],
  },
  {
    title: "Guides",
    items: [
      {
        title: "User Guide",
        href: "/docs/guides/user-guide",
      },
      {
        title: "API Reference",
        href: "/docs/guides/api-reference",
      },
      {
        title: "Deployment Guide",
        href: "/docs/guides/deployment",
      },
    ],
  },
  {
    title: "Technical",
    items: [
      {
        title: "Security Hardening",
        href: "/docs/technical/security",
      },
      {
        title: "Testing",
        href: "/docs/technical/testing",
      },
      {
        title: "Conversation System",
        href: "/docs/technical/conversation-system",
      },
    ],
  },
  {
    title: "Implementation",
    items: [
      {
        title: "Phase 3: RAG Infrastructure",
        href: "/docs/implementation/phase3",
      },
      {
        title: "Phase 7: Feedback System",
        href: "/docs/implementation/phase7",
      },
    ],
  },
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <nav className="space-y-6">
      {docsConfig.map((section, index) => (
        <div key={index} className="space-y-2">
          <h4 className="font-semibold text-sm">{section.title}</h4>
          {section.items && (
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => (
                <Link
                  key={itemIndex}
                  href={item.href || "#"}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted",
                    pathname === item.href
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

export function DocsSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-16 left-4 z-40">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon-sm">
              <Menu className="h-4 w-4" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <ScrollArea className="h-full py-6 pr-6">
              <SidebarContent />
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block">
        <ScrollArea className="h-full py-6 pr-6 lg:py-8">
          <SidebarContent />
        </ScrollArea>
      </aside>
    </>
  );
}
