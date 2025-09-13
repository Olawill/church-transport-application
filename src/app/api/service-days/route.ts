import { auth } from "@/auth";
import { UserRole } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// export const dynamic = "force-dynamic";

export const GET = async () => {
  try {
    const serviceDays = await prisma.serviceDay.findMany({
      where: { isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { time: "asc" }],
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
    const { name, dayOfWeek, time, serviceType } = body;

    if (!name || dayOfWeek === undefined || !time || !serviceType) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const serviceDay = await prisma.serviceDay.create({
      data: {
        name,
        dayOfWeek,
        time,
        serviceType,
      },
    });

    return NextResponse.json(serviceDay, { status: 201 });
  } catch (error) {
    console.error("Error creating service day:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Service day ID is required" },
        { status: 400 }
      );
    }

    const serviceDay = await prisma.serviceDay.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(serviceDay);
  } catch (error) {
    console.error("Error updating service day:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
