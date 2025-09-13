import { create } from "zustand";

import { RequestStatus } from "@/generated/prisma";
import { PickupRequest } from "@/lib/types";

type Status = RequestStatus | "ALL";

interface RequestStoreState {
  requests: PickupRequest[];
  loading: boolean;
  statusFilter: Status;

  fetchRequests: (
    params?: Record<string, string | number | boolean>
  ) => Promise<void>;
  setStatusFilter: (status: Status) => void;
}

export const useRequestStore = create<RequestStoreState>((set, get) => ({
  requests: [],
  loading: false,
  statusFilter: "ALL" as Status,

  setStatusFilter: (status) => {
    set({ statusFilter: status });
    get().fetchRequests(); // automatically refetch requests
  },

  fetchRequests: async (params = {}) => {
    set({ loading: true });

    try {
      const { statusFilter } = get();

      const searchParams = new URLSearchParams();

      // Automatically apply all passed query params
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "status" && value === "ALL") return; // Skip adding status if it's "ALL"
          searchParams.set(key, String(value));
        }
      });

      // If status is not passed but exists in the store, apply it
      if (!params.status && statusFilter !== "ALL") {
        searchParams.set("status", statusFilter);
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
