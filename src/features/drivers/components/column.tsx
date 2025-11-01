"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Phone } from "lucide-react";
import Link from "next/link";

import { User } from "@/lib/types";
import { formatAddress } from "@/lib/utils";

import { GetUserRequestsType } from "@/features/requests/server/types";
import { DataTableAction } from "./data-table-action";
import { DataTableColumnHeader } from "./data-table-column-header";

export type DriverAssignmentType = User & {
  name: string;
  requestDistance: number | null;
  request: GetUserRequestsType;
};

export const columns: ColumnDef<DriverAssignmentType>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      const linkedEmail = "mailto:" + user.email;
      return (
        <div className="flex flex-col">
          <Link
            href={{ pathname: linkedEmail }}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-blue-400 hover:underline text-balance"
          >
            {user.name}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "phoneNumber",
    header: () => <div className="text-left">Phone</div>,
    cell: ({ row }) => {
      const phoneNumber = row.original.phoneNumber;
      return phoneNumber ? (
        <Link
          href={`tel:${phoneNumber.replace(/\D/g, "")}`}
          className="hover:text-blue-400 hover:underline flex items-center"
        >
          <Phone className="size-4 mr-2" />
          {phoneNumber}
        </Link>
      ) : (
        <span className="text-muted-foreground">N/A</span>
      );
    },
  },
  {
    header: "Address (Default)",
    cell: ({ row }) => {
      const address = row?.original.addresses?.find((addr) => addr.isDefault);

      if (!address) {
        return <span className="text-muted-foreground">N/A</span>;
      }

      const fullAddress = formatAddress(address); // e.g., "123 Main St, City, Province, Country"
      const encodedAddress = encodeURIComponent(fullAddress);
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

      return (
        <div className="flex flex-col">
          <Link
            href={{ pathname: mapLink }}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-blue-400 hover:underline text-balance"
          >
            {fullAddress}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "maxDistance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Preferred Distance" />
    ),
    // header: () => <div className="text-right">Preferred Distance</div>,
    cell: ({ row }) => {
      const distance = parseFloat(row.getValue("maxDistance") || "0");
      const formatted =
        new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(distance) + " km";

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "requestDistance",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Request Distance" />
    ),
    // header: () => <div className="text-right">Request Distance</div>,
    cell: ({ row }) => {
      const distance = parseFloat(row.getValue("requestDistance") || "0");
      const formatted =
        new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }).format(distance) + " km";

      return <div className="text-left font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const driverRequest = row.original;

      return <DataTableAction driverRequest={driverRequest} />;
    },
  },
];
