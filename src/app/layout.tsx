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
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://actsonwheels.com"
  ),
  title: {
    default: "ActsOnWheels - Church Transportation Service",
    template: "%s | ActsOnWheels",
  },
  description:
    "Connecting church members with reliable transportation services for church events and services. Request rides, manage pickups, and coordinate transportation for your church community.",
  keywords: [
    "church transportation",
    "ride sharing",
    "church services",
    "pickup requests",
    "community transport",
    "church rides",
  ],
  authors: [{ name: "ActsOnWheels Team" }],
  creator: "ActsOnWheels",
  publisher: "ActsOnWheels",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "ActsOnWheels - Church Transportation Service",
    description:
      "Connecting church members with reliable transportation services",
    siteName: "ActsOnWheels",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ActsOnWheels - Church Transportation Service",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ActsOnWheels - Church Transportation Service",
    description:
      "Connecting church members with reliable transportation services",
    images: ["/twitter-image.png"],
    creator: "@actsonwheels", // Update with your actual Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.webmanifest",
  verification: {
    // google: 'your-google-verification-code', // Add when you have it
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: "/",
  },
  category: "technology",
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
