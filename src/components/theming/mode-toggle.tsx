"use client";

import { cn } from "@/lib/utils";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { PointerEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModeToggle() {
  const { setTheme, theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const [spin, setSpin] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = theme === "system" ? systemTheme : theme;

  // Determine next theme for tooltip
  const nextTheme =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  // Cycle theme and trigger spin animation
  const cycleTheme = () => {
    setSpin(true);
    setTimeout(() => setSpin(false), 300);

    if (theme === "light") {
      setTheme("dark");
      return;
    }
    if (theme === "dark") {
      setTheme("system");
      return;
    }
    setTheme("light");
  };

  // Long press logic
  const longPressTimeout = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault(); // Prevent dropdown from opening
    longPressTimeout.current = setTimeout(() => {
      setIsLongPress(true);
      setDropdownOpen(true);
    }, 500);
  };

  const handlePointerUp = (e: PointerEvent) => {
    e.preventDefault(); // Prevent dropdown from opening
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }

    if (!isLongPress) {
      cycleTheme();
    }
    setIsLongPress(false);
  };

  const handlePointerLeave = (e: PointerEvent) => {
    e.preventDefault(); // Prevent dropdown from opening
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
    setIsLongPress(false);
  };

  // Function to select theme from dropdown
  const selectTheme = (themeChoice: string) => {
    setTheme(themeChoice);
    setSpin(true);
    setTimeout(() => setSpin(false), 300);
  };

  // Prevent hydration issues
  if (!mounted) {
    return (
      <Button variant="outline" size="icon" className="relative">
        <SunIcon className="size-[1.2rem] opacity-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
      <Tooltip>
        <DropdownMenuTrigger asChild>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn("relative cursor")}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
            >
              <SunIcon
                className={cn(
                  "absolute size-[1.2rem] transition-all duration-300 ease-in-out text-shadow-yellow-300 opacity-0 scale-75 -rotate-45",
                  spin && "animate-spin-slow",
                  activeTheme === "light" && "opacity-100 scale-100 rotate-0"
                )}
              />
              <MoonIcon
                className={cn(
                  "absolute size-[1.2rem] transition-all duration-300 ease-in-out text-slate-600 dark:text-slate-300 opacity-0 scale-75 rotate-45",
                  spin && "animate-spin-slow",
                  activeTheme === "dark" && "opacity-100 scale-100 rotate-0"
                )}
              />
              <MonitorIcon
                className={cn(
                  "absolute size-[1.2rem] transition-all duration-300 ease-in-out text-neutral-500 dark:text-neutral-300 opacity-0 scale-75 rotate-45",
                  spin && "animate-spin-slow",
                  activeTheme === "system" && "opacity-100 scale-100 rotate-0"
                )}
              />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </TooltipTrigger>
        </DropdownMenuTrigger>

        <TooltipContent side="bottom" className="bg-background text-foreground">
          <div className="flex items-center gap-2">
            {nextTheme === "light" && (
              <SunIcon className="mr-2 size-[1.2rem] text-yellow-300" />
            )}
            {nextTheme === "dark" && (
              <MoonIcon className="mr-2 size-[1.2rem] text-slate-600 dark:text-slate-300" />
            )}
            {nextTheme === "system" && (
              <MonitorIcon className="mr-2 size-[1.2rem] text-neutral-500" />
            )}
            <span>
              Switch to{" "}
              {nextTheme === "light"
                ? "Light"
                : nextTheme === "dark"
                  ? "Dark"
                  : "System"}{" "}
              mode
            </span>
          </div>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => selectTheme("light")}
        >
          <SunIcon className="mr-2 size-[1.2rem] text-yellow-300" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => selectTheme("dark")}
        >
          <MoonIcon className="mr-2 size-[1.2rem] text-slate-600 dark:text-slate-300" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => selectTheme("system")}
        >
          <MonitorIcon className="mr-2 size-[1.2rem] text-neutral-500" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
