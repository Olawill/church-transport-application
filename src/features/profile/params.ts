import { parseAsString } from "nuqs/server";

export const profileParams = {
  tab: parseAsString
    .withDefault("profile")
    .withOptions({ clearOnDefault: true }),
};
