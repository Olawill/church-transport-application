import { defaultStatements } from "better-auth/plugins/admin/access";
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// MAIN ROLES
const OWNER = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

const ADMIN = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

const TRANSPORTATION_TEAM = ac.newRole({
  user: ["get", "update"],
  session: ["list"],
});

const USER = ac.newRole({
  user: ["get", "update"],
  session: ["list"],
});

// PLATFORM ROLES
const PLATFORM_ADMIN = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

const PLATFORM_SUPERUSER = ac.newRole({
  user: ["create", "list", "set-role", "ban", "get", "update"],
  session: ["list", "revoke"],
});

const PLATFORM_USER = ac.newRole({
  user: ["list", "get", "update"],
  session: ["list"],
});

export const CUSTOM_ROLES = {
  PLATFORM_ADMIN,
  PLATFORM_SUPERUSER,
  PLATFORM_USER,
  OWNER,
  ADMIN,
  TRANSPORTATION_TEAM,
  USER,
};
