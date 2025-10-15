import { clsx, type ClassValue } from "clsx";
import { addDays, addMonths, format, setDay, startOfMonth } from "date-fns";
import { twMerge } from "tailwind-merge";
import {
  Frequency,
  frequencyMap,
  Ordinal,
  ordinalMap,
  ServiceDay,
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// Check if pickup request is valid (2 hours before, 30 minutes cutoff)
export function isValidRequestTime(
  serviceDate: Date,
  serviceTime: string,
  hoursBuffer: number = 2
): boolean {
  const [hours, minutes] = serviceTime.split(":").map(Number);
  const serviceDateTime = new Date(serviceDate);
  serviceDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const minAllowedTime = new Date(
    serviceDateTime.getTime() - hoursBuffer * 60 * 60 * 1000
  );
  // const thirtyMinutesBefore = new Date(
  //   serviceDateTime.getTime() - 30 * 60 * 1000
  // );

  return now >= minAllowedTime;
}

// Get next occurrence of a service day
export function getNextServiceDate(dayOfWeek: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  let daysToAdd = dayOfWeek - currentDay;

  if (daysToAdd <= 0) {
    daysToAdd += 7;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysToAdd);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export function getNextServiceDateMod({
  fromDate,
  allowedWeekdays,
  endDate,
  frequency = "WEEKLY",
  ordinal = "NEXT",
}: {
  fromDate: Date;
  allowedWeekdays: number[];
  endDate?: Date;
  frequency?: Frequency;
  ordinal?: Ordinal;
}): Date | null {
  // Start from tomorrow to skip today
  const tomorrow = new Date(fromDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextOccurrences = getNextOccurrencesOfWeekdays({
    fromDate: tomorrow,
    allowedWeekdays,
    count: 1,
    endDate,
    frequency,
    ordinal,
  });

  return nextOccurrences.length > 0 ? nextOccurrences[0] : null;
}

export function getNextOccurrencesOfWeekdays({
  fromDate,
  allowedWeekdays = [],
  count,
  endDate,
  frequency = "WEEKLY",
  ordinal = "NEXT",
}: {
  fromDate: Date;
  allowedWeekdays: number[];
  count: number;
  endDate?: Date;
  frequency?: Frequency;
  ordinal?: Ordinal;
}): Date[] {
  const results: Date[] = [];
  let current = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );
  const frequencyStep = frequencyMap[frequency] || 1;
  let iterations = 0;
  const maxIterations = 10000;
  // === Handle WEEKLY, DAILY, NONE - only support NEXT ordinal ===
  if (frequency === "WEEKLY" || frequency === "DAILY" || frequency === "NONE") {
    // Force ordinal to NEXT for these frequencies
    while (
      endDate
        ? current.toISOString().split("T")[0] <=
          endDate.toISOString().split("T")[0]
        : results.length < count
    ) {
      if (
        allowedWeekdays.length === 0 ||
        allowedWeekdays.includes(current.getDay())
      ) {
        results.push(new Date(current));
      }
      current = addDays(current, 1);
      iterations++;
      if (iterations > maxIterations) break;
    }
    return results;
  }

  if (frequencyStep > 0) {
    // Monthly or longer frequency path
    if (ordinal === "NEXT") {
      // Extract just the date parts, ignoring time/timezone
      const getDateOnly = (date: Date) => {
        // Extract UTC date parts and create local date
        return new Date(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate()
        );
      };
      // Set date to end of day (23:59:59.999)
      const getEndOfDay = (date: Date) => {
        // Extract UTC date parts and create local date at end of day
        const d = new Date(
          date.getUTCFullYear(),
          date.getUTCMonth(),
          date.getUTCDate()
        );
        d.setHours(23, 59, 59, 999);
        return d;
      };

      let anchorDate = getDateOnly(fromDate);
      const normalizedFromDate = getDateOnly(fromDate);
      const normalizedEndDate = endDate ? getEndOfDay(endDate) : null;
      while (
        results.length < count &&
        (!normalizedEndDate || anchorDate <= normalizedEndDate)
      ) {
        const anchorDayOfWeek = anchorDate.getDay();
        for (const targetWeekday of allowedWeekdays) {
          const daysDiff = targetWeekday - anchorDayOfWeek;
          const targetDate = new Date(
            anchorDate.getFullYear(),
            anchorDate.getMonth(),
            anchorDate.getDate() + daysDiff
          );
          if (targetDate >= normalizedFromDate) {
            if (
              normalizedEndDate &&
              (targetDate.getFullYear() > normalizedEndDate.getFullYear() ||
                (targetDate.getFullYear() === normalizedEndDate.getFullYear() &&
                  targetDate.getMonth() > normalizedEndDate.getMonth()) ||
                (targetDate.getFullYear() === normalizedEndDate.getFullYear() &&
                  targetDate.getMonth() === normalizedEndDate.getMonth() &&
                  targetDate.getDate() > normalizedEndDate.getDate()))
            ) {
              continue;
            }
            results.push(targetDate);
            if (results.length >= count) break;
          }
        }
        if (results.length >= count) break;
        anchorDate = addMonths(anchorDate, frequencyStep);
        iterations++;
        if (iterations > maxIterations) break;
      }
      return results.sort((a, b) => a.getTime() - b.getTime());
    } else {
      // Ordinal is FIRST, SECOND, THIRD, FOURTH, LAST
      while (
        (!endDate && results.length < count) ||
        (endDate &&
          current.toISOString().split("T")[0] <=
            endDate.toISOString().split("T")[0])
      ) {
        const monthStart = startOfMonth(current);
        for (const weekday of allowedWeekdays) {
          let date: Date;
          if (ordinal === "LAST") {
            date = getLastWeekdayOfMonth(monthStart, weekday);
          } else {
            const nth = ordinalMap[ordinal];
            date = getNthWeekdayOfMonth(monthStart, weekday, nth);
          }
          if (
            date >= fromDate &&
            (!endDate ||
              date.toISOString().split("T")[0] <=
                endDate.toISOString().split("T")[0])
          ) {
            results.push(date);
          }
        }
        current = addMonths(current, frequencyStep);
        iterations++;
        if (iterations > maxIterations) break;
      }
      // Sort because multiple weekdays can produce unordered results
      return results.sort((a, b) => a.getTime() - b.getTime()).slice(0, count);
    }
  }
  return results;
}

function getNthWeekdayOfMonth(base: Date, weekday: number, nth: number): Date {
  // base = first of month, UTC
  // const year = base.getUTCFullYear();
  const year = base.getFullYear();
  // const month = base.getUTCMonth();
  const month = base.getMonth();

  // const firstDay = new Date(Date.UTC(year, month, 1));
  const firstDay = new Date(year, month, 1);
  // const firstWeekday = firstDay.getUTCDay();
  const firstWeekday = firstDay.getDay();

  // Calculate offset to first occurrence of desired weekday
  const offset = ((weekday - firstWeekday + 7) % 7) + (nth - 1) * 7;

  // const date = new Date(Date.UTC(year, month, 1 + offset));
  const date = new Date(year, month, 1 + offset);

  // Check if the calculated date is still in the same month
  if (date.getMonth() !== month) {
    // Return an invalid date that will be filtered out
    return new Date(year, month, 0); // Last day of previous month
  }

  return date;
}

function getLastWeekdayOfMonth(base: Date, weekday: number): Date {
  // const year = base.getUTCFullYear();
  const year = base.getFullYear();
  // const month = base.getUTCMonth();
  const month = base.getMonth();
  // const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)); // last day of month in UTC
  const lastDayOfMonth = new Date(year, month + 1, 0); // last day of month in UTC
  // const lastWeekday = lastDayOfMonth.getUTCDay();
  const lastWeekday = lastDayOfMonth.getDay();

  const offset = (lastWeekday - weekday + 7) % 7;
  // lastDayOfMonth.setUTCDate(lastDayOfMonth.getUTCDate() - offset);
  lastDayOfMonth.setDate(lastDayOfMonth.getDate() - offset);

  return lastDayOfMonth;
}

// Format user's full name
export function formatUserName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`;
}

// Format address for display
export function formatAddress(address: {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}): string {
  return `${address.street}, ${address.city}, ${address.province} ${address.postalCode}`;
}

// Validate Canadian postal code
export function isValidPostalCode(postalCode: string): boolean {
  const regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  return regex.test(postalCode);
}

// Validate email address
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validate phone number (basic Canadian format)
export function isValidPhoneNumber(phone: string): boolean {
  const regex = /^(\+1\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}$/;
  return regex.test(phone);
}

// Generate random password for initial setup
export function generateRandomPassword(length: number = 8): string {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Generate temporary password for admin user creation
export function generateTempPassword(
  lastName: string,
  phoneNumber: string
): string {
  // Extract last 4 digits from phone number (remove all non-digit)
  const phoneDigit = phoneNumber.replace(/\D/g, "");

  const lastFourDigits = phoneDigit.slice(-4).padStart(4, "0");

  const base = `${lastName}${lastFourDigits}`;

  return base.length >= 8 ? base : base.padEnd(8, "0");
}

// Capitalize
export const capitalize = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

// Filter Date Format
export const formatFilterDate = (date: Date) =>
  date.toISOString().split("T")[0]; // "YYYY-MM-DD"

export const getDayNameFromNumber = (dayNumber: number) => {
  // `setDay` sets the day of week on a given base date
  const date = setDay(new Date(), dayNumber);
  return format(date, "EEEE"); // EEEE = full weekday name
};

export const getServiceDayOptions = (service: ServiceDay) => {
  if (service.weekdays && service.weekdays.length > 1) {
    // Multi-day service with cycles - generate options
    const options: Array<{ value: string; label: string; dayOfWeek: number }> =
      [];

    if (service.cycle && service.cycle >= 1 && !service.endDate) {
      if (service.frequency !== "DAILY") {
        for (let cycleDay = 1; cycleDay <= service.cycle; cycleDay++) {
          service.weekdays.forEach((weekday) => {
            options.push({
              value: `${weekday.dayOfWeek}-${options.length + 1}`,
              label: `Day ${options.length + 1}`,
              dayOfWeek: weekday.dayOfWeek,
            });
          });
        }
        return options;
      } else {
        while (options.length < service.cycle) {
          for (const weekday of service.weekdays) {
            if (options.length >= service.cycle) break;

            options.push({
              value: `${weekday.dayOfWeek}-${options.length + 1}`,
              label: `Day ${options.length + 1}`,
              dayOfWeek: weekday.dayOfWeek,
            });
          }
        }
        return options;
      }
    }

    if (
      (service.cycle && service.endDate) ||
      (!service.cycle && service.endDate)
    ) {
      const fromDate = service.startDate || new Date();
      const allowedWeekdays = service.weekdays.map(
        (weekday) => weekday.dayOfWeek
      );

      const occurrences = getNextOccurrencesOfWeekdays({
        fromDate,
        allowedWeekdays,
        count: 1,
        endDate: service.endDate,
        frequency: service.frequency,
        ordinal: service.ordinal,
      });

      // Generate options using actual occurrence dates
      const options = occurrences.map((date, index) => {
        const dayOfWeek = date.getDay(); // 0 - Sunday, 4 - Thursday, etc.

        return {
          value: `${dayOfWeek}-${index + 1}`,
          label: `Day ${index + 1}`,
          dayOfWeek,
        };
      });

      return options;
    }
  }
  return [];
};
