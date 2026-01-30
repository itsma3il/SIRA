import { DocsMarkdownPage } from "@/components/docs-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Testing Guide • SIRA Documentation",
  description: "Test suite documentation and coverage reports.",
};

export default function TestingPage() {
  return (
    <DocsMarkdownPage markdownPath="Developer Documentation/TESTING.md" />
  );
}
