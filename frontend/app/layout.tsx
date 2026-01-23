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
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <Providers>
          <div className="flex min-h-svh w-full flex-col">
            {/* <header className="z-10 w-full border-b border-border/70 bg-card/80 backdrop-blur">
              <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-8">
                <div className="flex items-center justify-start gap-3">
                  <div className="space-y-1 flex items-center gap-2">
                    <p className="text-lg font-bold text-foreground">
                      SIRA
                    </p>
                  </div>
                  <Breadcrumbs />
                </div>
                <div className="flex items-center gap-2">
                  <ThemeToggle />
                  <UserNav />
                </div>
                <UserSync />
              </div>
            </header> */}
            {/* <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-8"> */}
              <main className="flex-1">{children}</main>
            {/* </div> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}
