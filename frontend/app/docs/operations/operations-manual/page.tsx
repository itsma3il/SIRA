import { getMarkdownContent } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function OperationsManualPage() {
  const { content } = await getMarkdownContent('Operations Documentation/OPERATIONS.md');
  
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
