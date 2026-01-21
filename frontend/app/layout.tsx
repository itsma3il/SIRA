import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { UserSync } from "@/components/user-sync";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIRA • Academic Recommendation Intelligence",
  description: "RAG-powered academic recommendation system for students and advisors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-muted/30 mx-auto flex justify-center text-foreground antialiased`}
      >
        <Providers>
          <div className="container flex min-h-screen items-center justify-center">
            <div className="relative w-full max-w-4xl sm:h-160 overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_32px_80px_-52px_rgba(15,23,42,0.55)]">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-card/80 px-6 py-5 backdrop-blur sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    S
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      SIRA
                    </p>
                    <p className="text-lg font-semibold text-foreground">Academic Intelligence</p>
                    <Breadcrumbs />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <UserNav />
                </div>
              </header>
              <UserSync />
              <div className="h-[calc(100%-72px)] overflow-auto">
                <main className="px-6 py-8 sm:px-8 sm:py-10">{children}</main>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
