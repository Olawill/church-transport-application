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
  requestServiceDayOfWeek: number,
  serviceDayId: string
): Promise<ValidateRequestDateResult> => {
  const serviceDayOfWeek = await prisma.serviceDay.findUnique({
    where: { id: serviceDayId },
    select: {
      weekdays: {
        where: {
          serviceDayId: serviceDayId,
          dayOfWeek: requestServiceDayOfWeek,
        },
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

  const serviceDayWeekDayLength = serviceDayOfWeek.weekdays.length;
  if (serviceDayWeekDayLength === 0) {
    return {
      success: false,
      error: true,
      message: "Requested day of week is not a service day.",
      validData: null,
    };
  }

  const dayOfWeek =
    serviceDayWeekDayLength > 1
      ? "Multiple"
      : getDayNameFromNumber(serviceDayOfWeek.weekdays[0].dayOfWeek);
  const isServiceDayOfWeek =
    serviceDayWeekDayLength > 1
      ? serviceDayOfWeek.weekdays
          .map((d) => d.dayOfWeek)
          .includes(requestServiceDayOfWeek)
      : serviceDayOfWeek.weekdays[0].dayOfWeek === requestServiceDayOfWeek;

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
