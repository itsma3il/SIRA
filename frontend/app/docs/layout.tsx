import { Metadata } from "next";
import { DocsNav } from "@/components/docs-nav";
import { DocsSidebar } from "@/components/docs-sidebar";
import { TableOfContents } from "@/components/table-of-contents";
import { DocsBreadcrumb } from "@/components/docs-breadcrumb";

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
      <DocsNav />
      <div className="container flex-1 items-start mx-auto md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <DocsSidebar />
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0">
            <DocsBreadcrumb />
            {children}
          </div>
          <div className="hidden text-sm xl:block">
            <div className="sticky top-16 -mt-10 pt-4">
              <TableOfContents />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
