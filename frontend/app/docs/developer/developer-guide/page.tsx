import { getMarkdownContent } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function DeveloperGuidePage() {
  const { content } = await getMarkdownContent('Developer Documentation/DEVELOPER_GUIDE.md');
  
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
