"use client";

import { cn } from "@/lib/utils";
import {
  BellIcon,
  CalendarIcon,
  CarIcon,
  HomeIcon,
  KeyIcon,
  LogOut,
  MenuIcon,
  UserIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { UserRole } from "@/generated/prisma";
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
import { Separator } from "@/components/ui/separator";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    roles: ["ADMIN", "TRANSPORTATION_TEAM", "USER"],
  },
  {
    name: "Requests",
    href: "/requests",
    icon: CalendarIcon,
    roles: ["ADMIN", "TRANSPORTATION_TEAM", "USER"],
  },
  { name: "Users", href: "/admin/users", icon: UsersIcon, roles: ["ADMIN"] },
  {
    name: "Services",
    href: "/admin/services",
    icon: CalendarIcon,
    roles: ["ADMIN"],
  },
  {
    name: "Transportation",
    href: "/transportation",
    icon: CarIcon,
    roles: ["TRANSPORTATION_TEAM"],
  },
];

export const Header = ({
  initialSession,
}: {
  initialSession: ExtendedSession;
}) => {
  const { data: clientSession, isPending } = useSession();

  const session = (clientSession as ExtendedSession) || initialSession;
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        },
      },
    });
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (isPending && !session) {
    return (
      <header className="bg-secondary shadow-sm border-b sticky top-0 z-50">
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
    <header className="bg-secondary shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <ActsOnWheelsLogo />

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {userNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={{ pathname: item.href }}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-md text-sm text-gray-900 dark:text-white font-semibold transition-colors",
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

          {/* User menu */}
          <div className="flex items-center">
            {/* Theme toggle */}
            <ModeToggle />

            {/* Notifications - placeholder for future implementation */}
            <Button variant="ghost" size="sm" className="relative">
              <BellIcon className="size-6 text-gray-600 dark:text-gray-200" />
            </Button>

            {/* User info */}
            <div className="hidden lg:flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <div className="size-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="size-4 text-gray-600" />
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {session.user.name}
                      </p>
                      <p className="text-gray-700 dark:text-gray-100 text-xs font-semibold italic capitalize">
                        {session.user.role?.toUpperCase().replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="size-4 text-gray-600" />
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-white font-medium">
                          {session.user.name}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 text-xs italic font-semibold capitalize">
                          {session.user.role?.toUpperCase().replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer  font-semibold"
                    onClick={() => router.push("/profile")}
                  >
                    <UserIcon className="size-4" />
                    PROFILE
                  </DropdownMenuItem>
                  {(session.user.role === UserRole.ADMIN ||
                    session.user.role === UserRole.OWNER) && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer font-semibold"
                        onClick={() => router.push("/credentials")}
                      >
                        <KeyIcon className="size-4" />
                        CREDENTIALS
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-gray-900 dark:text-white hover:text-gray-900 cursor-pointer  font-semibold"
                  >
                    <LogOut className="size-4" />
                    LOGOUT
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <XIcon className="size-6" />
              ) : (
                <MenuIcon className="size-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 lg:hidden z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div
              className={cn(
                "lg:hidden absolute top-16 left-0 right-0 border-t bg-secondary py-4 shadow-lg z-50",
                "transition-all duration-300 ease-in-out",
                mobileMenuOpen
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-4 pointer-events-none"
              )}
            >
              <nav className="space-y-2">
                {userNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={{ pathname: item.href }}
                    className={cn(
                      "flex items-center space-x-2 hover:bg-accent px-3 py-2 rounded-md text-base font-semibold hover:text-gray-900 dark:hover:text-white",
                      pathname === item.href &&
                        "bg-blue-500 text-white dark:text-gray-900"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="size-5" />
                    <span>{item.name.toUpperCase()}</span>
                  </Link>
                ))}
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center space-x-3 px-3 py-2">
                    <div className="size-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <UserIcon className="size-4 text-gray-600" />
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-white font-medium">
                        {session.user.name}
                      </p>
                      <p className="text-gray-700 dark:text-gray-100 text-xs font-semibold italic capitalize">
                        {session.user.role?.toUpperCase().replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      router.push("/profile");
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      "w-full justify-start px-3 py-3 text-base font-semibold",
                      pathname === "/profile" && "bg-blue-500"
                    )}
                  >
                    <UserIcon className="size-5" />
                    PROFILE
                  </Button>
                  {(session.user.role === UserRole.ADMIN ||
                    session.user.role === UserRole.OWNER) && (
                    <>
                      <Separator className="my-2" />
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start px-3 py-3 text-base font-semibold",
                          pathname === "/profile" && "bg-blue-500"
                        )}
                        onClick={() => router.push("/credentials")}
                      >
                        <KeyIcon className="size-4" />
                        CREDENTIALS
                      </Button>
                    </>
                  )}
                  <Separator className="my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-gray-600 dark:text-white hover:text-gray-900 dark:hover:text-white px-3 py-2 text-base font-semibold"
                  >
                    <LogOut className="size-5" />
                    LOGOUT
                  </Button>
                </div>
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
