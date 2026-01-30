import { DocsBreadcrumb } from "@/components/docs-breadcrumb";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TableOfContents } from "@/components/table-of-contents";
import { getMarkdownContent } from "@/lib/markdown";
import type { TOCItem } from "@/lib/remark-extract-toc";

interface DocsPageProps {
  content: string;
  toc: TOCItem[];
}

export function DocsPage({ content, toc }: DocsPageProps) {
  return (
    <div className="lg:gap-10 xl:grid xl:grid-cols-[1fr_280px] 2xl:grid-cols-[1fr_300px]">
      <div className="mx-auto w-full min-w-0 max-w-4xl" data-doc-content>
        <DocsBreadcrumb />
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <MarkdownRenderer content={content} />
        </article>
      </div>
      <aside className="hidden text-sm xl:block" aria-label="Table of contents">
        <TableOfContents toc={toc} />
      </aside>
      <div className="xl:hidden">
        <TableOfContents toc={toc} mobile />
      </div>
    </div>
  );
}

export async function DocsMarkdownPage({ markdownPath }: { markdownPath: string }) {
  const { content, toc } = await getMarkdownContent(markdownPath);
  return <DocsPage content={content} toc={toc} />;
}
