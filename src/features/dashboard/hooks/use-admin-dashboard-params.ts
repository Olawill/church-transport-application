import { useQueryStates } from "nuqs";
import { adminDashboardParams } from "../params";

export const useAdminDashboardParams = () => {
  return useQueryStates(adminDashboardParams);
};
