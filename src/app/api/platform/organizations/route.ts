import { auth } from "@/auth";
import { BillingPlan, Prisma, UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { createOrganization, supportedCountries } from "@/lib/tenant";
import { NextRequest, NextResponse } from "next/server";

// Get all organizations (Platform Admin only)
export const GET = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.PLATFORM_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // active, suspended
    const plan = searchParams.get("plan");

    const skip = (page - 1) * limit;

    const where: Prisma.OrganizationWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "active") {
      where.isActive = true;
      where.isSuspended = false;
    } else if (status === "suspended") {
      where.isSuspended = true;
    }

    if (plan) {
      where.subscription = {
        plan: plan as BillingPlan,
      };
    }

    const [organizations, totalCount] = await Promise.all([
      prisma.organization.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          subscription: true,
          countries: true,
          _count: {
            select: {
              users: true,
              pickupRequests: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip,
      }),
      prisma.organization.count({ where }),
    ]);

    const formattedOrganizations = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      type: org.type,
      contactEmail: org.contactEmail,
      isActive: org.isActive,
      isSuspended: org.isSuspended,
      suspensionReason: org.suspensionReason,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      owner: org.owner,
      subscription: org.subscription,
      countries: org.countries.map((c) => ({
        code: c.countryCode,
        name: c.countryName,
      })),
      stats: {
        userCount: org._count.users,
        requestCount: org._count.pickupRequests,
      },
    }));

    return NextResponse.json({
      success: true,
      organizations: formattedOrganizations,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Platform get organizations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

// Create new organization (Platform Admin only)
export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.PLATFORM_ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      name,
      slug,
      type,
      contactEmail,
      // contactPhone,
      // plan = 'STARTER',
      countries,
      ownerEmail,
      ownerFirstName,
      ownerLastName,
    } = await request.json();

    if (!name || !slug || !type || !contactEmail || !countries || !ownerEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate countries
    const validCountries = countries.filter((code: string) =>
      supportedCountries.some((c) => c.code === code)
    );

    if (validCountries.length === 0) {
      return NextResponse.json(
        { error: "At least one valid country is required" },
        { status: 400 }
      );
    }

    // Check if slug is available
    const existingOrg = await prisma.organization.findUnique({
      where: { slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization slug already exists" },
        { status: 409 }
      );
    }

    // Create or find owner user
    let owner = await prisma.user.findUnique({
      where: { email: ownerEmail },
    });

    if (!owner) {
      // Create new owner user
      owner = await prisma.user.create({
        data: {
          email: ownerEmail,
          firstName: ownerFirstName || "Owner",
          lastName: ownerLastName || "User",
          role: UserRole.ADMIN,
          status: "APPROVED",
          isActive: true,
        },
      });
    } else {
      // Update existing user to be org admin
      owner = await prisma.user.update({
        where: { id: owner.id },
        data: {
          role: UserRole.ADMIN,
          status: "APPROVED",
          isActive: true,
        },
      });
    }

    // Create organization
    const organization = await createOrganization({
      name,
      slug,
      type,
      contactEmail,
      ownerId: owner.id,
      countries: validCountries,
    });

    // Update owner to belong to organization
    await prisma.user.update({
      where: { id: owner.id },
      data: {
        organizationId: organization.id,
      },
    });

    return NextResponse.json({
      success: true,
      organization: {
        ...organization,
        owner: {
          id: owner.id,
          firstName: owner.firstName,
          lastName: owner.lastName,
          email: owner.email,
        },
      },
    });
  } catch (error) {
    console.error("Platform create organization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
