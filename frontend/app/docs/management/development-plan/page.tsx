import { getMarkdownContent } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function DevelopmentPlanPage() {
  const { content } = await getMarkdownContent('Planning/COMPLETE_DEVELOPMENT_PLAN.md');
  
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
