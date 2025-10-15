// components/admin/service-forms/ServiceList.tsx
import {
  Archive,
  ArchiveRestore,
  CalendarIcon,
  Clock,
  Edit2,
  Filter,
  Plus,
  RefreshCcwIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  CustomPagination,
  usePagination,
} from "@/components/custom-pagination";
import { useConfirm } from "@/hooks/use-confirm";
import { DAYS_OF_WEEK, ServiceDay } from "@/lib/types";
import { formatTime } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FaPrayingHands } from "react-icons/fa";

interface ServiceListProps {
  serviceDays: ServiceDay[];
  loading: boolean;
  onEdit: (service: ServiceDay) => void;
  onDelete: () => void;
  onShowForm: () => void;
}

export const ServiceList = ({
  serviceDays,
  loading,
  onEdit,
  onDelete,
  onShowForm,
}: ServiceListProps) => {
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Delete Service",
    "Are you sure you want to delete this service? This action cannot be undone.",
    true
  );

  const [ArchiveDialog, confirmArchive] = useConfirm(
    "Archive Service",
    "Are you sure you want to archive this service? You will only be able to reactivate this service after 24 hours.",
    true
  );

  const [RestoreDialog, confirmRestore] = useConfirm(
    "Restore Service",
    "Are you sure you want to restore this service? You can only reactivate this service after 24 hours of being deactivated.",
    true
  );

  const [servicesStatus, setServicesStatus] = useState("active");

  const {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    paginateItems,
  } = usePagination(10);

  // Filter the services based on active status
  const filteredServices = serviceDays.filter((service) => {
    const activeServices = servicesStatus === "active";

    const matchesService = service.isActive === activeServices;
    return matchesService;
  });

  const paginatedServices = paginateItems(filteredServices);

  const handleDelete = async (serviceId: string) => {
    const ok = await confirmDelete();
    if (!ok) return;

    try {
      const response = await fetch(`/api/service-days?id=${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Service deleted successfully");
        onDelete();
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("An error occurred");
    }
  };

  const handleArchive = async (serviceId: string, currentStatus: boolean) => {
    const action = currentStatus ? "archive" : "restore";

    const confirmFn = currentStatus ? confirmArchive : confirmRestore;

    const ok = await confirmFn();
    if (!ok) return;

    try {
      const response = await fetch(`/api/service-days?id=${serviceId}`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || `Service ${action}d successfully`);
        onDelete();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} service`);
      }
    } catch (error) {
      const act = action.slice(0, -1);
      console.error(`Error ${act}ing service:`, error);
      toast.error("An error occurred");
    }
  };

  const getDayName = (dayOfWeek: number) => {
    return (
      DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || "Unknown"
    );
  };

  const getServiceTypeColor = (type: string) => {
    return type === "REGULAR"
      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
  };

  const getServiceStatusColor = (status: boolean) => {
    return status
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "RECURRING":
        return "Regular";
      case "ONETIME_ONEDAY":
        return "One-Time";
      case "ONETIME_MULTIDAY":
        return "Multi-Day Event";
      case "FREQUENT_MULTIDAY":
        return "Recurring Special";
      default:
        return category;
    }
  };

  const canRestore = (service: ServiceDay) => {
    if (service.isActive) return true; // Can always archive

    const now = new Date();
    const lastUpdated = new Date(service.updatedAt);
    const hoursSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    return hoursSinceUpdate >= 24;
  };

  const getRestoreTime = (service: ServiceDay) => {
    const now = new Date();
    const lastUpdated = new Date(service.updatedAt);
    const hoursSinceUpdate =
      (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.ceil(24 - hoursSinceUpdate);

    return hoursRemaining;
  };

  return (
    <>
      <DeleteDialog />
      <ArchiveDialog />
      <RestoreDialog />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Service Schedule</span>
            <div className="flex items-center space-x-2">
              <Label>
                <Filter className="size-4" />
                Filter:
              </Label>
              <Select value={servicesStatus} onValueChange={setServicesStatus}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
          <CardDescription>
            Current church service times available for pickup requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : serviceDays.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">
                No services configured
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first service day.
              </p>
              <div className="mt-6">
                <Button onClick={onShowForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Service
                </Button>
              </div>
            </div>
          ) : filteredServices.length === 0 ? (
            <Empty className="from-muted/50 to-background h-full bg-gradient-to-b from-30%">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FaPrayingHands />
                </EmptyMedia>
                <EmptyTitle>No Services</EmptyTitle>
                <EmptyDescription>
                  No services found matching your filter.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setServicesStatus("active")}
                >
                  <RefreshCcwIcon />
                  Refresh
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paginatedServices.map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-lg p-4 hover:bg-accent transition-colors flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {service.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {service.weekdays &&
                            service.weekdays.length === 1 ? (
                              <span>
                                {getDayName(service.weekdays[0].dayOfWeek)}
                              </span>
                            ) : service.weekdays &&
                              service.weekdays.length > 1 ? (
                              <span>{service.weekdays.length} days</span>
                            ) : (
                              <span>No days set</span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{formatTime(service.time)}</span>
                          </div>
                        </div>

                        {/* Show selected days for multi-day services */}
                        {service.weekdays && service.weekdays.length > 1 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {service.weekdays.map((wd) => (
                              <Badge
                                key={wd.id}
                                variant="outline"
                                className="text-xs"
                              >
                                {getDayName(wd.dayOfWeek).substring(0, 3)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <ButtonGroup>
                          <Badge
                            className={getServiceTypeColor(service.serviceType)}
                          >
                            {service.serviceType.toLowerCase()}
                          </Badge>
                          <Badge
                            className={getServiceStatusColor(service.isActive)}
                          >
                            {service.isActive ? "active" : "inactive"}
                          </Badge>
                        </ButtonGroup>
                        <Badge variant="secondary" className="text-xs">
                          {getCategoryLabel(service.serviceCategory)}
                        </Badge>
                      </div>
                    </div>

                    {/* Additional info */}
                    {service.startDate && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Start:{" "}
                        {new Date(service.startDate).toLocaleDateString()}
                        {service.endDate &&
                          ` - End: ${new Date(service.endDate).toLocaleDateString()}`}
                      </div>
                    )}

                    {service.frequency && service.frequency !== "WEEKLY" && (
                      <div className="text-xs text-muted-foreground mb-2">
                        Frequency: {service.frequency.replace(/_/g, " ")}
                        {service.cycle && ` (Every ${service.cycle})`}
                      </div>
                    )}

                    <div className="flex justify-end space-x-2 mt-auto pt-3 border-t">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEdit(service)}
                          >
                            <Edit2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground">
                          Edit service
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleArchive(service.id, service.isActive)
                            }
                            disabled={!service.isActive && !canRestore(service)}
                          >
                            {service.isActive ? (
                              <Archive className="size-4" />
                            ) : (
                              <ArchiveRestore className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground">
                          {service.isActive
                            ? "Archive service"
                            : canRestore(service)
                              ? "Restore service"
                              : `Can restore in ${getRestoreTime(service)} hour${getRestoreTime(service) > 1 ? "s" : ""}`}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground">
                          Delete service
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>

              <CustomPagination
                currentPage={currentPage}
                totalItems={filteredServices.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                itemName="services"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
