"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { href: { pathname: "/", hash: "features" }, label: "Features" },
  { href: { pathname: "/", hash: "pricing" }, label: "Pricing" },
  { href: { pathname: "/", hash: "testimonials" }, label: "Testimonials" },
  { href: "/platform/login", label: "Platform Login", noUnderline: true }, // Optional: skip underline
];

export const LandingHeader = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedNavLink, setSelectedNavLink] = useState<string | null>(null);

  return (
    <nav className="border-b backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              setSelectedNavLink(null);
              router.push("/");
            }}
          >
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              ChurchTranspo
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-[16px]">
            {navLinks.map(({ href, label, noUnderline }) => (
              <Link
                key={typeof href === "string" ? href : href.hash}
                href={typeof href === "string" ? { pathname: href } : href}
                className={cn(
                  "relative text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white/80 transition-colors",
                  typeof href === "string"
                    ? href
                    : `#${href.hash}` === selectedNavLink && "font-bold"
                )}
                onClick={() =>
                  setSelectedNavLink(
                    typeof href === "string" ? href : `#${href.hash}`
                  )
                }
              >
                {label}
                {!noUnderline &&
                  pathname === "/" &&
                  selectedNavLink ===
                    (typeof href === "string" ? href : `#${href.hash}`) && (
                    <span className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-md" />
                  )}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/platform/login">
              <Button
                variant="outline"
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:text-white font-bold group"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:animate-pulse" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
