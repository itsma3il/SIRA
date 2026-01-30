"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { List } from "lucide-react";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
  mobile?: boolean;
}

// Debounce utility for performance
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function TableOfContents({ className, mobile = false }: TableOfContentsProps) {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Memoized active heading setter with debounce
  const debouncedSetActiveId = useMemo(
    () => debounce((id: string) => setActiveId(id), 100),
    []
  );

  // Smooth scroll handler with offset
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Adjust for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      // Update URL without triggering navigation
      window.history.pushState(null, "", `#${id}`);

      // Close mobile sheet after navigation
      if (mobile) {
        setIsOpen(false);
      }
    }
  }, [mobile]);

  useEffect(() => {
    // Extract headings once on mount
    const headings = Array.from(
      document.querySelectorAll("h2, h3")
    );

    if (headings.length === 0) return;

    const items: TOCItem[] = headings.map((heading) => ({
      id: heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, "-") || "",
      text: heading.textContent || "",
      level: parseInt(heading.tagName.charAt(1)),
    }));
    setToc(items);

    // Set up intersection observer with optimized options
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Find the first intersecting entry (topmost visible heading)
        const intersecting = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0) {
          debouncedSetActiveId(intersecting[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -66% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1]
      }
    );

    // Observe all headings
    headings.forEach((heading) => {
      if (observerRef.current) {
        observerRef.current.observe(heading);
      }
    });

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [debouncedSetActiveId]);
  console.log('TOC items:', toc);
  // Memoize TOC items rendering
  const tocContent = useMemo(() => {
    if (toc.length === 0) return null;

    return (
      <nav className="space-y-1" aria-label="Table of contents">
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className={cn(
              "block py-1 text-sm transition-all duration-200 hover:text-foreground",
              item.level == 2 && "",
              item.level == 3 && "pl-8",
              activeId === item.id
                ? "font-semibold text-foreground border-l-2 border-primary -ml-px ps-3"
                : "text-muted-foreground hover:border-l-2 hover:border-muted -ml-px ps-3"
            )}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            {item.text}
          </a>
        ))}
      </nav>
    );
  }, [toc, activeId, handleClick]);

  if (toc.length === 0) {
    return null;
  }

  // Mobile version with sheet
  if (mobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="fixed bottom-4 right-4 z-50 xl:hidden shadow-lg"
            aria-label="Open table of contents"
          >
            <List className="h-4 w-4 mr-2" />
            Contents
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-75 sm:w-100">
          <div className="mt-6 pr-4">
            <h2 className="font-semibold text-sm mb-4">On This Page</h2>
            <ScrollArea className="h-[calc(100vh-8rem)] pr-4">
              {tocContent}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop version
  return (
    <div className={cn("sticky top-16 -mt-10 pt-4 space-y-2", className)}>
      <h2 className="font-semibold text-sm mb-4">On This Page</h2>
      <ScrollArea className="h-[calc(100vh-10rem)] pr-4">
        {tocContent}
      </ScrollArea>
    </div>
  );
}
