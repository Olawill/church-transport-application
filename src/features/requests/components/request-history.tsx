"use client";

import {
  AlertTriangle,
  Calendar,
  Car,
  CarFront,
  CheckCircle,
  Clock,
  Filter,
  Loader2Icon,
  MapPin,
  Pencil,
  Phone,
  Plus,
  User,
  Users,
  UserSquareIcon,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useDebounce } from "use-debounce";

import { RequestStatus, UserRole } from "@/generated/prisma/enums";
import { RequestType } from "@/lib/types";
import {
  calculateDistance,
  capitalize,
  formatDate,
  formatFilterDate,
  formatTime,
} from "@/lib/utils";

import { CustomPagination } from "@/components/custom-pagination";
import { CustomDateCalendar } from "@/components/custom-request-calendar";
import { CarBack } from "@/components/icons/car-back";
import AdminNewUserRequest from "@/features/admin/components/admin-new-user-request";
import { columns } from "@/features/drivers/components/column";
import { DataTable } from "@/features/drivers/components/data-table";
import { NewRequestForm } from "@/features/requests/components/new-request-form";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PAGINATION } from "@/config/constants";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRequestsParams } from "../hooks/use-requests-params";
import { GetUserRequestsType } from "../server/types";

type Type = RequestType | "ALL";
type Status = RequestStatus | "ALL";

export const RequestHistory = () => {
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [params, setParams] = useRequestsParams();
  const { page, pageSize, search, status, type, requestDate, serviceDay } =
    params;

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pickupCancelDialogOpen, setPickupCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<GetUserRequestsType | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );
  const [nameInput, setNameInput] = useState(search || "");
  const [debouncedNameInput] = useDebounce(search, 300);

  const { data: requestData, isLoading } = useSuspenseQuery(
    trpc.userRequests.getUserRequests.queryOptions(
      {
        status,
        type,
        requestDate: requestDate || "",
        search: debouncedNameInput || "",
        page,
        pageSize,
        serviceDay: serviceDay || "ALL",
        // maxDistance: "10",
      },
      {
        placeholderData: (previousData) => previousData,
      }
    )
  );

  const { data: services } = useSuspenseQuery(
    trpc.services.getServices.queryOptions({
      status: "active",
    })
  );

  const { data: drivers } = useSuspenseQuery(
    trpc.users.getUsers.queryOptions({
      role: "TRANSPORTATION_TEAM",
    })
  );

  const names = services.map((s) => s.name).filter(Boolean);
  const allServices = Array.from(new Set(["ALL", ...names]));

  // Extract data from query result
  const requests = requestData?.requests || [];
  const totalCount = requestData?.totalCount || 0;
  const totalPages = requestData?.totalPages || 1;
  const hasNextPage = requestData?.hasNextPage || false;
  const hasPreviousPage = requestData?.hasPreviousPage || false;

  const cancelRequest = useMutation(
    trpc.requests.cancelRequest.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message);

        queryClient.invalidateQueries(
          trpc.userRequests.getUserRequests.queryOptions({})
        );

        setCancelDialogOpen(false);
        setCancelReason("");
        setSelectedRequest(null);
      },
      onError: (error) => {
        toast.error(error.message || `Error cancelling request`);
      },
    })
  );

  const cancelPickup = useMutation(
    trpc.driverRequests.driverCancelRequest.mutationOptions({
      onSuccess: (data) => {
        toast.success(data.message || "Pickup cancelled successfully");

        queryClient.invalidateQueries(
          trpc.userRequests.getUserRequests.queryOptions({})
        );

        setPickupCancelDialogOpen(false);
        setCancelReason("");
        setSelectedRequest(null);
      },
      onError: (error) => {
        toast.error(error.message || `Error cancelling pickup`);
      },
    })
  );

  const handleNameFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNameInput(val); // Immediate input update

    // Update search param after debounce
    if (val !== search) {
      setTimeout(() => {
        setParams({ ...params, search: val, page: 1 });
      }, 300);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    await cancelRequest.mutateAsync({
      id: selectedRequest.id,
      reason: cancelReason,
    });
  };

  const handlePickupCancelRequest = async () => {
    if (!selectedRequest || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    if (!session || session.user.role !== UserRole.TRANSPORTATION_TEAM) {
      toast.error("You must be authenticated/authorized to cancel pickup");
      return;
    }

    await cancelPickup.mutateAsync({
      id: selectedRequest.id,
      driverId: session?.user.id,
      reason: cancelReason,
    });
  };

  const handleEditDialog = (value: boolean) => {
    setEditDialogOpen(value);
    if (!value) {
      setSelectedRequest(null);
    }
  };

  const canCancelOrEditRequest = (request: GetUserRequestsType): boolean => {
    // Users can cancel their pending requests
    // Or pending requests that haven't been accepted yet
    const serviceTime = request.serviceDay?.time as string;
    const serviceDate = request.requestDate;
    const [hours, minutes] = serviceTime.split(":").map(Number);
    const serviceDateTime = new Date(serviceDate);
    serviceDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const twoHoursBefore = new Date(
      serviceDateTime.getTime() - 2 * 60 * 60 * 1000
    );

    return (
      (request.status === "PENDING" || request.status === "ACCEPTED") &&
      now.getTime() < twoHoursBefore.getTime()
    ); // 2 hours before
  };

  const canCancelPickup = (request: GetUserRequestsType): boolean => {
    if (request.status !== "ACCEPTED") return false;

    const serviceTime = request.serviceDay?.time as string; // "HH:MM"
    const [hours, minutes] = serviceTime.split(":").map(Number);

    const serviceDateTime = new Date(request.requestDate);
    serviceDateTime.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const twoHoursBefore = new Date(
      serviceDateTime.getTime() - 2 * 60 * 60 * 1000
    );

    return now < twoHoursBefore;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleAccordion = (requestId: string) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [requestId]: !prev[requestId],
    }));
  };

  const clearFilters = () => {
    setParams({
      status: "ALL",
      type: "ALL",
      requestDate: "",
      search: "",
      serviceDay: "ALL",
      page: PAGINATION.DEFAULT_PAGE,
      pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
    });
    setNameInput("");
  };

  // Statistics calculations
  const pendingRequests = requestData?.stats.totalPending || 0;
  const acceptedRequests = requestData?.stats.totalAccepted || 0;
  const completedRequests = requestData?.stats.totalCompleted || 0;
  const dropOffRequest = requestData?.stats.totalDropOff || 0;
  const pickUpRequest = requestData?.stats.totalPickUp || 0;

  const isFiltered =
    status !== "ALL" ||
    type !== "ALL" ||
    requestDate ||
    nameInput !== "" ||
    serviceDay !== "ALL";

  // Role-based checks
  const isUser = session?.user?.role === UserRole.USER;
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isTransportationMember =
    session?.user?.role === UserRole.TRANSPORTATION_TEAM;

  return (
    <>
      <div className="space-y-6 w-full">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">
              {isUser ? "My Ride Requests" : "All Ride Requests"}
            </h1>
            <p className="mt-1">
              {isUser
                ? "View and manage your transportation requests"
                : "Monitor all ride requests in the system"}
            </p>
          </div>
          {(isUser || isAdmin) && (
            <Link href="/requests/new">
              <Button>
                <Plus className="size-4" />
                New Request
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Request */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">{pendingRequests}</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <Clock className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accepted Request */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Accepted</p>
                  <p className="text-2xl font-bold">{acceptedRequests}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Car className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Request */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">{completedRequests}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <CheckCircle className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PickUp Request */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">PickUp</p>
                  <p className="text-2xl font-bold">{pickUpRequest}</p>
                </div>
                <div className="p-3 rounded-full bg-lime-100 text-lime-700">
                  <CarFront className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DropOff Request */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">DropOff</p>
                  <p className="text-2xl font-bold">{dropOffRequest}</p>
                </div>
                <div className="p-3 rounded-full bg-cyan-100 text-cyan-700">
                  <CarBack className="size-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center">
                  <Filter className="mr-2 size-5" />
                  Filters
                </span>

                {/* Clear Button */}
                {isFiltered && (
                  <Button variant="outline" onClick={clearFilters}>
                    <XCircle className="size-4" />
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(value) => {
                      setParams({
                        ...params,
                        status: value as Status,
                        page: 1,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="ALL">All Requests</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Request Type
                  </Label>
                  <Select
                    value={type}
                    onValueChange={(value) =>
                      setParams({ ...params, type: value as Type, page: 1 })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="ALL">All Requests</SelectItem>
                      <SelectItem value="PICKUP">PickUp</SelectItem>
                      <SelectItem value="DROPOFF">DropOff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Service */}
                {!isUser && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Service
                    </Label>
                    <Select
                      value={serviceDay}
                      onValueChange={(value) =>
                        setParams({ ...params, serviceDay: value, page: 1 })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {allServices.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service === "ALL" ? "All Services" : service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Request Date */}
                <div>
                  <CustomDateCalendar
                    label="Request Date"
                    setRequestDateFilter={(date) => {
                      setParams({
                        ...params,
                        requestDate: date ? date.toISOString() : "",
                        page: 1,
                      });
                    }}
                    requestDateFilter={
                      requestDate ? new Date(requestDate) : undefined
                    }
                  />
                </div>
              </div>

              {/* Name Filter */}
              {!isUser && (
                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 block">Name</Label>
                  <Input
                    placeholder="Filter by member's name..."
                    value={nameInput}
                    onChange={handleNameFilterChange}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {status === "ALL" && type === "ALL" && !requestDate
                ? "All Requests"
                : `${status !== "ALL" ? capitalize(status) + " " : " "}` +
                  `${type !== "ALL" ? capitalize(String(type)) + " " : ""}` +
                  `Requests` +
                  `${requestDate ? " on " + formatFilterDate(new Date(requestDate)) : ""}`}
            </CardTitle>
            <CardDescription>
              {status === "PENDING" && "Requests waiting for driver assignment"}
              {status === "ACCEPTED" && "Requests accepted by drivers"}
              {status === "COMPLETED" && "Successfully completed rides"}
              {status === "CANCELLED" && "Cancelled requests"}
              {status === "ALL" && "Complete history of pickup requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse p-6 border rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <Car className="mx-auto size-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No requests found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isUser
                    ? "You haven't made any pickup requests yet."
                    : "No requests match your current filters."}
                </p>
                {isUser && (
                  <div className="mt-6">
                    <Link href="/requests/new">
                      <Button>
                        <Plus className="size-4" />
                        Create Your First Request
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <Calendar className="size-5 text-gray-400" />
                        <div>
                          <h3 className="font-semibold">
                            {request.serviceDay?.name}
                          </h3>
                          <p className="text-sm">
                            {formatDate(new Date(request.requestDate))} at{" "}
                            {request.serviceDay?.time
                              ? formatTime(request.serviceDay.time)
                              : "N/A"}
                          </p>
                          <div className="flex items-center gap-2">
                            {request.isPickUp && (
                              <Badge className="bg-lime-700">
                                <CarFront className="size-4" />
                                PickUp
                              </Badge>
                            )}
                            {request.isDropOff && (
                              <Badge className="bg-cyan-700">
                                <CarBack className="size-4" />
                                DropOff
                              </Badge>
                            )}

                            {request.isGroupRide && (
                              <Badge className="bg-sky-300">
                                <Users /> Group {request?.numberOfGroup}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.toLowerCase()}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {!isUser && request.user && (
                        <div className="flex items-center space-x-2">
                          <User className="size-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Requested by</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {request.user.name}
                            </p>
                            {request.user.phoneNumber && (
                              <p className="text-xs text-gray-500 dark:text-gray-200 flex items-center">
                                <Phone className="size-3 mr-1" />
                                {request.user.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <MapPin className="size-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Pickup Location</p>
                          <p className="text-sm">
                            {request.address
                              ? `${request.address.street}, ${request.address.city}, ${request.address.province}`
                              : "Address not available"}
                          </p>
                        </div>
                      </div>

                      {request.driver && (
                        <div className="flex items-center space-x-2">
                          <Car className="size-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">Driver</p>
                            <p className="text-sm">{request.driver.name}</p>
                            {request.driver.phoneNumber && (
                              <p className="text-xs text-blue-600 flex items-center">
                                <Phone className="size-3 mr-1" />
                                {request.driver.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {request.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">
                          Notes:
                        </p>
                        <p className="text-sm text-gray-600">{request.notes}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm flex h-5 items-center space-x-4">
                        <span>
                          Created: {formatDate(new Date(request.createdAt))}
                        </span>
                        {request.distance && (
                          <>
                            <Separator orientation="vertical" />
                            <span>Distance: ~{request.distance} km</span>
                          </>
                        )}
                      </div>

                      <div className="space-x-1">
                        <ButtonGroup>
                          {/* Action buttons for users */}
                          {(isUser || isAdmin) &&
                            canCancelOrEditRequest(request) && (
                              <>
                                {/* Edit Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Edit Request"
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="size-4" />
                                  <span className="max-sm:hidden">Edit</span>
                                </Button>

                                {/* Cancel Button */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  title="Cancel Request"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setCancelDialogOpen(true);
                                  }}
                                >
                                  <X className="size-4" />
                                  <span className="max-sm:hidden">Cancel</span>
                                </Button>
                              </>
                            )}

                          {/* Action buttons for drivers */}
                          {isTransportationMember &&
                            canCancelPickup(request) && (
                              <Button
                                variant="outline"
                                size="sm"
                                title="Cancel Pickup"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setPickupCancelDialogOpen(true);
                                }}
                              >
                                <X className="size-4" />
                                <span className="max-sm:hidden">
                                  Cancel Pickup
                                </span>
                              </Button>
                            )}

                          {(request.status === "PENDING" ||
                            request.status === "ACCEPTED") &&
                            isAdmin && (
                              <Button
                                variant="outline"
                                size="sm"
                                title={
                                  openAccordions[request.id]
                                    ? "Hide Drivers"
                                    : "Show Drivers"
                                }
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => {
                                  toggleAccordion(request.id);
                                }}
                              >
                                <UserSquareIcon className="size-4" />
                                <span className="max-sm:hidden">
                                  {openAccordions[request.id]
                                    ? "Hide Drivers"
                                    : "Show Drivers"}
                                </span>
                              </Button>
                            )}
                        </ButtonGroup>
                      </div>
                    </div>

                    {/* Assigning drivers - Only admin can assign drivers */}
                    {(request.status === "PENDING" ||
                      request.status === "ACCEPTED") &&
                      isAdmin &&
                      openAccordions[request.id] && (
                        <>
                          <Separator className="my-4" />
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                            defaultValue={request.id}
                          >
                            <AccordionItem value={request.id}>
                              <AccordionContent className="flex flex-col gap-4 ">
                                <h4 className="font-bold text-lg">
                                  Available Drivers for Assignment
                                </h4>
                                <p>
                                  Distance calculations are based on each
                                  driver&apos;s default address and the pickup
                                  location. Click &quot;Assign Request&quot; to
                                  notify the selected driver of this request.
                                </p>

                                <DataTable
                                  columns={columns}
                                  data={drivers
                                    .filter((d) => {
                                      // Always exclude the current user
                                      const isNotCurrentUser =
                                        d.id !== request.userId;

                                      // If request is accepted, also exclude the assigned driver
                                      const isNotAssignedDriver =
                                        request.status !== "ACCEPTED" ||
                                        d.id !== request.driverId;

                                      return (
                                        isNotCurrentUser && isNotAssignedDriver
                                      );
                                    })
                                    .map((d) => {
                                      const driverAddress = d.addresses?.find(
                                        (a) => a.isDefault
                                      );

                                      const lat1 = driverAddress?.latitude;
                                      const lon1 = driverAddress?.longitude;
                                      const lat2 = request.address?.latitude;
                                      const lon2 = request.address?.longitude;

                                      const hasValidCoordinates =
                                        lat1 != null &&
                                        lon1 != null &&
                                        lat2 != null &&
                                        lon2 != null;

                                      return {
                                        ...d,
                                        name: `${d.name}`,
                                        requestDistance: hasValidCoordinates
                                          ? calculateDistance(
                                              lat1,
                                              lon1,
                                              lat2,
                                              lon2
                                            )
                                          : null,
                                        request,
                                      };
                                    })}
                                />
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </>
                      )}
                  </div>
                ))}

                {/* Pagination */}
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
                  itemName="requests"
                  totalPages={totalPages}
                  hasNextPage={hasNextPage}
                  hasPreviousPage={hasPreviousPage}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Request Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="p-0">
          <DialogHeader>
            <DialogTitle className="sr-only">
              <div className="flex items-center text-amber-600 font-medium">
                <Pencil className="size-5 mr-2" />
                Edit Pickup Request
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Editing Pickup Request - You can only edit request minimum 2 hours
              before service
            </DialogDescription>
          </DialogHeader>
          {selectedRequest &&
            (isUser ? (
              <ScrollArea className="h-[520px] rounded p-4">
                <NewRequestForm
                  newRequestData={{
                    requestId: selectedRequest.id as string,
                    serviceDayId: selectedRequest.serviceDayId as string,
                    serviceDayOfWeek: String(
                      selectedRequest.serviceWeekday.dayOfWeek
                    ),
                    requestDate: selectedRequest.requestDate as Date,
                    addressId: selectedRequest.addressId as string,
                    notes: selectedRequest.notes as string,
                    isPickUp: selectedRequest.isPickUp as boolean,
                    isDropOff: selectedRequest.isDropOff as boolean,
                    isGroupRide: selectedRequest.isGroupRide as boolean,
                    numberOfGroup: selectedRequest.numberOfGroup ?? null,
                    isRecurring: false,
                    endDate: selectedRequest.serviceDay.endDate ?? undefined,
                    seriesId: selectedRequest.seriesId ?? null,
                  }}
                  setShowDialog={handleEditDialog}
                />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[540px] rounded-md p-4">
                <AdminNewUserRequest
                  isNewUser={false}
                  isGroupRequest={selectedRequest.isGroupRide}
                  isRecurringRequest={Boolean(selectedRequest.seriesId)}
                  formRequestDate={selectedRequest.requestDate}
                  newRequestData={{
                    requestId: selectedRequest.id as string,
                    userId: selectedRequest.userId as string,
                    serviceDayId: selectedRequest.serviceDayId as string,
                    serviceDayOfWeek: String(
                      selectedRequest.serviceWeekday.dayOfWeek
                    ),
                    requestDate: selectedRequest.requestDate as Date,
                    addressId: selectedRequest.addressId as string,
                    notes: selectedRequest.notes as string,
                    isPickUp: selectedRequest.isPickUp as boolean,
                    isDropOff: selectedRequest.isDropOff as boolean,
                    isGroupRide: selectedRequest.isGroupRide as boolean,
                    numberOfGroup: selectedRequest.numberOfGroup ?? null,
                    isRecurring: false,
                    endDate: selectedRequest.serviceDay.endDate ?? undefined,
                    seriesId: selectedRequest.seriesId ?? null,
                  }}
                  setShowDialog={handleEditDialog}
                />
              </ScrollArea>
            ))}
        </DialogContent>
      </Dialog>

      {/* Cancel Request Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 font-medium">
              <AlertTriangle className="size-5 mr-2" />
              Cancel Pickup Request
            </DialogTitle>
            <DialogDescription className="sr-only">
              Cancelling Pickup Request - You will need to state a reason for
              cancelling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Details</Label>
              <div className="text-sm text-gray-600 border p-3 bg-gray-50 rounded-lg mt-2 space-y-2">
                <p className="grid grid-cols-4 gap-1">
                  <span className="font-bold col-span-1">Service:</span>
                  <span className="col-span-3 truncate">
                    {selectedRequest?.serviceDay?.name}
                  </span>
                </p>
                <p className="grid grid-cols-4 gap-1">
                  <span className="font-bold col-span-1">Date:</span>
                  <span className="col-span-3 truncate">
                    {selectedRequest
                      ? formatDate(new Date(selectedRequest.requestDate))
                      : ""}
                  </span>
                </p>
                <p className="grid grid-cols-4 gap-1">
                  <span className="font-bold col-span-1">Status:</span>
                  <Badge
                    className={getStatusColor(
                      selectedRequest?.status as string
                    )}
                  >
                    {selectedRequest?.status}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="cancelReason">Reason for Cancellation</Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this pickup request..."
                rows={3}
                className="resize-none mt-2"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="size-4 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important:</p>
                  <p className="text-yellow-700">
                    Cancelling this request will notify your assigned driver (if
                    any) and free up the pickup slot for other members and
                    drivers.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setCancelDialogOpen(false);
                  setCancelReason("");
                  setSelectedRequest(null);
                }}
              >
                Keep Request
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelRequest}
                disabled={!cancelReason.trim() || cancelRequest.isPending}
              >
                {cancelRequest.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Cancel Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pickup Cancel Dialog */}
      <Dialog
        open={pickupCancelDialogOpen}
        onOpenChange={setPickupCancelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600 font-medium">
              <AlertTriangle className="size-5 mr-2" />
              Cancel Pickup Request - Driver
            </DialogTitle>
            <DialogDescription className="sr-only">
              Cancelling Pickup - You will need to state a reason for cancelling
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Request Details</Label>
              <div className="text-sm text-gray-600 border p-3 bg-gray-50 rounded-lg mt-2 space-y-2">
                <p className="grid grid-cols-4 gap-1">
                  <span className="font-bold col-span-1">Service:</span>
                  <span className="col-span-3 truncate">
                    {selectedRequest?.serviceDay?.name}
                  </span>
                </p>
                <p className="grid grid-cols-4 gap-1">
                  <span className="font-bold col-span-1">Date:</span>
                  <span className="col-span-3 truncate">
                    {selectedRequest
                      ? formatDate(new Date(selectedRequest.requestDate))
                      : ""}
                  </span>
                </p>
                <p className="grid grid-cols-4 gap-1">
                  <span className="font-bold col-span-1">Status:</span>
                  <Badge
                    className={getStatusColor(
                      selectedRequest?.status as string
                    )}
                  >
                    {selectedRequest?.status}
                  </Badge>
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="cancelReason">
                Reason for Pickup Cancellation
              </Label>
              <Textarea
                id="cancelReason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this pickup..."
                rows={3}
                className="resize-none mt-2"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <AlertTriangle className="size-4 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important:</p>
                  <p className="text-yellow-700">
                    Cancelling this request will notify the member.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPickupCancelDialogOpen(false);
                  setCancelReason("");
                  setSelectedRequest(null);
                }}
              >
                Keep Pickup
              </Button>
              <Button
                variant="destructive"
                onClick={handlePickupCancelRequest}
                disabled={!cancelReason.trim() || cancelPickup.isPending}
              >
                {cancelPickup.isPending && (
                  <Loader2Icon className="size-4 animate-spin" />
                )}
                Cancel Pickup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
