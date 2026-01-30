import { DocsMarkdownPage } from "@/components/docs-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Security Hardening • SIRA Documentation",
  description: "Security features and best practices implementation.",
};

export default function SecurityPage() {
  return (
    <DocsMarkdownPage markdownPath="Operations Documentation/SECURITY.md" />
  );
}
