import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import { SkipToMain } from "@/components/skip-to-main";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} ${geistMono.variable} font-sans bg-background text-foreground antialiased`}
      >
        <SkipToMain />
        <Providers>
          <main id="main-content" tabIndex={-1}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
