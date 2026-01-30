import { DocsMarkdownPage } from "@/components/docs-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Reference • SIRA Documentation",
  description: "Complete API endpoint documentation with examples.",
};

export default function ApiReferencePage() {
  return (
    <DocsMarkdownPage markdownPath="Developer Documentation/API_REFERENCE.md" />
  );
}
