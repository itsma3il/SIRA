import fs from "fs";
import path from "path";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conversation System • SIRA Documentation",
  description: "Conversational AI architecture and implementation details.",
};

export default async function ConversationSystemPage() {
  const docsPath = path.join(process.cwd(), "../docs/technical/conversation_system_implementation.md");
  const content = fs.readFileSync(docsPath, "utf-8");

  return (
    <div className="space-y-6">
      <MarkdownRenderer content={content} />
    </div>
  );
}
