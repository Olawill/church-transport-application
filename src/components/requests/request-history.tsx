"use client";

import {
  AlertTriangle,
  Calendar,
  Car,
  CheckCircle,
  Clock,
  Filter,
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
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { columns } from "@/components/drivers/column";
import { DataTable } from "@/components/drivers/data-table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import { UserRole } from "@/generated/prisma";
import { Status, useRequestStore } from "@/lib/store/useRequestStore";
import { PickupRequest, RequestType, User as UserType } from "@/lib/types";
import {
  calculateDistance,
  capitalize,
  formatDate,
  formatFilterDate,
  formatTime,
} from "@/lib/utils";
import AdminNewUserRequest from "../admin/admin-new-user-request";
import CustomDateCalendar from "../custom-request-calendar";
import { NewRequestForm } from "./new-request-form";

type Type = RequestType | "ALL";

export const RequestHistory = () => {
  const { data: session } = useSession() || {};
  const {
    requests,
    loading,
    fetchRequests,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    requestDateFilter,
    setRequestDateFilter,
    clearFilters,
  } = useRequestStore();

  const [drivers, setDrivers] = useState<UserType[]>([]);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [pickupCancelDialogOpen, setPickupCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PickupRequest | null>(
    null
  );
  const [cancelReason, setCancelReason] = useState("");

  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (session?.user) {
      fetchRequests();
    }
  }, [session, statusFilter, typeFilter, requestDateFilter]);

  useEffect(() => {
    if (session?.user?.role === UserRole.ADMIN) {
      fetchDrivers();
    }
  }, [session]);

  const fetchDrivers = async () => {
    try {
      const params = new URLSearchParams();

      params.set("role", "TRANSPORTATION_TEAM");

      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedRequest || !cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      const response = await fetch(
        `/api/pickup-requests/${selectedRequest.id}/cancel`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: cancelReason.trim() }),
        }
      );

      if (response.ok) {
        await fetchRequests();
        setCancelDialogOpen(false);
        setCancelReason("");
        setSelectedRequest(null);
        toast.success("Pickup request cancelled successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to cancel request");
      }
    } catch (error) {
      console.error("Error cancel request:", error);
      toast.error("Error cancelling request");
    }
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

    try {
      const response = await fetch(
        `/api/pickup-requests/${selectedRequest.id}/cancel/${session.user.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: cancelReason.trim() }),
        }
      );

      if (response.ok) {
        await fetchRequests();
        setPickupCancelDialogOpen(false);
        setCancelReason("");
        setSelectedRequest(null);
        toast.success("Pickup cancelled successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to cancel pickup");
      }
    } catch (error) {
      console.error("Error cancel pickup:", error);
      toast.error("Error cancelling pickup");
    }
  };

  const handleEditDialog = (value: boolean) => {
    setEditDialogOpen(value);
    setSelectedRequest(null);
  };

  const canCancelOrEditRequest = (request: PickupRequest): boolean => {
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
      request.status === "PENDING" ||
      (request.status === "ACCEPTED" &&
        now.getTime() > twoHoursBefore.getTime())
    ); // 2 hours before
  };

  const canCancelPickup = (request: PickupRequest): boolean => {
    // Drivers can cancel their accepted pickup
    return (
      request.status === "ACCEPTED" &&
      new Date(request.requestDate).getTime() > Date.now() + 2 * 60 * 60 * 1000
    ); // 2 hours before
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

  // const isAuthenticated = !!session?.user;
  const isUser = session?.user?.role === UserRole.USER;
  const isAdmin = session?.user?.role === UserRole.ADMIN;
  const isTransportationMember =
    session?.user?.role === UserRole.TRANSPORTATION_TEAM;
  const pendingRequests = requests.filter((r) => r.status === "PENDING").length;
  const acceptedRequests = requests.filter(
    (r) => r.status === "ACCEPTED"
  ).length;
  const completedRequests = requests.filter(
    (r) => r.status === "COMPLETED"
  ).length;

  const dropOffRequest = requests.filter((r) => r.isDropOff === true).length;
  const pickUpRequest = requests.filter((r) => r.isPickUp === true).length;

  return (
    <div className="space-y-6">
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
                <Clock className="h-6 w-6" />
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
                <Car className="h-6 w-6" />
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
                <CheckCircle className="h-6 w-6" />
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
                <Car className="h-6 w-6" />
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
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as Status);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Requests</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div className="flex-1">
              <Label className="text-sm font-medium mb-2 block">
                Request Type
              </Label>
              <Select
                value={typeFilter as string}
                onValueChange={(value) => setTypeFilter(value as Type)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Requests</SelectItem>
                  <SelectItem value="PICKUP">PickUp</SelectItem>
                  <SelectItem value="DROPOFF">DropOff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Request Date */}
            <div className="flex-1">
              <CustomDateCalendar
                label="Request Date"
                setRequestDateFilter={setRequestDateFilter}
                requestDateFilter={requestDateFilter}
              />
            </div>
            {/* Clear Button */}
            <div className="flex-1">
              {(statusFilter !== "ALL" ||
                typeFilter !== "ALL" ||
                requestDateFilter) && (
                <Button variant="outline" type="button" onClick={clearFilters}>
                  <XCircle className="size-4" />
                  Clear Filter
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {statusFilter === "ALL" &&
            typeFilter === "ALL" &&
            !requestDateFilter
              ? "All Requests"
              : `${statusFilter !== "ALL" ? capitalize(statusFilter) + " " : " "}` +
                `${typeFilter !== "ALL" ? capitalize(String(typeFilter)) + " " : ""}` +
                `Requests` +
                `${requestDateFilter ? " on " + formatFilterDate(requestDateFilter) : ""}`}
          </CardTitle>
          <CardDescription>
            {statusFilter === "PENDING" &&
              "Requests waiting for driver assignment"}
            {statusFilter === "ACCEPTED" && "Requests accepted by drivers"}
            {statusFilter === "COMPLETED" && "Successfully completed rides"}
            {statusFilter === "CANCELLED" && "Cancelled requests"}
            {statusFilter === "ALL" && "Complete history of pickup requests"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
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
              <Car className="mx-auto h-12 w-12 text-gray-400" />
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
                      <Plus className="mr-2 h-4 w-4" />
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
                      <Calendar className="h-5 w-5 text-gray-400" />
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
                            <Badge className="bg-lime-700">PickUp</Badge>
                          )}
                          {request.isDropOff && (
                            <Badge className="bg-cyan-700">DropOff</Badge>
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
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Requested by</p>
                          <p className="text-sm text-gray-600">
                            {request.user.firstName} {request.user.lastName}
                          </p>
                          {request.user.phone && (
                            <p className="text-xs text-gray-500 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {request.user.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
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
                        <Car className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Driver</p>
                          <p className="text-sm">
                            {request.driver.firstName} {request.driver.lastName}
                          </p>
                          {request.driver.phone && (
                            <p className="text-xs text-blue-600 flex items-center">
                              <Phone className="h-3 w-3 mr-1" />
                              {request.driver.phone}
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
                      {isTransportationMember && canCancelPickup(request) && (
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
                          <span className="max-sm:hidden">Cancel Pickup</span>
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
                            className="text-green-600 hover:text-green-700 hover:bg-red-50 max-sm:mt-2"
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
                                      name: `${d.firstName} ${d.lastName}`,
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Request Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">
              <div className="flex items-center text-amber-600 font-medium">
                <Pencil className="h-5 w-5 mr-2" />
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
              <ScrollArea className="h-[520px] rounded-md p-4">
                <NewRequestForm
                  newRequestData={{
                    requestId: selectedRequest.id as string,
                    serviceDayId: selectedRequest.serviceDayId as string,
                    requestDate: selectedRequest.requestDate as Date,
                    addressId: selectedRequest.addressId as string,
                    notes: selectedRequest.notes as string,
                    isPickUp: selectedRequest.isPickUp as boolean,
                    isDropOff: selectedRequest.isDropOff as boolean,
                    isGroupRide: selectedRequest.isGroupRide as boolean,
                    numberOfGroup: selectedRequest.numberOfGroup ?? null,
                  }}
                  setShowDialog={handleEditDialog}
                />
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[540px] rounded-md py-4">
                <AdminNewUserRequest
                  isNewUser={false}
                  isGroupRequest={selectedRequest.isGroupRide}
                  newRequestData={{
                    requestId: selectedRequest.id as string,
                    userId: selectedRequest.userId as string,
                    serviceDayId: selectedRequest.serviceDayId as string,
                    requestDate: selectedRequest.requestDate as Date,
                    addressId: selectedRequest.addressId as string,
                    notes: selectedRequest.notes as string,
                    isPickUp: selectedRequest.isPickUp as boolean,
                    isDropOff: selectedRequest.isDropOff as boolean,
                    isGroupRide: selectedRequest.isGroupRide as boolean,
                    numberOfGroup: selectedRequest.numberOfGroup ?? null,
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
              <AlertTriangle className="h-5 w-5 mr-2" />
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
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Important:</p>
                  <p className="text-yellow-700">
                    Cancelling this request will notify your assigned driver (if
                    any) and free up the pickup slot for other members.
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
                disabled={!cancelReason.trim()}
              >
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
              <AlertTriangle className="h-5 w-5 mr-2" />
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
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2" />
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
                disabled={!cancelReason.trim()}
              >
                Cancel Pickup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
