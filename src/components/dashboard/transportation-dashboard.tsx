"use client";

import {
  BarChart3,
  Car,
  Clock,
  Filter,
  MapPin,
  Phone,
  TrendingUp,
  User,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRequestStore } from "@/lib/store/useRequestStore";
import { DISTANCE_OPTIONS } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

// Detailed operational dashboard for the dedicated /transportation route
export const TransportationDashboard = () => {
  const [maxDistance, setMaxDistance] = useState("10");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const { requests, loading, fetchRequests } = useRequestStore();

  useEffect(() => {
    fetchRequests({ status: statusFilter, maxDistance });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDistance, statusFilter]);

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/pickup-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: requestId,
          status: "ACCEPTED",
        }),
      });

      if (response.ok) {
        toast.success("Request accepted successfully");
        fetchRequests();
      } else {
        toast.error("Failed to accept request");
      }
    } catch (error) {
      console.error("Error accepting request:", error);
      toast.error("An error occurred");
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      const response = await fetch("/api/pickup-requests", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: requestId,
          status: "COMPLETED",
        }),
      });

      if (response.ok) {
        toast.success("Request marked as completed");
        fetchRequests();
      } else {
        toast.error("Failed to complete request");
      }
    } catch (error) {
      console.error("Error completing request:", error);
      toast.error("An error occurred");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "ACCEPTED":
        return "bg-blue-100 text-blue-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const myAcceptedRequests = requests.filter((r) => r.status === "ACCEPTED");
  const availableRequests = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Transportation Dashboard</h1>
        <p className="mt-1">
          Manage pickup requests and coordinate transportation services
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">My Accepted Requests</p>
                <p className="text-2xl font-bold">
                  {myAcceptedRequests.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Car className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Available Requests</p>
                <p className="text-2xl font-bold">{availableRequests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Completed</p>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "COMPLETED").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <User className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="mr-2 size-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Maximum Distance
              </label>
              <Select value={maxDistance} onValueChange={setMaxDistance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DISTANCE_OPTIONS.map((option) => (
                    <SelectItem
                      key={option.value.toString()}
                      value={option.value.toString()}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">
                Status Filter
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Requests</SelectItem>
                  <SelectItem value="PENDING">Pending Only</SelectItem>
                  <SelectItem value="ACCEPTED">My Accepted</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pickup Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pickup Requests</CardTitle>
          <CardDescription>
            {statusFilter === "PENDING" &&
              "Available requests within your distance preference"}
            {statusFilter === "ACCEPTED" && "Requests you have accepted"}
            {statusFilter === "COMPLETED" && "Your completed rides"}
            {statusFilter === "ALL" && "All requests matching your criteria"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
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
              <h3 className="mt-2 text-sm font-medium">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="border rounded-lg p-6 hover:bg-gray-50 dark:hover:text-gray-900"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <h3 className="font-semibold">
                          {request.user?.firstName} {request.user?.lastName}
                        </h3>
                        {request.user?.phone && (
                          <p className="text-sm flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-1" />
                            {request.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.toLowerCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">
                          {request.serviceDay?.name}
                        </p>
                        <p className="text-sm">
                          {formatDate(new Date(request.requestDate))} at{" "}
                          {request.serviceDay?.time
                            ? formatTime(request.serviceDay.time)
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Pickup Location</p>
                        <p className="text-sm">
                          {request.address
                            ? `${request.address.street}, ${request.address.city}, ${request.address.province}`
                            : "Address not available"}
                        </p>
                        {request.distance && (
                          <p className="text-xs text-blue-600">
                            ~{request.distance} km away
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">
                        Notes:
                      </p>
                      <p className="text-sm">{request.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    {request.status === "PENDING" && (
                      <Button
                        onClick={() => handleAcceptRequest(request.id)}
                        size="sm"
                      >
                        Accept Request
                      </Button>
                    )}
                    {request.status === "ACCEPTED" && (
                      <Button
                        onClick={() => handleCompleteRequest(request.id)}
                        size="sm"
                        variant="outline"
                      >
                        Mark Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Simplified dashboard component for transportation team members' general dashboard
export function TransportationTeamDashboard() {
  const [stats, setStats] = useState({
    myActiveRequests: 0,
    availableRequests: 0,
    completedToday: 0,
    totalCompleted: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/pickup-requests/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1">
          Welcome back! Here&apos;s an overview of today&apos;s transportation
          activities.
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">My Active Rides</p>
                <p className="text-2xl font-bold text-blue-600">
                  {loading ? "..." : stats.myActiveRequests}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Car className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Available Requests</p>
                <p className="text-2xl font-bold text-green-600">
                  {loading ? "..." : stats.availableRequests}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Completed Today</p>
                <p className="text-2xl font-bold text-purple-600">
                  {loading ? "..." : stats.completedToday}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Completed</p>
                <p className="text-2xl font-bold text-orange-600">
                  {loading ? "..." : stats.totalCompleted}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Access frequently used transportation team features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/transportation">
              <Button
                className="w-full h-16 text-left justify-start"
                variant="outline"
              >
                <div className="flex items-center space-x-3">
                  <Car className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-semibold">Manage Requests</p>
                    <p className="text-sm">View and manage pickup requests</p>
                  </div>
                </div>
              </Button>
            </Link>

            <Link href="/requests">
              <Button
                className="w-full h-16 text-left justify-start"
                variant="outline"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-semibold">Request History</p>
                    <p className="text-sm">View your ride history</p>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Summary</CardTitle>
          <CardDescription>
            A quick overview of your transportation activities today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Car className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium dark:text-secondary">
                  Active Rides
                </span>
              </div>
              <span className="text-sm text-blue-600 font-semibold">
                {stats.myActiveRequests} ongoing
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium dark:text-secondary">
                  Available for Pickup
                </span>
              </div>
              <span className="text-sm text-green-600 font-semibold">
                {stats.availableRequests} requests
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium dark:text-secondary">
                  Completed Today
                </span>
              </div>
              <span className="text-sm text-purple-600 font-semibold">
                {stats.completedToday} rides
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <Link href="/transportation">
              <Button className="w-full">Go to Transportation Center</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
