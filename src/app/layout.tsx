import type { Metadata } from "next";
import { Fira_Code, Lora, Poppins } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { ThemeProvider } from "@/components/theming/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/trpc/client";

import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Church Transportation Team",
  description:
    "Connecting church members with reliable transportation services",
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <TRPCReactProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${poppins.variable} ${lora.variable} ${firaCode.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <NuqsAdapter>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </NuqsAdapter>
          </ThemeProvider>
        </body>
      </html>
    </TRPCReactProvider>
  );
};

export default RootLayout;
