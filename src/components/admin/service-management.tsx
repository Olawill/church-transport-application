"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAYS_OF_WEEK, ServiceDay } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { serviceDaySchema, ServiceDaySchema } from "@/types/serviceDaySchema";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export const ServiceManagement = () => {
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDay | null>(null);

  const serviceForm = useForm<ServiceDaySchema>({
    resolver: zodResolver(serviceDaySchema),
    defaultValues: {
      name: "",
      dayOfWeek: "",
      time: "",
      serviceType: "REGULAR",
      isActive: true,
    },
  });

  // Add this useEffect to update form values when editingService changes
  useEffect(() => {
    if (editingService) {
      serviceForm.reset({
        name: editingService.name,
        dayOfWeek: editingService.dayOfWeek.toString(),
        time: editingService.time,
        serviceType: editingService.serviceType,
        isActive: editingService.isActive,
      });
    } else {
      // Reset to default values when not editing
      serviceForm.reset({
        name: "",
        dayOfWeek: "",
        time: "",
        serviceType: "REGULAR",
        isActive: true,
      });
    }
  }, [editingService]);

  useEffect(() => {
    fetchServiceDays();
  }, []);

  const fetchServiceDays = async () => {
    try {
      const response = await fetch("/api/service-days");
      if (response.ok) {
        const data = await response.json();
        setServiceDays(data);
      }
    } catch (error) {
      console.error("Error fetching service days:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: ServiceDaySchema) => {
    const validatedFields = serviceDaySchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/service-days", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...validatedFields.data,
          dayOfWeek: parseInt(validatedFields.data.dayOfWeek),
        }),
      });

      if (response.ok) {
        toast.success("Service created successfully");
        resetForm();
        fetchServiceDays();
      } else {
        toast.error("Failed to create service");
      }
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("An error occurred");
    }
  };

  const handleUpdate = async (values: ServiceDaySchema) => {
    const validatedFields = serviceDaySchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/service-days", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingService?.id,
          ...validatedFields.data,
          dayOfWeek: parseInt(validatedFields.data.dayOfWeek),
        }),
      });

      if (response.ok) {
        toast.success("Service updated successfully");
        resetForm();
        fetchServiceDays();
      } else {
        toast.error("Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: ServiceDay) => {
    setEditingService(service);

    // Immediately reset the form with the service data
    serviceForm.reset({
      name: service.name,
      dayOfWeek: service.dayOfWeek.toString(),
      time: service.time,
      serviceType: service.serviceType,
      isActive: service.isActive,
    });

    setShowForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to deactivate this service?")) {
      return;
    }

    try {
      const response = await fetch(`/api/service-days?id=${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Service deactivated successfully");
        fetchServiceDays();
      } else {
        toast.error("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("An error occurred");
    }
  };

  const resetForm = () => {
    serviceForm.reset();
    setEditingService(null);
    setShowForm(false);
  };

  const getDayName = (dayOfWeek: number) => {
    return (
      DAYS_OF_WEEK.find((day) => day.value === dayOfWeek)?.label || "Unknown"
    );
  };

  const getServiceTypeColor = (type: string) => {
    return type === "REGULAR"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  const getServiceStatusColor = (status: boolean) => {
    return status == false
      ? "bg-red-100 text-red-800"
      : "bg-green-100 text-green-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Service Management</h1>
          <p className="mt-1">
            Configure church service days and times for pickup requests
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={loading || !!editingService}
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Service Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingService ? "Edit Service" : "Add New Service"}
            </CardTitle>
            <CardDescription>
              {editingService
                ? "Update service details"
                : "Create a new service day for pickup requests"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...serviceForm}>
              <form
                onSubmit={
                  editingService
                    ? serviceForm.handleSubmit(handleUpdate)
                    : serviceForm.handleSubmit(handleSubmit)
                }
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Service Name */}
                  <FormField
                    control={serviceForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>
                          Service Name
                          <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="text"
                            name="name"
                            placeholder="e.g., Sunday Morning Service"
                            disabled={loading}
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Day of the Week */}
                  <FormField
                    control={serviceForm.control}
                    name="dayOfWeek"
                    render={({ field }) => {
                      return (
                        <FormItem className="space-y-2">
                          <FormLabel>
                            Day of Week
                            <span className="text-red-400">*</span>
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger className="max-md:w-full">
                                <SelectValue placeholder={"Select Day"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DAYS_OF_WEEK.map((day) => (
                                <SelectItem
                                  key={day.value.toString()}
                                  value={day.value.toString()}
                                >
                                  {day.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  {/* Status */}
                  <div className="space-y-2">
                    {/* Status Switch */}
                    {editingService && (
                      <FormField
                        control={serviceForm.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormLabel>
                              {field.value ? "Active" : "Inactive"}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Time */}
                  <FormField
                    control={serviceForm.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>
                          Start Time
                          <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="time"
                            step="1"
                            name="time"
                            placeholder="Select time"
                            onChange={(e) => {
                              field.onChange(e);
                            }}
                            disabled={loading}
                            required
                            className="bg-background appearance-none relative [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-2 [&::-webkit-calendar-picker-indicator]:top-1/2 [&::-webkit-calendar-picker-indicator]:-translate-y-1/2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Service Type */}
                  <FormField
                    control={serviceForm.control}
                    name="serviceType"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel>
                          Service Type
                          <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger className="max-md:w-full">
                              <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="REGULAR">
                              Regular Service
                            </SelectItem>
                            <SelectItem value="SPECIAL">
                              Special Event
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    <CheckCircle className="h-4 w-4" />
                    {editingService ? "Update Service" : "Create Service"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Schedule</CardTitle>
          <CardDescription>
            Current church service times available for pickup requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : serviceDays.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No services configured
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first service day.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Service
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {serviceDays.map((service) => (
                <div
                  key={service.id}
                  className="border rounded-lg p-4 hover:bg-gray-700"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{service.name}</h3>
                      <div className="flex items-center space-x-2 mt-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        <span>{getDayName(service.dayOfWeek)}</span>
                        <Clock className="h-4 w-4 ml-2" />
                        <span>{formatTime(service.time)}</span>
                      </div>
                    </div>
                    <div className="flex flex-row items-end space-x-1">
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
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(service)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(service.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
