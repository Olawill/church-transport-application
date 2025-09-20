import { UserRole } from "@/generated/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      status: string;
      image?: string;
      needsCompletion?: boolean;
      isOAuthSignup?: boolean;
      organizationId?: string;
      organizationSlug?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: string;
    image?: string;
    needsCompletion?: boolean;
    isOAuthSignup?: boolean;
    organizationId?: string;
    organizationSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    status: string;
    firstName: string;
    lastName: string;
    needsCompletion?: boolean;
    isOAuthSignup?: boolean;
    organizationId?: string;
    organizationSlug?: string;
  }
}
