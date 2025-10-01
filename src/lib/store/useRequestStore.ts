import { create } from "zustand";

import { RequestStatus } from "@/generated/prisma";
import { PickupRequest, RequestType } from "@/lib/types";

export type Status = RequestStatus | "ALL";
export type Type = RequestType | "ALL";

interface RequestStoreState {
  requests: PickupRequest[];
  loading: boolean;
  statusFilter: Status;
  typeFilter: Type;
  requestDateFilter: Date | undefined;

  fetchRequests: (
    params?: Record<string, string | number | boolean>
  ) => Promise<void>;
  setStatusFilter: (status: Status) => void;
  setTypeFilter: (type: Type) => void;
  setRequestDateFilter: (date: Date | undefined) => void;
  clearFilters: () => void;
}

export const useRequestStore = create<RequestStoreState>((set, get) => ({
  requests: [],
  loading: false,
  statusFilter: "ALL" as Status,
  typeFilter: "ALL" as Type,
  requestDateFilter: undefined,

  setStatusFilter: (status) => {
    set({ statusFilter: status });
    // get().fetchRequests(); // automatically refetch requests
  },

  setTypeFilter: (type) => {
    set({ typeFilter: type });
    // get().fetchRequests();
  },

  setRequestDateFilter: (date) => {
    set({ requestDateFilter: date });
    // get().fetchRequests();
  },

  clearFilters: () => {
    set({
      statusFilter: "ALL",
      typeFilter: "ALL",
      requestDateFilter: undefined,
    });
    // get().fetchRequests();
  },

  fetchRequests: async (params = {}) => {
    set({ loading: true });

    try {
      const { statusFilter, typeFilter, requestDateFilter } = get();

      const searchParams = new URLSearchParams();

      // Automatically apply all passed query params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          if (value === "ALL" || (key === "requestDate" && value == null))
            return;
          searchParams.set(key, String(value));
        }
      });

      // If status is not passed but exists in the store, apply it
      if (!params.status && statusFilter !== "ALL") {
        searchParams.set("status", statusFilter);
      }

      // If type is not passed but exists in the store, apply it
      if (!params.type && typeFilter !== "ALL") {
        searchParams.set("type", String(typeFilter));
      }

      // If requestDate is not passed but exists in the store, apply it
      if (!params.requestDate && requestDateFilter) {
        searchParams.set(
          "requestDate",
          requestDateFilter.toISOString().split("T")[0]
        );
      }

      const res = await fetch(
        `/api/pickup-requests?${searchParams.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch requests");

      const data = await res.json();
      set({ requests: data });
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
