"use client";

import { KeyRoundIcon, MenuIcon, RefreshCcwDotIcon } from "lucide-react";
import { ImQrcode } from "react-icons/im";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useProfileParams } from "../hooks/use-profile-params";
import { MdOutlineCameraswitch } from "react-icons/md";

export const actionItems = [
  {
    description: "This will open the form to change your password",
    label: "Change Password",
    Icon: KeyRoundIcon,
  },
  {
    description: "This will allow you to regenerate your backup codes.",
    label: "Generate Backup Codes",
    Icon: RefreshCcwDotIcon,
  },
  {
    description:
      "This will allow you to get new URI for your authenticator app.",
    label: "Get TOTP URI",
    Icon: ImQrcode,
  },
  {
    description: "Change your Two-Factor Authentication method to TOTP or OTP.",
    label: "Switch 2FA Method",
    Icon: MdOutlineCameraswitch,
  },
] as const;

export const SecuritySidebar = () => {
  const [params, setParams] = useProfileParams();
  const { securityAction } = params;
  const { isMobile, setOpenMobile } = useSidebar(); // Get mobile state

  const handleItemClick = (label: string) => {
    setParams({ ...params, securityAction: label });

    // Close the sheet on mobile after selection
    if (isMobile) {
      setTimeout(() => {
        setOpenMobile(false);
      }, 150);
    }
  };

  return (
    <Sidebar collapsible="icon" className="w-64" useRelativePositioning={true}>
      <SidebarHeader className="bg-card border-b -mt-1">
        <SidebarMenuItem className="flex items-center gap-2">
          <SidebarMenuButton className="hover:bg-card">
            <MenuIcon className="size-4" />
            <span className="font-bold">Security Actions</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarHeader>
      <SidebarContent className="bg-card h-full">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionItems.map(({ label, description, Icon }) => (
                <SidebarMenuItem
                  key={label}
                  onClick={() => handleItemClick(label)}
                  className="cursor-pointer"
                >
                  <SidebarMenuButton
                    asChild
                    isActive={securityAction === label}
                    tooltip={label}
                  >
                    <span>
                      <Icon className="size-4" />
                      <span>{label}</span>
                      <span className="sr-only">{description}</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
