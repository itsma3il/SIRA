"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronDown, List } from "lucide-react";
import type { TOCItem } from "@/lib/remark-extract-toc";

interface TableOfContentsProps {
  toc: TOCItem[];
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

export function TableOfContents({ toc, className, mobile = false }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

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
    if (!toc.length) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const intersecting = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (intersecting.length > 0) {
          debouncedSetActiveId(intersecting[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      }
    );

    toc.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [toc, debouncedSetActiveId]);

  useEffect(() => {
    if (!activeId) return;
    if (typeof window === "undefined") return;

    const nextHash = `#${activeId}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }, [activeId]);

  const sections = useMemo(() => {
    const grouped: { header: TOCItem; items: TOCItem[] }[] = [];
    let current: { header: TOCItem; items: TOCItem[] } | null = null;

    toc.forEach((item) => {
      if (item.level === 2) {
        current = { header: item, items: [] };
        grouped.push(current);
        return;
      }

      if (!current) {
        current = { header: { id: "__root", text: "", level: 2 }, items: [] };
        grouped.push(current);
      }

      current.items.push(item);
    });

    return grouped;
  }, [toc]);

  useEffect(() => {
    if (!sections.length) return;

    setOpenSections((prev) => {
      const next = { ...prev };
      sections.forEach(({ header }) => {
        if (header.id && next[header.id] === undefined) {
          next[header.id] = true;
        }
      });
      return next;
    });
  }, [sections]);
  // Memoize TOC items rendering
  const tocContent = useMemo(() => {
    if (toc.length === 0) return null;

    return (
      <nav className="space-y-2" aria-label="Table of contents">
        {sections.map(({ header, items }) => {
          const isRoot = header.id === "__root";
          const isOpen = isRoot ? true : openSections[header.id] !== false;

          return (
            <div key={header.id || "root"} className="space-y-1">
              {!isRoot && (
                <div className="flex w-full items-center justify-between gap-2 py-1">
                  <a
                    href={`#${header.id}`}
                    onClick={(e) => handleClick(e, header.id)}
                    className={cn(
                      "truncate text-left text-sm font-medium text-foreground hover:text-foreground/80",
                      activeId === header.id && "text-primary"
                    )}
                    aria-current={activeId === header.id ? "location" : undefined}
                  >
                    {header.text}
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenSections((prev) => ({
                        ...prev,
                        [header.id]: !isOpen,
                      }))
                    }
                    className="inline-flex h-7 w-7 items-center justify-center rounded-sm text-foreground hover:text-foreground/80"
                    aria-expanded={isOpen}
                    aria-label={isOpen ? "Collapse section" : "Expand section"}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        isOpen ? "rotate-0" : "-rotate-90"
                      )}
                    />
                  </button>
                </div>
              )}

              {isOpen && (
                <div className="space-y-1">
                  {items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      onClick={(e) => handleClick(e, item.id)}
                      className={cn(
                        "block py-1 text-sm transition-all duration-200 hover:text-foreground",
                        item.level === 3 && "pl-8",
                        item.level === 4 && "pl-12",
                        activeId === item.id
                          ? "font-semibold text-foreground border-l-2 border-primary -ml-px ps-3"
                          : "text-muted-foreground hover:border-l-2 hover:border-muted -ml-px ps-3"
                      )}
                      aria-current={activeId === item.id ? "location" : undefined}
                    >
                      {item.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }, [toc, sections, openSections, activeId, handleClick]);

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
