import { PAGINATION } from "@/config/constants";
import { parseAsInteger, parseAsString } from "nuqs/server";

export const adminDashboardParams = {
  tab: parseAsString
    .withDefault("overview")
    .withOptions({ clearOnDefault: true }),

  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),

  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),

  user: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
};
