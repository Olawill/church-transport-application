import { GetServiceType } from "./types";

export const canRestore = (service: { isActive: boolean; updatedAt: Date }) => {
  if (service.isActive || !service.updatedAt) return true; // Can always archive

  const now = new Date();
  const lastUpdated = new Date(service.updatedAt);
  const hoursSinceUpdate =
    (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

  return hoursSinceUpdate >= 24;
};

export const getRestoreTime = (service: GetServiceType) => {
  if (!service.updatedAt) return 0;

  const now = new Date();
  const lastUpdated = new Date(service.updatedAt);
  const hoursSinceUpdate =
    (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  const hoursRemaining = Math.ceil(24 - hoursSinceUpdate);

  return hoursRemaining;
};
