import { DocsMarkdownPage } from "@/components/docs-page";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Guide • SIRA Documentation",
  description: "Production deployment procedures and best practices.",
};

export default function DeploymentPage() {
  return (
    <DocsMarkdownPage markdownPath="Operations Documentation/DEPLOYMENT.md" />
  );
}
