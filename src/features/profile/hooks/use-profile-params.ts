import { useQueryStates } from "nuqs";
import { profileParams } from "../params";

export const useProfileParams = () => {
  return useQueryStates(profileParams);
};
