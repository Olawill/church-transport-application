"use client";

import {
  Bell,
  Calendar,
  Car,
  Home,
  LogOut,
  Menu,
  User,
  Users,
  X,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { redirect, usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

export const Header = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    redirect("/login");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  if (status === "loading") {
    return (
      <header className="bg-secondary shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="size-5 text-white" />
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

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      roles: ["ADMIN", "TRANSPORTATION_TEAM", "USER"],
    },
    {
      name: "Requests",
      href: "/requests",
      icon: Calendar,
      roles: ["ADMIN", "TRANSPORTATION_TEAM", "USER"],
    },
    { name: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
    {
      name: "Services",
      href: "/admin/services",
      icon: Calendar,
      roles: ["ADMIN"],
    },
    {
      name: "Transportation",
      href: "/transportation",
      icon: Car,
      roles: ["TRANSPORTATION_TEAM"],
    },
  ];

  const userNavigationItems = navigationItems.filter((item) =>
    item.roles.includes(session.user.role)
  );

  return (
    <header className="bg-secondary shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="size-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                Church Transport
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {userNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={{ pathname: item.href }}
                className={cn(
                  "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href && "text-blue-500"
                )}
              >
                <div className="relative flex items-center space-x-1">
                  {pathname === item.href && (
                    <div className="absolute h-1 w-full bg-blue-500 rounded-sm -bottom-2 left-0" />
                  )}
                  <item.icon className="size-4" />
                  <span>{item.name}</span>
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
              <Bell className="size-6 text-gray-600 dark:text-gray-200" />
            </Button>

            {/* User info */}
            <div className="hidden lg:flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-gray-200 font-medium">
                        {session.user.firstName} {session.user.lastName}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 capitalize">
                        {session.user.role?.toLowerCase().replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="size-4 text-gray-600" />
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-gray-200 font-medium">
                          {session.user.firstName} {session.user.lastName}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 capitalize">
                          {session.user.role?.toLowerCase().replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => router.push("/profile")}
                  >
                    <User className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-gray-600 dark:text-gray-200 hover:text-gray-900 cursor-pointer"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                  {/* <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-600 hover:text-gray-900"
                  >
                  </Button> */}
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
                <X className="size-6" />
              ) : (
                <Menu className="size-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-secondary py-4">
            <nav className="space-y-2">
              {userNavigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={{ pathname: item.href }}
                  className={cn(
                    "flex items-center space-x-2 text-gray-600 dark:text-gray-200 hover:text-gray-900 px-3 py-2 rounded-md text-base font-medium",
                    pathname === item.href && "bg-blue-500"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900 dark:text-gray-200 font-medium">
                      {session.user.firstName} {session.user.lastName}
                    </p>
                    <p className="text-gray-500 dark:text-gray-300 capitalize">
                      {session.user.role?.toLowerCase().replace("_", " ")}
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
                    "w-full justify-start text-gray-600 dark:text-gray-200 hover:text-gray-900 px-3 py-3 text-base",
                    pathname === "/profile" && "bg-blue-500"
                  )}
                >
                  <User className="size-5" />
                  Profile
                </Button>
                <Separator className="my-2" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full justify-start text-gray-600 dark:text-gray-200 hover:text-gray-900 px-3 py-2 text-base"
                >
                  <LogOut className="size-5" />
                  Sign out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
