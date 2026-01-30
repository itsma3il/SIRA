"use client";

import React, { memo, lazy, Suspense } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";
import { nightOwl } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Lazy load syntax highlighter for better initial load performance
const SyntaxHighlighter = lazy(() => 
  import("react-syntax-highlighter").then(mod => ({ default: mod.Prism }))
);

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Memoized code component with lazy loading
const CodeBlock = memo(({ inline, className, children, ...props }: {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
  const match = /language-(\w+)/.exec(className || "");
  const codeString = String(children).replace(/\n$/, "");
  
  return !inline && match ? (
    <div className="relative group">
      <CopyButton value={codeString} />
      <Suspense fallback={
        <pre className="rounded-md bg-background p-4 overflow-x-auto my-4">
          <code className="text-foreground text-sm">{codeString}</code>
        </pre>
      }>
        <SyntaxHighlighter
          style={nightOwl}
          language={match[1]}
          PreTag="div"
          className="rounded-md"
          customStyle={{
            margin: 0,
            borderRadius: "0.375rem",
            fontSize: "0.875rem",
            lineHeight: "1.7142857",
          }}
          {...props}
        >
          {codeString}
        </SyntaxHighlighter>
      </Suspense>
    </div>
  ) : (
    <code
      className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
      {...props}
    >
      {children}
    </code>
  );
});
CodeBlock.displayName = "CodeBlock";

export const MarkdownRenderer = memo(({ content, className }: MarkdownRendererProps) => {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          h1: ({ node, children, ...props }) => (
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight mb-4" {...props}>
              {children}
            </h1>
          ),
          h2: ({ node, children, ...props }) => (
            <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight mt-10 mb-4" {...props}>
              {children}
            </h2>
          ),
          h3: ({ node, children, ...props }) => (
            <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight mt-8 mb-4" {...props}>
              {children}
            </h3>
          ),
          h4: ({ node, children, ...props }) => (
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight mt-6 mb-3" {...props}>
              {children}
            </h4>
          ),
          p: (props) => (
            <p className="leading-7 not-first:mt-4" {...props} />
          ),
          a: (props) => (
            <a
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
              {...props}
            />
          ),
          ul: (props) => (
            <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
          ),
          ol: (props) => (
            <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
          ),
          li: (props) => (
            <li className="mt-2" {...props} />
          ),
          blockquote: (props) => (
            <blockquote className="mt-6 border-l-2 border-muted-foreground pl-6 italic text-muted-foreground [&:not(:first-child)]:mt-6" {...props} />
          ),
          code: CodeBlock as React.ComponentType<{ inline?: boolean; className?: string; children: React.ReactNode }>,
          table: (props) => (
            <div className="my-6 w-full overflow-y-auto">
              <table className="w-full border-collapse" {...props} />
            </div>
          ),
          thead: (props) => (
            <thead className="bg-muted" {...props} />
          ),
          th: (props) => (
            <th className="border border-border px-4 py-2 text-left font-semibold [[align=center]]:text-center [[align=right]]:text-right" {...props} />
          ),
          td: (props) => (
            <td className="border border-border px-4 py-2 text-left [[align=center]]:text-center [[align=right]]:text-right" {...props} />
          ),
          tr: (props) => (
            <tr className="even:bg-muted/50 hover:bg-muted transition-colors" {...props} />
          ),
          hr: (props) => (
            <hr className="my-8 border-border" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = "MarkdownRenderer";
