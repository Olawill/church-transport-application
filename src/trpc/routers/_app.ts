import { createTRPCRouter } from "../init";

import { adminAnalyticsRouter } from "@/features/admin/server/analytics/procedures";
import { placesRouter } from "@/features/places/server/procedures";
import { adminStatRouter } from "@/features/admin/server/dashboard/stats/procedures";
import { servicesRouter } from "@/features/admin/server/services/procedures";
import { adminUsersRouter } from "@/features/admin/server/users/procedures";
import { adminUserRouter } from "@/features/admin/server/users/user/procedures";
import { adminUserRequestRouter } from "@/features/admin/server/users/request/procedures";
import { sendMailRouter } from "@/features/email/server/procedures";
import { userRequestRouter } from "@/features/requests/server/procedures";
import { driverRequestsRouter } from "@/features/requests/server/driver/procedures";
import { requestsRouter } from "@/features/requests/server/assignOrCancel/procedures";
import { userRouter } from "@/features/user/server/procedures";
import { userProfileRouter } from "@/features/user/server/profile/procedures";
import { userAddressesRouter } from "@/features/user/server/addresses/procedures";
import { userAddressRouter } from "@/features/user/server/addresses/address/procedures";
import { usersRouter } from "@/features/users/server/procedures";
import { authRouter } from "@/features/auth/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  places: placesRouter,
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
});

// export type definition of API
export type AppRouter = typeof appRouter;
