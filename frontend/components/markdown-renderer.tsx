"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, children, ...props }) => {
            const text = children?.toString() || "";
            const id = slugify(text);
            return (
              <h1 id={id} className="scroll-m-20 text-4xl font-bold tracking-tight mb-4" {...props}>
                {children}
              </h1>
            );
          },
          h2: ({ node, children, ...props }) => {
            const text = children?.toString() || "";
            const id = slugify(text);
            return (
              <h2 id={id} className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10 mb-4" {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ node, children, ...props }) => {
            const text = children?.toString() || "";
            const id = slugify(text);
            return (
              <h3 id={id} className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4" {...props}>
                {children}
              </h3>
            );
          },
          h4: ({ node, children, ...props }) => {
            const text = children?.toString() || "";
            const id = slugify(text);
            return (
              <h4 id={id} className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3" {...props}>
                {children}
              </h4>
            );
          },
          p: ({ node, ...props }) => (
            <p className="leading-7 [&:not(:first-child)]:mt-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mt-2" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="mt-6 border-l-2 border-muted-foreground pl-6 italic text-muted-foreground" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            
            return !inline && match ? (
              <div className="relative group">
                <CopyButton value={codeString} />
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-md my-4"
                  {...props}
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code
                className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-muted" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="border border-border px-4 py-2 text-left font-semibold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="border border-border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
