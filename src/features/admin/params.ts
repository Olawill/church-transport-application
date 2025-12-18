import { PAGINATION } from "@/config/constants";
import { parseAsBoolean, parseAsInteger, parseAsString } from "nuqs/server";

export const servicesParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  status: parseAsString
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};

export const serviceFormParams = {
  showForm: parseAsBoolean
    .withDefault(false)
    .withOptions({ clearOnDefault: true }),
};
