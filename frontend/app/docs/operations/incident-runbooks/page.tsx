import { getMarkdownContent } from '@/lib/markdown';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function IncidentRunbooksPage() {
  const { content } = await getMarkdownContent('Operations Documentation/INCIDENT_RUNBOOKS.md');
  
  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
