import {
  Calendar1Icon,
  CalendarIcon,
  CarIcon,
  HomeIcon,
  UsersIcon,
} from "lucide-react";

export const navigationItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: HomeIcon,
    roles: ["ADMIN", "TRANSPORTATION_TEAM", "USER"],
  },
  {
    name: "Requests",
    href: "/requests",
    icon: CalendarIcon,
    roles: ["ADMIN", "TRANSPORTATION_TEAM", "USER"],
  },
  { name: "Users", href: "/admin/users", icon: UsersIcon, roles: ["ADMIN"] },
  {
    name: "Services",
    href: "/admin/services",
    icon: Calendar1Icon,
    roles: ["ADMIN"],
  },
  {
    name: "Transportation",
    href: "/transportation",
    icon: CarIcon,
    roles: ["TRANSPORTATION_TEAM"],
  },
];
