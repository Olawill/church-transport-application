import {
  Organization,
  OrganizationType,
  Prisma,
  User,
  UserRole,
} from "@/generated/prisma";
import { prisma } from "./db";

// Tenant isolation utilities
export class TenantContext {
  private static instance: TenantContext;
  private organizationId: string | null = null;
  private organization: Organization | null = null;
  private user: User | null = null;

  static getInstance(): TenantContext {
    if (!TenantContext.instance) {
      TenantContext.instance = new TenantContext();
    }
    return TenantContext.instance;
  }

  setContext(
    organizationId: string | null,
    organization: Organization | null,
    user: User | null
  ) {
    this.organizationId = organizationId;
    this.organization = organization;
    this.user = user;
  }

  getOrganizationId(): string | null {
    return this.organizationId;
  }

  getOrganization(): Organization | null {
    return this.organization;
  }

  getUser(): User | null {
    return this.user;
  }

  isPlatformAdmin(): boolean {
    return this.user?.role === UserRole.PLATFORM_ADMIN;
  }

  isPlatformUser(): boolean {
    return this.user?.role === UserRole.PLATFORM_USER;
  }

  reset() {
    this.organizationId = null;
    this.organization = null;
    this.user = null;
  }
}

// Middleware to set tenant context
export const setTenantContext = async (
  userId: string,
  organizationId?: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  let organization = null;
  let resolvedOrgId = null;

  const platformRoles: UserRole[] = [
    UserRole.PLATFORM_ADMIN,
    UserRole.PLATFORM_USER,
  ];

  if (platformRoles.includes(user.role)) {
    // Platform user and admins can access any organization or platform-wide data
    if (organizationId) {
      organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });
      resolvedOrgId = organizationId;
    } else {
      // Regular users are restricted to their organization
      organization = user.organization;
      resolvedOrgId = user.organizationId;
    }

    const tenantContext = TenantContext.getInstance();
    tenantContext.setContext(resolvedOrgId, organization, user);

    return { user, organization, organizationId: resolvedOrgId };
  }
};

// Database query helpers with tenant isolation
export const tenantPrisma = {
  // Users - scoped to organization
  user: {
    findMany: (args: Prisma.UserFindManyArgs = {}) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.user.findMany(args);
    },

    findUnique: (args: Prisma.UserFindUniqueArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.user.findUnique(args);
    },

    create: (args: Prisma.UserCreateArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.data.organizationId = orgId;
      }

      return prisma.user.create(args);
    },

    update: (args: Prisma.UserUpdateArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.user.update(args);
    },
  },

  // Pickup Requests - scoped to organization
  pickupRequest: {
    findMany: (args: Prisma.PickupRequestFindManyArgs = {}) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.pickupRequest.findMany(args);
    },

    create: (args: Prisma.PickupRequestCreateArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (orgId) {
        args.data.organizationId = orgId;
      }

      return prisma.pickupRequest.create(args);
    },

    update: (args: Prisma.PickupRequestUpdateArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.pickupRequest.update(args);
    },
  },

  // Service Days - scoped to organization
  serviceDay: {
    findMany: (args: Prisma.ServiceDayFindManyArgs = {}) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.serviceDay.findMany(args);
    },

    create: (args: Prisma.ServiceDayCreateArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (orgId) {
        args.data.organizationId = orgId;
      }

      return prisma.serviceDay.create(args);
    },
  },

  // Routes - scoped to organization
  route: {
    findMany: (args: Prisma.RouteFindManyArgs = {}) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (!tenantContext.isPlatformAdmin() && orgId) {
        args.where = { ...args.where, organizationId: orgId };
      }

      return prisma.route.findMany(args);
    },

    create: (args: Prisma.RouteCreateArgs) => {
      const tenantContext = TenantContext.getInstance();
      const orgId = tenantContext.getOrganizationId();

      if (orgId) {
        args.data.organizationId = orgId;
      }

      return prisma.route.create(args);
    },
  },
};

// Organization management utilities
export const getOrganizationBySlug = async (slug: string) => {
  return await prisma.organization.findUnique({
    where: { slug },
    include: {
      owner: true,
      countries: true,
      subscription: true,
    },
  });
};

export const createOrganization = async (data: {
  name: string;
  slug: string;
  type: string;
  contactEmail: string;
  ownerId: string;
  countries: string[]; // Array of country codes
}) => {
  return await prisma.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      type: data.type as OrganizationType,
      contactEmail: data.contactEmail,
      ownerId: data.ownerId,
      countries: {
        create: data.countries.map((countryCode) => ({
          countryCode,
          countryName: getCountryName(countryCode),
        })),
      },
      subscription: {
        create: {
          plan: "STARTER",
          status: "TRIAL",
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          basePrice: 29,
          countryMultiplier: data.countries.length,
          totalPrice: 29 * data.countries.length,
        },
      },
    },
    include: {
      countries: true,
      subscription: true,
    },
  });
};

// Country utilities
const countryNames: { [key: string]: string } = {
  CA: "Canada",
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  NZ: "New Zealand",
  IN: "India",
  NG: "Nigeria",
  KE: "Kenya",
  GH: "Ghana",
  ZA: "South Africa",
  PH: "Philippines",
  SG: "Singapore",
  MY: "Malaysia",
  HK: "Hong Kong",
  // Add more as needed
};

export const getCountryName = (countryCode: string): string => {
  return countryNames[countryCode] || countryCode;
};

export const supportedCountries = Object.keys(countryNames).map((code) => ({
  code,
  name: countryNames[code],
}));
