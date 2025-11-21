"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { CarBack } from "@/components/icons/car";
import gsap from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { Route } from "next";
import { useScrollSpy } from "../../../../hooks/useScrollSpy";

gsap.registerPlugin(ScrollToPlugin);

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

  const underlineRef = useRef<HTMLSpanElement>(null);

  const sectionIds = ["features", "pricing", "testimonials"];
  const activeSection = useScrollSpy(sectionIds, 80);

  const scrollToSection = (hash: string) => {
    const el = document.getElementById(hash);
    if (el) {
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: el, offsetY: 80 },
        ease: "power2.out",
      });
    }
  };

  useEffect(() => {
    if (underlineRef.current && activeSection) {
      const target = document.querySelector(
        `button[data-section="${activeSection}"]`
      );
      if (target) {
        const rect = (target as HTMLElement).getBoundingClientRect();
        gsap.to(underlineRef.current, {
          x: rect.left + window.scrollX,
          width: rect.width,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    }
  }, [activeSection]);

  const handleLogoClick = () => {
    if (pathname === "/") {
      // Smooth scroll to top (hero section)
      gsap.to(window, {
        duration: 1,
        scrollTo: { y: 0 }, // scroll to top
        ease: "power2.out",
      });
    } else {
      // Navigate to home first
      router.push("/");
      setTimeout(() => {
        gsap.to(window, {
          duration: 1,
          scrollTo: { y: 0 },
          ease: "power2.out",
        });
      }, 100);
    }
  };

  const handleClick = (href: (typeof navLinks)[number]["href"]) => {
    if (typeof href === "string") {
      // router.push({pathname: href})
      router.push(href as Route);
      setSelectedNavLink(href);
    } else if (pathname === href.pathname) {
      scrollToSection(href.hash);
      setSelectedNavLink(`#${href.hash}`);
    } else {
      // Navigate to home first, then scroll after a short delay
      router.push(`${href.pathname}#${href.hash}` as Route);
      setTimeout(() => scrollToSection(href.hash), 100);
    }
  };

  return (
    <nav className="border-b backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={handleLogoClick}
          >
            {/* <div className="size-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg" /> */}
            <div className="size-8 relative">
              <CarBack
                size={32}
                patrolDistance={8} // pixels left/right
                duration={2} // seconds for one full patrol
                className="absolute top-0 left-0"
              />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">
                Acts
                <span className="text-blue-600">On</span>
                Wheels
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-100 font-medium tracking-widest uppercase">
                Church Transportation
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-[16px]">
            {navLinks.map(({ href, label, noUnderline }) => {
              const isActive =
                (typeof href === "string" && activeSection === href) ||
                (typeof href !== "string" && activeSection === `#${href.hash}`);

              return (
                <Button
                  key={typeof href === "string" ? href : href.hash}
                  variant="link"
                  // href={typeof href === "string" ? { pathname: href } : href}
                  className={cn(
                    "relative text-gray-600 hover:text-gray-900 dark:text-white dark:hover:text-white/80 transition-colors hover:no-underline",
                    typeof href === "string"
                      ? href
                      : `#${href.hash}` === selectedNavLink && "font-bold"
                  )}
                  onClick={() => handleClick(href)}
                >
                  {label}
                  {!noUnderline && isActive && (
                    <span
                      ref={underlineRef}
                      className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-md"
                    />
                  )}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/platform/login" className="hidden md:inline-block">
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
