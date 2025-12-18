import { createTRPCRouter } from "../init";

import { adminAnalyticsRouter } from "@/features/admin/server/analytics/procedures";
import { adminStatRouter } from "@/features/admin/server/dashboard/stats/procedures";
import { servicesRouter } from "@/features/admin/server/services/procedures";
import { adminUsersRouter } from "@/features/admin/server/users/procedures";
import { adminUserRequestRouter } from "@/features/admin/server/users/request/procedures";
import { adminUserRouter } from "@/features/admin/server/users/user/procedures";
import { appealRouter } from "@/features/appeal/server/procedures";
import { authRouter } from "@/features/auth/server/procedures";
import { sendMailRouter } from "@/features/email/server/procedures";
import { organizationRouter } from "@/features/organization/server/procedures";
import { placesRouter } from "@/features/places/server/procedures";
import { profileRouter } from "@/features/profile/server/procedures";
import { requestsRouter } from "@/features/requests/server/assignOrCancel/procedures";
import { driverRequestsRouter } from "@/features/requests/server/driver/procedures";
import { userRequestRouter } from "@/features/requests/server/procedures";
import { userAddressRouter } from "@/features/user/server/addresses/address/procedures";
import { userAddressesRouter } from "@/features/user/server/addresses/procedures";
import { userRouter } from "@/features/user/server/procedures";
import { userProfileRouter } from "@/features/user/server/profile/procedures";
import { usersRouter } from "@/features/users/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  places: placesRouter,
  profile: profileRouter,
  adminAnalytics: adminAnalyticsRouter,
  adminStats: adminStatRouter,
  services: servicesRouter,
  adminUsers: adminUsersRouter,
  adminUser: adminUserRouter,
  adminRequest: adminUserRequestRouter,
  emails: sendMailRouter,
  userRequests: userRequestRouter,
  driverRequests: driverRequestsRouter,
  requests: requestsRouter,
  user: userRouter,
  userProfile: userProfileRouter,
  userAddresses: userAddressesRouter,
  userAddress: userAddressRouter,
  users: usersRouter,
  organization: organizationRouter,
  appeal: appealRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
