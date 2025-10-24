"use client";

import { useState } from "react";

import {
  MailPlusIcon,
  MessageSquareTextIcon,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import {
  DriverEmailDialog,
  DriverWhatsAppDialog,
} from "@/components/driver-notification";
import { DriverAssignmentType } from "@/components/drivers/column";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useRequestStore } from "@/lib/store/useRequestStore";

export const DataTableAction = ({
  driverRequest,
}: {
  driverRequest: DriverAssignmentType;
}) => {
  const [openEmail, setOpenEmail] = useState(false);
  const [openWhatsApp, setOpenWhatsApp] = useState(false);

  const { fetchRequests } = useRequestStore();

  const handleAssignRequest = async (requestId: string, driverId: string) => {
    try {
      const response = await fetch("/api/pickup-requests/assign", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: requestId,
          driverId,
          status: "ACCEPTED",
        }),
      });

      if (response.ok) {
        toast.success("Request assigned successfully");
        await fetchRequests();
      } else {
        toast.error("Failed to assign request");
      }
    } catch (error) {
      console.error("Error assigning request:", error);
      toast.error("An error occurred");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="size-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() =>
              handleAssignRequest(driverRequest.request.id, driverRequest.id)
            }
          >
            <UserPlus className="size-4" />
            Assign Request
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setOpenWhatsApp(!openWhatsApp);
            }}
          >
            <MessageSquareTextIcon className="size-4" />
            Send Message
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              setOpenEmail(!openEmail);
            }}
          >
            <MailPlusIcon className="size-4" />
            Email Driver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* DiverEmail */}
      <DriverEmailDialog
        openEmailDialog={openEmail}
        setOpenEmailDialog={setOpenEmail}
        driverRequest={driverRequest}
      />

      {/* WhatsAppEmail */}
      <DriverWhatsAppDialog
        openWhatsAppDialog={openWhatsApp}
        setOpenWhatsAppDialog={setOpenWhatsApp}
        driverRequest={driverRequest}
      />
    </>
  );
};
