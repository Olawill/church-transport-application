"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DriverAssignmentType } from "./column";
import { useTRPC } from "@/trpc/client";

export const DataTableAction = ({
  driverRequest,
}: {
  driverRequest: DriverAssignmentType;
}) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [openEmail, setOpenEmail] = useState(false);
  const [openWhatsApp, setOpenWhatsApp] = useState(false);

  const assignRequest = useMutation(
    trpc.requests.adminAssign.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Request has been assigned to ${data.driver?.name}`);
        queryClient.invalidateQueries(
          trpc.userRequests.getUserRequests.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || "Failed to assign request");
      },
    })
  );

  const handleAssignRequest = async (requestId: string, driverId: string) => {
    await assignRequest.mutateAsync({
      id: requestId,
      driverId,
      status: "ACCEPTED",
    });
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
