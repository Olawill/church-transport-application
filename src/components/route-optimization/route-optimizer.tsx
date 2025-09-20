"use client";

import { Car, CheckCircle, Clock, MapPin, Route, Shuffle } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { getDriverRoutes } from "@/lib/route-optimization";

interface PickupRequest {
  id: string;
  userId: string;
  addressId: string;
  requestDate: string;
  notes?: string;
  priority: number;
  user: {
    firstName: string;
    lastName: string;
    phone?: string;
  };
  address: {
    id: string;
    name: string;
    street: string;
    city: string;
    province: string;
    latitude?: number;
    longitude?: number;
  };
}

interface RouteData {
  id: string;
  routeDate: string;
  status: string;
  totalDistance: number;
  estimatedTime: number;
  optimizationScore?: number;
  orderedPickups: string[];
}

// type DR = Awaited<ReturnType<typeof getDriverRoutes>>

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  maxDistance: number;
}

interface ServiceDay {
  id: string;
  name: string;
  dayOfWeek: number;
  time: string;
}

export const RouteOptimizer = () => {
  const [pendingRequests, setPendingRequests] = useState<PickupRequest[]>([]);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  // const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Optimization form state
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedServiceDay, setSelectedServiceDay] = useState("");
  const [routeDate, setRouteDate] = useState("");
  const [startLocation, setStartLocation] = useState({
    lat: 43.6532, // Default to Toronto
    lng: -79.3832,
    address: "",
  });

  useEffect(() => {
    fetchPendingRequests();
    fetchDrivers();
    fetchServiceDays();
    fetchRoutes();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch("/api/pickup-requests?status=PENDING");
      if (response.ok) {
        const data = await response.json();
        setPendingRequests(data.requests || []);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const response = await fetch(
        "/api/users?role=TRANSPORTATION_TEAM&status=APPROVED"
      );
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  };

  const fetchServiceDays = async () => {
    try {
      const response = await fetch("/api/service-days");
      if (response.ok) {
        const data = await response.json();
        setServiceDays(data.serviceDays || []);
      }
    } catch (error) {
      console.error("Error fetching service days:", error);
    }
  };

  const fetchRoutes = async () => {
    try {
      const response = await fetch("/api/routes");
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const handleOptimizeRoute = async () => {
    if (
      !selectedDriver ||
      !selectedServiceDay ||
      !routeDate ||
      selectedRequests.length === 0
    ) {
      toast.error(
        "Please fill in all required fields and select pickup requests"
      );
      return;
    }

    setOptimizing(true);
    try {
      const response = await fetch("/api/routes/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId: selectedDriver,
          serviceDayId: selectedServiceDay,
          routeDate,
          pickupRequestIds: selectedRequests,
          startLocation,
        }),
      });

      if (response.ok) {
        await response.json();
        toast.success("Route optimized successfully!");

        // Reset form
        setSelectedRequests([]);
        setSelectedDriver("");
        setSelectedServiceDay("");
        setRouteDate("");

        // Refresh data
        fetchPendingRequests();
        fetchRoutes();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to optimize route");
      }
    } catch {
      toast.error("Failed to optimize route");
    } finally {
      setOptimizing(false);
    }
  };

  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PLANNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Route Optimization
          </h1>
          <p className="text-muted-foreground">
            Create optimized pickup routes for drivers
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Route Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shuffle className="mr-2 h-5 w-5" />
              Create Optimized Route
            </CardTitle>
            <CardDescription>
              Select pickup requests and create an optimized route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Driver</Label>
                <Select
                  value={selectedDriver}
                  onValueChange={setSelectedDriver}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Service Day</Label>
                <Select
                  value={selectedServiceDay}
                  onValueChange={setSelectedServiceDay}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service day" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceDays.map((day) => (
                      <SelectItem key={day.id} value={day.id}>
                        {day.name} ({day.time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Route Date</Label>
              <Input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Start Location Address</Label>
              <Input
                value={startLocation.address}
                onChange={(e) =>
                  setStartLocation((prev) => ({
                    ...prev,
                    address: e.target.value,
                  }))
                }
                placeholder="Enter starting address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={startLocation.lat}
                  onChange={(e) =>
                    setStartLocation((prev) => ({
                      ...prev,
                      lat: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  value={startLocation.lng}
                  onChange={(e) =>
                    setStartLocation((prev) => ({
                      ...prev,
                      lng: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            </div>

            <Button
              onClick={handleOptimizeRoute}
              disabled={optimizing || selectedRequests.length === 0}
              className="w-full"
            >
              {optimizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Optimizing Route...
                </>
              ) : (
                <>
                  <Route className="mr-2 h-4 w-4" />
                  Optimize Route ({selectedRequests.length} requests)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Routes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="mr-2 h-5 w-5" />
              Recent Routes
            </CardTitle>
            <CardDescription>View and manage existing routes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {routes.slice(0, 5).map((route) => (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      Route {new Date(route.routeDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {route.orderedPickups?.length || 0} pickups •{" "}
                      {route.totalDistance?.toFixed(1)}km
                    </div>
                    {route.optimizationScore && (
                      <div className="text-sm">
                        Optimization: {route.optimizationScore}%
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(route.status)}>
                      {route.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {route.estimatedTime}min
                    </div>
                  </div>
                </div>
              ))}

              {routes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No routes created yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Pickup Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Pending Pickup Requests
          </CardTitle>
          <CardDescription>
            Select requests to include in the optimized route
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedRequests.includes(request.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => toggleRequestSelection(request.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {request.user.firstName} {request.user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {request.address.street}, {request.address.city}
                  </div>
                  {request.priority > 0 && (
                    <Badge variant="outline" className="mt-1">
                      High Priority
                    </Badge>
                  )}
                  {request.notes && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Note: {request.notes}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {selectedRequests.includes(request.id) && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}

            {pendingRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No pending pickup requests
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
