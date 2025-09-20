"use client";

import { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";

import { Toaster } from "@/components/ui/sonner";

import { OauthCompletionModal } from "@/components/auth/oauth-completion-modal";
import { ThemeProvider } from "@/components/theme-provider";

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
        <OauthCompletionModal />
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </SessionProvider>
  );
};
