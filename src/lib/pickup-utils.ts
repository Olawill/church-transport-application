import { ServiceDay } from "@/generated/prisma";
import { differenceInMonths } from "date-fns";
import { getDayNameFromNumber } from "./utils";

export const validatePickUpRequestTiming = (
  serviceDay: ServiceDay,
  requestDate: Date,
  cutoffHours: number = 1
) => {
  const serviceDateTime = new Date(requestDate);

  if (isNaN(serviceDateTime.getTime())) {
    return { valid: false, error: "Invalid request date" };
  }

  const [hh, mm] = serviceDay.time.split(":").map((n) => parseInt(n, 10));
  const serviceStart = new Date(serviceDateTime);
  serviceStart.setHours(hh || 0, mm || 0, 0, 0);

  // Convert hours to milliseconds
  const cuttoffMs = cutoffHours * 60 * 60 * 1000;
  const cutoff = new Date(serviceStart.getTime() - cuttoffMs);

  if (Date.now() > cutoff.getTime()) {
    const hourText = `${cutoffHours} hours`;
    return {
      valid: false,
      error: `Cannot request pickup less than ${hourText} before service time`,
    };
  }

  return { valid: true };
};

export const validateDayOfWeek = (
  serviceDayOfWeek: number,
  requestDate: Date
) => {
  const serviceDateTime = new Date(requestDate);
  const requestDayOfWeek = serviceDateTime.getDay();

  if (requestDayOfWeek !== serviceDayOfWeek) {
    const dayOfWeek = getDayNameFromNumber(serviceDayOfWeek);
    return {
      valid: false,
      error: `Request date should be a ${dayOfWeek}`,
    };
  }

  return { valid: true };
};

// function to validate endDate is not gte to 3 months
export const validateEndDateLimit = (
  endDate: Date | undefined,
  requestDate: Date,
  isRecurring: boolean
) => {
  // Check if endDate is required for recurring requests
  if (isRecurring && !endDate) {
    return {
      valid: false,
      error: "End date is required for recurring requests",
    };
  }

  // If not recurring, endDate is optional
  if (!isRecurring || !endDate) {
    return {
      valid: true,
    };
  }
  // Check if endDate is in the past
  if (endDate < requestDate) {
    return {
      valid: false,
      error: "End date must be after request date",
    };
  }
  const monthDifference = differenceInMonths(endDate, requestDate);
  if (monthDifference > 3) {
    return {
      valid: false,
      error: `Recurring period must not exceed 3 months`,
    };
  }

  return { valid: true };
};

// ensure date is date
export const convertStringDateToDate = (date: Date | string) => {
  const normalizedDate = typeof date === "string" ? new Date(date) : date;
  return normalizedDate;
};

export const TRANSACTION_CONFIG = {
  maxWait: 10000,
  timeout: 30000,
};
