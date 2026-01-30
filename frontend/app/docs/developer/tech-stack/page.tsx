import { getMarkdownContent } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function TechStackPage() {
  const { content } = await getMarkdownContent('Developer Documentation/TECH_STACK.md');
  
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
