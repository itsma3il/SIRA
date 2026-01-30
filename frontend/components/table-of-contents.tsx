"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  className?: string;
}

export function TableOfContents({ className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [toc, setToc] = useState<TOCItem[]>([]);

  useEffect(() => {
    // Extract headings on client side only
    const headings = Array.from(document.querySelectorAll("h2, h3, h4"));
    const tocItems: TOCItem[] = headings.map((heading) => ({
      id: heading.id || heading.textContent?.toLowerCase().replace(/\s+/g, "-") || "",
      text: heading.textContent || "",
      level: parseInt(heading.tagName.charAt(1)),
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToc(tocItems);
  }, []);

  useEffect(() => {
    if (toc.length === 0) return;
    
    const headingElements = toc.map(item => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (headingElements.length === 0) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );
    
    headingElements.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="font-semibold text-sm mb-4">On This Page</p>
      <nav className="space-y-1">
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(
              "block text-sm transition-colors hover:text-foreground",
              item.level === 3 && "pl-4",
              activeId === item.id
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
