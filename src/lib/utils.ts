import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Coordinates } from "./route-optimization";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const { lat: lat1, lng: lon1 } = coord1;
  const { lat: lat2, lng: lon2 } = coord2;

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
  return nextDate;
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
