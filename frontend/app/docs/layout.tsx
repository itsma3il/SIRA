import { Metadata } from "next";
import { DocsNav } from "@/components/docs-nav";
import { DocsSidebar } from "@/components/docs-sidebar";
import { TableOfContents } from "@/components/table-of-contents";
import { DocsBreadcrumb } from "@/components/docs-breadcrumb";
import { WebVitals } from "@/components/web-vitals";

export const metadata: Metadata = {
  title: "Documentation • SIRA",
  description: "Complete documentation for the SIRA Academic Recommendation platform.",
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <WebVitals />
      <DocsNav />
      <div className="container flex-1 items-start mx-auto px-4 md:px-6 lg:px-8 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:gap-12">
        <DocsSidebar />
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px] 2xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0 max-w-4xl">
            <DocsBreadcrumb />
            <article className="prose prose-slate dark:prose-invert max-w-none">
              {children}
            </article>
          </div>
          {/* Desktop TOC */}
          <aside className="hidden text-sm xl:block" aria-label="Table of contents">
            <TableOfContents />
          </aside>
          {/* Mobile TOC */}
          <div className="xl:hidden">
            <TableOfContents mobile />
          </div>
        </main>
      </div>
    </div>
  );
}
