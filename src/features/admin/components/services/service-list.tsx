import {
  Archive,
  ArchiveRestore,
  CalendarIcon,
  Clock,
  Edit2,
  Filter,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { CustomPagination } from "@/components/custom-pagination";
import { useConfirm } from "@/hooks/use-confirm";
import { DAYS_OF_WEEK } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { useServiceDayParams } from "../../hooks/use-serviceDay-params";
import { GetPaginatedServiceType, GetServiceType } from "../../types";

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { canRestore, getRestoreTime } from "../../utils";

interface ServiceListProps {
  serviceDaysData: GetPaginatedServiceType;
  loading: boolean;
  onEdit: (service: GetServiceType) => void;
  // onDelete: () => void;
  onShowForm: () => void;
}

export const ServiceList = ({
  serviceDaysData,
  loading,
  onEdit,
  // onDelete,
  onShowForm,
}: ServiceListProps) => {
  const [DeleteDialog, confirmDelete] = useConfirm({
    title: "Delete Service",
    message:
      "Are you sure you want to delete this service? This action cannot be undone.",
  });

  const [ArchiveDialog, confirmArchive] = useConfirm({
    title: "Archive Service",
    message:
      "Are you sure you want to archive this service? You will only be able to reactivate this service after 24 hours.",
  });

  const [RestoreDialog, confirmRestore] = useConfirm({
    title: "Restore Service",
    message:
      "Are you sure you want to restore this service? You can only reactivate this service after 24 hours of being deactivated.",
    update: true,
  });

  const trpc = useTRPC();

  const [params, setParams] = useServiceDayParams();
  const { page, pageSize, status } = params;

  const queryClient = useQueryClient();

  // Extract data from query result
  const serviceDays = serviceDaysData?.serviceDays || [];
  const totalCount = serviceDaysData?.totalCount || 0;
  const totalPages = serviceDaysData?.totalPages || 1;
  const hasNextPage = serviceDaysData?.hasNextPage || false;
  const hasPreviousPage = serviceDaysData?.hasPreviousPage || false;

  // Logic to Delete, Archive or Restore
  const deleteService = useMutation(
    trpc.services.deleteService.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${data.deletedService.name} deleted successfully!`);

        queryClient.invalidateQueries(
          trpc.services.getPaginatedServices.queryOptions({})
        );

        queryClient.invalidateQueries(
          trpc.services.getServices.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to deleted service`);
      },
    })
  );

  const archiveService = useMutation(
    trpc.services.toggleServiceActive.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `${data.updatedService.name} has been ${data.updatedService.isActive ? "restored" : "deactivated"} successfully!`
        );

        queryClient.invalidateQueries(
          trpc.services.getPaginatedServices.queryOptions({})
        );

        queryClient.invalidateQueries(
          trpc.services.getServices.queryOptions({})
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to update service status`);
      },
    })
  );

  const handleDelete = async (serviceId: string) => {
    const result = await confirmDelete();
    if (result.action !== "confirm") return;

    await deleteService.mutateAsync({ id: serviceId });
  };

  const handleArchive = async (serviceId: string, currentStatus: boolean) => {
    const confirmFn = currentStatus ? confirmArchive : confirmRestore;

    const result = await confirmFn();
    if (result.action !== "confirm") return;

    await archiveService.mutateAsync({ id: serviceId });
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
              <Select
                value={status}
                onValueChange={(value) =>
                  setParams({ ...params, status: value, page: 1 })
                }
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
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
              <CalendarIcon className="mx-auto size-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium">
                No services configured
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first service day.
              </p>
              <div className="mt-6">
                <Button onClick={onShowForm}>
                  <Plus className="mr-2 size-4" />
                  Add First Service
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceDays.map((service) => (
                  <div
                    key={service.id}
                    className="border rounded-lg p-4 hover:bg-accent dark:hover:bg-accent/5 transition-colors flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg line-clamp-1">
                          {service.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <CalendarIcon className="size-4 mr-1" />
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
                            <Clock className="size-4 mr-1" />
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
                currentPage={page}
                totalItems={totalCount}
                itemsPerPage={pageSize}
                onPageChange={(newPage) =>
                  setParams({ ...params, page: newPage })
                }
                onItemsPerPageChange={(newPageSize) => {
                  setParams({ ...params, pageSize: newPageSize, page: 1 });
                }}
                itemName="services"
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPreviousPage={hasPreviousPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
