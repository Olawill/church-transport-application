import { createLoader } from "nuqs/server";
import { requestsParams, requestsTransportParams } from "../params";

export const requestsParamsLoader = createLoader(requestsParams);

export const requestsTransportParamsLoader = createLoader(
  requestsTransportParams
);
