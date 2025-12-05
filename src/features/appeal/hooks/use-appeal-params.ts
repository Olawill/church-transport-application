import { useQueryStates } from "nuqs";
import { appealParams } from "../params";

export const useAppealParams = () => {
  return useQueryStates(appealParams);
};
