"use server";

import { prisma } from "@/lib/db";
import { getDayNameFromNumber } from "@/lib/utils";

type ValidateRequestDateResult =
  | {
      success: true;
      error: false;
      message: string;
      validData: {
        isServiceDayOfWeek: boolean;
        dayOfWeek: string;
      };
    }
  | {
      success: false;
      error: true;
      message: string;
      validData: null;
    };

export const validateRequestDate = async (
  requestDayOfWeek: number,
  serviceDayId: string
): Promise<ValidateRequestDateResult> => {
  const serviceDayOfWeek = await prisma.serviceDay.findUnique({
    where: { id: serviceDayId },
    select: {
      weekdays: {
        where: { serviceDayId: serviceDayId, dayOfWeek: requestDayOfWeek },
        select: { dayOfWeek: true },
      },
    },
  });

  if (!serviceDayOfWeek) {
    return {
      success: false,
      error: true,
      message: "Service Day not found.",
      validData: null,
    };
  }

  const dayOfWeek = getDayNameFromNumber(
    serviceDayOfWeek.weekdays[0].dayOfWeek
  );

  return {
    success: true,
    error: false,
    message: "Validation successful",
    validData: {
      isServiceDayOfWeek: true,
      dayOfWeek,
    },
  };
};
