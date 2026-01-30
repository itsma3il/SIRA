import { getMarkdownContent } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function ArchitecturePage() {
  const { content } = await getMarkdownContent('Developer Documentation/ARCHITECTURE.md');
  
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
