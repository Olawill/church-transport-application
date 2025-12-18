import { useQueryStates } from "nuqs";
import { usersParams } from "../params";

export const useUsersParams = () => {
  return useQueryStates(usersParams);
};
