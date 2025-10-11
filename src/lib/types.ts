import {
  RequestStatus,
  ServiceType,
  UserRole,
  UserStatus,
} from "@/generated/prisma";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  username: string | null;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  maxDistance: number;
  emailVerified: Date | null;
  phoneVerified: Date | null;
  image: string | null;
  whatsappNumber: string | null;
  twoFactorEnabled: boolean;
  bannedAt: Date | null;
  bannedBy: string | null;
  banReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  addresses?: Address[];
  pickupRequests?: PickupRequest[];
  acceptedRequests?: PickupRequest[];
}

export interface Address {
  id: string;
  userId: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  pickupRequests?: PickupRequest[];
}

export interface ServiceDay {
  id: string;
  name: string;
  dayOfWeek: number;
  time: string;
  serviceType: ServiceType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  pickupRequests?: PickupRequest[];
}

export interface PickupRequest {
  id: string;
  userId: string;
  driverId?: string | null;
  serviceDayId: string;
  addressId: string;
  requestDate: Date;
  status: RequestStatus;
  isPickUp: boolean;
  isDropOff: boolean;
  isGroupRide: boolean;
  numberOfGroup: number | null;
  isRecurring: boolean;
  endDate?: Date;
  notes?: string | null;
  seriesId: string | null;
  distance?: number | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  driver?: User | null;
  serviceDay?: ServiceDay;
  address?: Address;
}

export enum RequestType {
  PICKUP = "PICKUP",
  DROPOFF = "DROPOFF",
}

export interface DashboardStats {
  totalUsers: number;
  pendingUsers: number;
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  activeDrivers: number;
}

export interface DistanceOption {
  value: number;
  label: string;
}

export type Frequency =
  | "DAILY"
  | "WEEKLY"
  | "MONTHLY"
  | "EVERY_2_MONTHS"
  | "QUARTERLY"
  | "EVERY_4_MONTHS"
  | "EVERY_6_MONTHS"
  | "YEARLY"
  | "NONE";

export type Ordinal =
  | "NEXT" // next occurrence of the weekday from today
  | "FIRST"
  | "SECOND"
  | "THIRD"
  | "FOURTH"
  | "LAST";

export const ordinalMap: Record<Exclude<Ordinal, "NEXT" | "LAST">, number> = {
  FIRST: 1,
  SECOND: 2,
  THIRD: 3,
  FOURTH: 4,
};

export const frequencyMap: Record<Frequency, number> = {
  DAILY: 0,
  WEEKLY: 0,
  MONTHLY: 1,
  EVERY_2_MONTHS: 2,
  QUARTERLY: 3,
  EVERY_4_MONTHS: 4,
  EVERY_6_MONTHS: 6,
  YEARLY: 12,
  NONE: 0,
};

export const DISTANCE_OPTIONS: DistanceOption[] = [
  { value: 10, label: "10 km" },
  { value: 20, label: "20 km" },
  { value: 30, label: "30 km" },
  { value: 50, label: "50 km" },
];

export const PROVINCES = [
  "AB",
  "BC",
  "MB",
  "NB",
  "NL",
  "NT",
  "NS",
  "NU",
  "ON",
  "PE",
  "QC",
  "SK",
  "YT",
];

export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export interface NewRequestResponse {
  addresses: {
    id: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
    isDefault: boolean;
  }[];
  _count: {
    pickupRequests: number;
    acceptedRequests: number;
  };
  id: string;
  email: string;
  image: string | null;
  role: UserRole;
  status: UserStatus;
  password: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  maxDistance: number;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
