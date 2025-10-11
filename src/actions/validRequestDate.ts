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
  requestDate: Date,
  serviceDayId: string
): Promise<ValidateRequestDateResult> => {
  const requestDayOfWeek = requestDate.getDay();

  const serviceDayOfWeek = await prisma.serviceDay.findUnique({
    where: { id: serviceDayId },
    select: {
      dayOfWeek: true,
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

  const isServiceDayOfWeek = requestDayOfWeek === serviceDayOfWeek.dayOfWeek;
  const dayOfWeek = getDayNameFromNumber(serviceDayOfWeek.dayOfWeek);

  return {
    success: true,
    error: false,
    message: "Validation successful",
    validData: {
      isServiceDayOfWeek,
      dayOfWeek,
    },
  };
};
