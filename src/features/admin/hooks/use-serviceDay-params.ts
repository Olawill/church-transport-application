import { useQueryStates } from "nuqs";
import { serviceFormParams, servicesParams } from "../params";

export const useServiceDayParams = () => {
  return useQueryStates(servicesParams);
};

export const useServiceFormParams = () => {
  return useQueryStates(serviceFormParams);
};
