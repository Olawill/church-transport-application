import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Frequency, frequencyMap, Ordinal, ordinalMap } from "./types";

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
  serviceTime: string
): boolean {
  const [hours, minutes] = serviceTime.split(":").map(Number);
  const serviceDateTime = new Date(serviceDate);
  serviceDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const twoHoursBefore = new Date(
    serviceDateTime.getTime() - 2 * 60 * 60 * 1000
  );
  const thirtyMinutesBefore = new Date(
    serviceDateTime.getTime() - 30 * 60 * 1000
  );

  return now <= twoHoursBefore && now >= thirtyMinutesBefore;
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

export function updatedGetNextServiceDate(
  dayOfWeek: number,
  frequency: Frequency = "weekly",
  ordinal: Ordinal = "next"
): Date {
  if (dayOfWeek < 0 || dayOfWeek > 6) {
    throw new Error(
      "Invalid day of week: must be between 0 (Sunday=0) and 6 (Saturday=6)"
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthsToAdd = frequencyMap[frequency];

  // ✅ "next" mode (uses today if it's the same weekday)
  if (ordinal === "next") {
    const baseDate = new Date(today);
    const isTodayTargetDay = baseDate.getDay() === dayOfWeek;

    if (!isTodayTargetDay) {
      let daysToAdd = dayOfWeek - baseDate.getDay();
      if (daysToAdd < 0) daysToAdd += 7;
      baseDate.setDate(baseDate.getDate() + daysToAdd);
    }

    if (monthsToAdd === 0) {
      return baseDate;
    }

    // Add months and re-align to the desired day of week
    const result = new Date(baseDate);
    result.setMonth(result.getMonth() + monthsToAdd);

    // Adjust weekday again after month increment
    const adjustedDay = result.getDay();
    let offset = dayOfWeek - adjustedDay;
    if (offset < 0) offset += 7;

    result.setDate(result.getDate() + offset);

    return result;
  }

  // ✅ "last" mode — find last weekday in target month
  if (ordinal === "last") {
    const lastDay = getLastWeekdayOfMonth(today, monthsToAdd, dayOfWeek);
    return lastDay;
  }

  // ✅ first, second, third, fourth
  if (ordinal in ordinalMap) {
    const nth = ordinalMap[ordinal as keyof typeof ordinalMap];
    const nthDate = getNthWeekdayOfMonth(today, monthsToAdd, dayOfWeek, nth);
    return nthDate;
  }

  throw new Error(`Unsupported ordinal: ${ordinal}`);
}

function getNthWeekdayOfMonth(
  fromDate: Date,
  monthsToAdd: number,
  dayOfWeek: number,
  nth: number
): Date {
  const targetMonth = new Date(fromDate);
  targetMonth.setMonth(targetMonth.getMonth() + monthsToAdd);
  targetMonth.setDate(1); // Start at the first of the month

  const firstDay = targetMonth.getDay();
  let offset = dayOfWeek - firstDay;
  if (offset < 0) offset += 7;

  const dayOfMonth = 1 + offset + (nth - 1) * 7;
  targetMonth.setDate(dayOfMonth);

  // If it goes past the month (e.g. 5th Friday in Feb), fallback to last
  if (targetMonth.getMonth() !== (fromDate.getMonth() + monthsToAdd) % 12) {
    return getLastWeekdayOfMonth(fromDate, monthsToAdd, dayOfWeek);
  }

  return targetMonth;
}

function getLastWeekdayOfMonth(
  fromDate: Date,
  monthsToAdd: number,
  dayOfWeek: number
): Date {
  const targetMonth = new Date(fromDate);
  targetMonth.setMonth(targetMonth.getMonth() + monthsToAdd + 1); // move to 1st of the next month
  targetMonth.setDate(0); // back to last day of target month

  const lastDay = targetMonth.getDay();
  let offset = lastDay - dayOfWeek;
  if (offset < 0) offset += 7;

  targetMonth.setDate(targetMonth.getDate() - offset);
  return targetMonth;
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
  str.charAt(0) + str.slice(1).toLowerCase();

// Filter Date Format
export const formatFilterDate = (date: Date) =>
  date.toISOString().split("T")[0]; // "YYYY-MM-DD"
