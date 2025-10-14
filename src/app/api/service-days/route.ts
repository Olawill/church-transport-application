import { auth } from "@/auth";
import {
  Frequency,
  Ordinal,
  ServiceCategory,
  UserRole,
} from "@/generated/prisma";
import { prisma } from "@/lib/db";
import {
  frequentMultiDaySchema,
  onetimeMultiDaySchema,
  onetimeOneDaySchema,
  recurringSchema,
} from "@/types/serviceDaySchema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let where = {};
    if (status) {
      const isActive = status === "active";
      where = { isActive };
    }

    const serviceDays = await prisma.serviceDay.findMany({
      // where: { isActive: true },
      where,
      include: { weekdays: true },
      orderBy: [{ time: "asc" }],
    });

    return NextResponse.json(serviceDays);
  } catch (error) {
    console.error("Error fetching service days:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Select the appropriate schema based on serviceCategory
    let validationSchema;
    switch (body.serviceCategory) {
      case ServiceCategory.RECURRING:
        validationSchema = recurringSchema;
        break;
      case ServiceCategory.ONETIME_ONEDAY:
        validationSchema = onetimeOneDaySchema;
        break;
      case ServiceCategory.ONETIME_MULTIDAY:
        validationSchema = onetimeMultiDaySchema;
        break;
      case ServiceCategory.FREQUENT_MULTIDAY:
        validationSchema = frequentMultiDaySchema;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid service category" },
          { status: 400 }
        );
    }

    // Validate the request body
    const validationResult = validationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: z.treeifyError(validationResult.error as z.ZodError),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    if (!validatedData) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Extract dayOfWeek from the validated data
    const dayOfWeek = Array.isArray(validatedData.dayOfWeek)
      ? validatedData.dayOfWeek.map((d) => parseInt(d, 10))
      : [parseInt(validatedData.dayOfWeek, 10)];

    // Create service day with weekdays
    const serviceDay = await prisma.serviceDay.create({
      data: {
        name: validatedData.name,
        time: validatedData.time,
        serviceType: validatedData.serviceType,
        serviceCategory: validatedData.serviceCategory,
        isActive: validatedData.isActive ?? true,
        startDate: validatedData.startDate?.toISOString() || null,
        endDate:
          "endDate" in validatedData
            ? validatedData.endDate?.toISOString() || null
            : null,
        frequency:
          "frequency" in validatedData
            ? validatedData.frequency
            : Frequency.NONE,
        ordinal:
          "ordinal" in validatedData ? validatedData.ordinal : Ordinal.NEXT,
        cycle: "cycle" in validatedData ? validatedData.cycle : null,
        weekdays: {
          create: dayOfWeek.map((day: number) => ({
            dayOfWeek: day,
          })),
        },
      },
      include: {
        weekdays: true,
      },
    });

    return NextResponse.json(serviceDay, { status: 201 });
  } catch (error) {
    console.error("Error creating service day:", error);
    // Handle Prisma errors
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to create service day", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create service day" },
      { status: 500 }
    );
  }
};

export const PUT = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Service day ID is required" },
        { status: 400 }
      );
    }

    // Select the appropriate schema based on serviceCategory
    let validationSchema;
    switch (body.serviceCategory) {
      case ServiceCategory.RECURRING:
        validationSchema = recurringSchema;
        break;
      case ServiceCategory.ONETIME_ONEDAY:
        validationSchema = onetimeOneDaySchema;
        break;
      case ServiceCategory.ONETIME_MULTIDAY:
        validationSchema = onetimeMultiDaySchema;
        break;
      case ServiceCategory.FREQUENT_MULTIDAY:
        validationSchema = frequentMultiDaySchema;
        break;
      default:
        return NextResponse.json(
          { error: "Invalid service category" },
          { status: 400 }
        );
    }

    // Validate the request body
    const validationResult = validationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: z.treeifyError(validationResult.error as z.ZodError),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    if (!validatedData) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Extract dayOfWeek from the validated data
    const dayOfWeek = Array.isArray(validatedData.dayOfWeek)
      ? validatedData.dayOfWeek.map((d) => parseInt(d, 10))
      : [parseInt(validatedData.dayOfWeek, 10)];

    const serviceDay = await prisma.$transaction(async (tx) => {
      // Get existing weekdays
      const existingWeekdays = await tx.serviceDayWeekday.findMany({
        where: { serviceDayId: id },
        select: { dayOfWeek: true },
      });

      const existingDays = existingWeekdays.map((w) => w.dayOfWeek);

      // Delete weekdays that are no longer selected
      const daysToDelete = existingDays.filter(
        (day) => !dayOfWeek.includes(day)
      );
      if (daysToDelete.length > 0) {
        await tx.serviceDayWeekday.deleteMany({
          where: {
            serviceDayId: id,
            dayOfWeek: { in: daysToDelete },
          },
        });
      }

      // Create only new weekdays that don't exist
      const daysToCreate = dayOfWeek.filter(
        (day) => !existingDays.includes(day)
      );
      if (daysToCreate.length > 0) {
        await tx.serviceDayWeekday.createMany({
          data: daysToCreate.map((day) => ({
            serviceDayId: id,
            dayOfWeek: day,
          })),
        });
      }

      // Update the service day
      return await prisma.serviceDay.update({
        where: { id },
        // data: updateData,
        data: {
          name: validatedData.name,
          time: validatedData.time,
          serviceType: validatedData.serviceType,
          serviceCategory: validatedData.serviceCategory,
          isActive: validatedData.isActive ?? true,
          startDate: validatedData.startDate?.toISOString() || null,
          endDate:
            "endDate" in validatedData
              ? validatedData.endDate?.toISOString() || null
              : null,
          frequency:
            "frequency" in validatedData
              ? validatedData.frequency
              : Frequency.NONE,
          ordinal:
            "ordinal" in validatedData ? validatedData.ordinal : Ordinal.NEXT,
          cycle: "cycle" in validatedData ? validatedData.cycle : null,
        },
        include: {
          weekdays: true,
        },
      });
    });

    return NextResponse.json(serviceDay);
  } catch (error) {
    console.error("Error updating service day:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to update service day", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update service day" },
      { status: 500 }
    );
  }
};

export const DELETE = async (request: NextRequest) => {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Service day ID is required" },
        { status: 400 }
      );
    }

    await prisma.serviceDay.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "Service day deactivated" });
  } catch (error) {
    console.error("Error deleting service day:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
