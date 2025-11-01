import { PAGINATION } from "@/config/constants";
import { parseAsInteger, parseAsString } from "nuqs/server";

export const requestsParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  status: parseAsString
    .withDefault("ALL")
    .withOptions({ clearOnDefault: true }),
  type: parseAsString.withDefault("ALL").withOptions({ clearOnDefault: true }),
  requestDate: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  serviceDay: parseAsString
    .withDefault("ALL")
    .withOptions({ clearOnDefault: true }),
};

export const requestsTransportParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  status: parseAsString
    .withDefault("ALL")
    .withOptions({ clearOnDefault: true }),
  type: parseAsString.withDefault("ALL").withOptions({ clearOnDefault: true }),
  requestDate: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  serviceDay: parseAsString
    .withDefault("ALL")
    .withOptions({ clearOnDefault: true }),
  maxDistance: parseAsString
    .withDefault("10")
    .withOptions({ clearOnDefault: true }),
};
