"use client";

import { Calendar, Car, Clock, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useRequestStore } from "@/lib/store/useRequestStore";
import { formatDate, formatTime } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const UserDashboard = () => {
  const trpc = useTRPC();
  const { data: session } = useSession();

  // const { fetchRequests, loading, requests } = useRequestStore();

  const { data: requests, isLoading: loading } = useSuspenseQuery(
    trpc.userRequests.getUserRequests.queryOptions({})
  );

  // useEffect(() => {
  //   if (session?.user) {
  //     fetchRequests();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [session]);

  if (!requests) return null;

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

  const upcomingRequests = requests.filter(
    (request) => request.status === "ACCEPTED" || request.status === "PENDING"
  );
  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome, {session?.user?.name}!
          </h1>
          <p className="mt-1">Request pickup services for church events</p>
        </div>
        <Link href="/requests/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Upcoming Rides</p>
                <p className="text-2xl font-bold">{upcomingRequests.length}</p>
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
                <p className="text-sm font-medium">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Completed Rides</p>
                <p className="text-2xl font-bold">
                  {requests.filter((r) => r.status === "COMPLETED").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Requests */}
      {upcomingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Rides</CardTitle>
            <CardDescription>Your scheduled pickup requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:text-gray-900"
                >
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{request.serviceDay?.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(new Date(request.requestDate))} at{" "}
                        {request.serviceDay?.time
                          ? formatTime(request.serviceDay.time)
                          : "N/A"}
                      </p>
                      {request.driver && (
                        <p className="text-xs text-blue-600">
                          Driver: {request.driver.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(request.status)}>
                      {request.status.toLowerCase()}
                    </Badge>
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Recent Requests</CardTitle>
              <CardDescription>
                Your latest pickup request history
              </CardDescription>
            </div>
            <Link href="/requests">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <div className="text-center py-8">
              <Car className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No requests yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first pickup request.
              </p>
              <div className="mt-6">
                <Link href="/requests/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Request
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{request.serviceDay?.name}</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(new Date(request.requestDate))}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>
                    {request.status.toLowerCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
