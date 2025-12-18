import { useQueryStates } from "nuqs";
import { requestsParams, requestsTransportParams } from "../params";

export const useRequestsParams = () => {
  return useQueryStates(requestsParams);
};

export const useRequestsTransportParams = () => {
  return useQueryStates(requestsTransportParams);
};
