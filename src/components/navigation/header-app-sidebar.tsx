"use client";

import { GavelIcon, KeyIcon, LogOut, UserIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { UserRole } from "@/generated/prisma/enums";
import { ExtendedSession } from "@/lib/auth";
import { signOut, useSession } from "@/lib/auth-client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Route } from "next";
import { ActsOnWheelsLogo } from "../logo";
import { navigationItems } from "./navigation-items";

export const NavAppSidebar = ({
  initialSession,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  initialSession: ExtendedSession;
}) => {
  const { data: clientSession } = useSession();
  const { toggleSidebar, isMobile } = useSidebar();
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

  if (!session?.user) return null;

  const userNavigationItems = navigationItems.filter((item) =>
    item.roles.includes(session.user.role)
  );

  return (
    <Sidebar
      collapsible="offcanvas"
      className="!top-16 !h-[calc(100svh-4rem)] lg:hidden"
      {...props}
    >
      {isMobile && (
        <SidebarHeader className="border-b">
          <ActsOnWheelsLogo />
        </SidebarHeader>
      )}

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {userNavigationItems.map((item) => (
                <SidebarMenuItem key={item.name} onClick={toggleSidebar}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href as Route}>
                      <item.icon className="size-5" />
                      <span className="font-semibold">
                        {item.name.toUpperCase()}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        {/* Profile and Admin Links */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem onClick={toggleSidebar}>
                <SidebarMenuButton asChild isActive={pathname === "/profile"}>
                  <Link href="/profile">
                    <UserIcon className="size-5" />
                    <span className="font-semibold">PROFILE</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {(session.user.role === UserRole.ADMIN ||
                session.user.role === UserRole.OWNER) && (
                <>
                  <SidebarMenuItem onClick={toggleSidebar}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/admin/appeal-decision"}
                    >
                      <Link href="/admin/appeal-decision">
                        <GavelIcon className="size-5" />
                        <span className="font-semibold">APPEAL DECISION</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem onClick={toggleSidebar}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/credentials"}
                    >
                      <Link href="/credentials">
                        <KeyIcon className="size-5" />
                        <span className="font-semibold">CREDENTIALS</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gray-300">
                      <UserIcon className="size-4 text-gray-600" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {session.user.name}
                    </span>
                    <span className="truncate text-xs font-semibold italic capitalize">
                      {session.user.role?.toLowerCase().replace("_", " ")}
                    </span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="size-4" />
                  <span className="font-semibold">LOGOUT</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
