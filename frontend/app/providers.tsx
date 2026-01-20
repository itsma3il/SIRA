"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import { ThemeProvider } from "next-themes";
import { useTheme } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeAwareClerkProvider>{children}</ThemeAwareClerkProvider>
    </ThemeProvider>
  );
}

function ThemeAwareClerkProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider
      dynamic
      appearance={{
        baseTheme: isDark ? shadcn  : 'simple',
        signIn: { theme: shadcn },
        signUp: { theme: shadcn },
        userProfile: {theme: shadcn },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
