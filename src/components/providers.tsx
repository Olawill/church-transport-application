"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

interface ProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}
export const Providers = ({ children, session }: ProviderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SessionProvider session={session}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </SessionProvider>
  );
};
