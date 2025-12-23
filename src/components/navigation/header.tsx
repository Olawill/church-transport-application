"use client";

import { cn } from "@/lib/utils";
import {
  BellIcon,
  CarIcon,
  GavelIcon,
  KeyIcon,
  LogOut,
  MenuIcon,
  SidebarCloseIcon,
  UserIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { UserRole } from "@/generated/prisma/enums";
import { ExtendedSession } from "@/lib/auth";
import { signOut, useSession } from "@/lib/auth-client";

import { ActsOnWheelsLogo } from "@/components/logo";
import { ModeToggle } from "@/components/theming/mode-toggle";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navigationItems } from "./navigation-items";
import { CustomLink as Link } from "../custom-link";
import { useNavigationBlocker } from "../contexts/navigation-blocker";
import { Route } from "next";

export const Header = ({
  initialSession,
}: {
  initialSession: ExtendedSession;
}) => {
  const { data: clientSession, isPending } = useSession();
  const { toggleSidebar, open } = useSidebar();
  const { isBlocked, setIsBlocked, confirmExit } = useNavigationBlocker();

  const session = (clientSession as ExtendedSession) || initialSession;
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        },
      },
    });
  };

  // To alert user when there is unsaved changes in a form
  const handleUnsavedChanges = async (href: string) => {
    if (isBlocked) {
      const result = await confirmExit();

      if (result.action !== "confirm" && result.action !== "primary") {
        return; // Stay on page
      }
      setIsBlocked(false);
    }
    router.push(href as Route);
  };

  if (isPending && !session) {
    return (
      <header className="bg-background shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CarIcon className="size-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                Church Transport
              </span>
            </div>
            <div className="animate-pulse bg-gray-300 h-8 w-32 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!session?.user) return null;

  const userNavigationItems = navigationItems.filter((item) =>
    item.roles.includes(session.user.role)
  );

  return (
    <header className="bg-secondary shadow-sm border-b sticky top-0 z-50 w-full">
      <div className="flex h-16 w-full items-center gap-2 px-4 max-w-7xl mx-auto sm:px-6 lg:px-8">
        {/* Logo and brand */}
        <ActsOnWheelsLogo />

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex space-x-8 ml-8">
          {userNavigationItems.map((item) => (
            <Link
              key={item.name}
              href={{ pathname: item.href }}
              prefetch
              className={cn(
                "flex items-center space-x-1 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white font-semibold transition-colors hover:text-blue-500 hover:dark:text-blue-700",
                pathname === item.href && "text-blue-500 dark:text-blue-700"
              )}
            >
              <div className="relative flex items-center space-x-1">
                {pathname === item.href && (
                  <div className="absolute h-1 w-full bg-blue-500 dark:bg-blue-700 rounded-sm -bottom-2 left-0" />
                )}
                <item.icon className="size-4" />
                <span>{item.name.toUpperCase()}</span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Right side items */}
        <div className="flex items-center ml-auto">
          {/* Theme toggle */}
          <ModeToggle />

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative hover:bg-transparent hover:dark:bg-transparent hover:-translate-y-0.5"
          >
            <BellIcon className="size-6 text-gray-600 dark:text-gray-200" />
          </Button>

          {/* Mobile menu button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="size-8 lg:hidden"
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
              >
                {open ? (
                  <SidebarCloseIcon className="size-6" />
                ) : (
                  <MenuIcon className="size-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="bg-secondary dark:bg-background text-gray-900 dark:text-white border border-primary"
              arrowClassName="bg-primary fill-primary"
            >
              {open ? "Close menu" : "Open menu"}
            </TooltipContent>
          </Tooltip>

          {/* Desktop User menu */}
          <div className="hidden lg:flex items-center space-x-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 hover:bg-transparent hover:dark:bg-transparent focus-visible:ring-0"
                >
                  <div className="size-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserIcon className="size-4 text-gray-600" />
                  </div>
                  <div className="text-sm text-left max-w-[80px]">
                    <p className="text-gray-900 dark:text-white font-medium max-2xl:truncate">
                      {session.user.name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-100 text-xs font-semibold italic capitalize">
                      {session.user.role?.toLowerCase().replace("_", " ")}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className={cn(
                    "cursor-pointer font-semibold",
                    pathname === "/profile" && "bg-accent"
                  )}
                  // onClick={() => router.push("/profile")}
                  onClick={() => handleUnsavedChanges("/profile")}
                >
                  <UserIcon className="size-4" />
                  PROFILE
                </DropdownMenuItem>
                {(session.user.role === UserRole.ADMIN ||
                  session.user.role === UserRole.OWNER) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className={cn(
                        "cursor-pointer font-semibold",
                        pathname === "/admin/appeal-decision" && "bg-accent"
                      )}
                      onClick={() =>
                        handleUnsavedChanges("/admin/appeal-decision")
                      }
                    >
                      <GavelIcon className="size-4" />
                      APPEAL DECISION
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={cn(
                        "cursor-pointer font-semibold",
                        pathname === "/credentials" && "bg-accent"
                      )}
                      onClick={() => handleUnsavedChanges("/credentials")}
                    >
                      <KeyIcon className="size-4" />
                      CREDENTIALS
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer font-semibold"
                >
                  <LogOut className="size-4" />
                  LOGOUT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
