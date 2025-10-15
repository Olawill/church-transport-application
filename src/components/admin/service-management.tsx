"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import {
  Frequency,
  Ordinal,
  ServiceCategory,
  ServiceType,
} from "@/generated/prisma";
import { ServiceDay } from "@/lib/types";
import {
  frequentMultiDaySchema,
  FrequentMultiDaySchema,
  onetimeMultiDaySchema,
  OnetimeMultiDaySchema,
  onetimeOneDaySchema,
  OnetimeOneDaySchema,
  recurringSchema,
  RecurringSchema,
} from "@/types/serviceDaySchema";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FrequentMultiDayForm } from "./services/frequent-multi-day-form";
import { OnetimeMultiDayForm } from "./services/one-time-multi-day-form";
import { OnetimeOneDayForm } from "./services/one-time-one-day-form";
import { RecurringForm } from "./services/recurring-form";
import { ServiceList } from "./services/service-list";

type FormSchema =
  | RecurringSchema
  | OnetimeOneDaySchema
  | OnetimeMultiDaySchema
  | FrequentMultiDaySchema;

type PropertyError = {
  errors: string[];
};

export const ServiceManagement = () => {
  const [serviceDays, setServiceDays] = useState<ServiceDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceDay | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceCategory>(
    ServiceCategory.RECURRING
  );

  // Schema map for each tab
  const schemaMap = useMemo(
    () => ({
      [ServiceCategory.RECURRING]: recurringSchema,
      [ServiceCategory.ONETIME_ONEDAY]: onetimeOneDaySchema,
      [ServiceCategory.ONETIME_MULTIDAY]: onetimeMultiDaySchema,
      [ServiceCategory.FREQUENT_MULTIDAY]: frequentMultiDaySchema,
    }),
    []
  );

  // Default values map
  const getDefaultValues = useCallback(
    (category: ServiceCategory, service?: ServiceDay) => {
      if (service) {
        // Extract days of week
        const dayOfWeek =
          service.weekdays?.length === 1
            ? service.weekdays[0].dayOfWeek.toString()
            : service.weekdays?.map((w) => w.dayOfWeek.toString()) || [];

        const base = {
          name: service.name,
          time: service.time,
          isActive: service.isActive,
        };

        switch (category) {
          case ServiceCategory.RECURRING:
            return {
              ...base,
              dayOfWeek: dayOfWeek as string,
              serviceCategory: ServiceCategory.RECURRING,
              serviceType: ServiceType.REGULAR,
              frequency: service.frequency || Frequency.WEEKLY,
              ordinal: service.ordinal || Ordinal.NEXT,
              startDate: service.startDate
                ? new Date(service.startDate)
                : undefined,
            };
          case ServiceCategory.ONETIME_ONEDAY:
            return {
              ...base,
              dayOfWeek: dayOfWeek as string,
              serviceCategory: ServiceCategory.ONETIME_ONEDAY,
              serviceType: ServiceType.SPECIAL,
              startDate: service.startDate
                ? new Date(service.startDate)
                : undefined,
            };
          case ServiceCategory.ONETIME_MULTIDAY:
            return {
              ...base,
              dayOfWeek: dayOfWeek as string[],
              serviceCategory: ServiceCategory.ONETIME_MULTIDAY,
              serviceType: ServiceType.SPECIAL,
              startDate: service.startDate
                ? new Date(service.startDate)
                : undefined,
              endDate: service.endDate ? new Date(service.endDate) : undefined,
              cycle: service.cycle ?? undefined,
              frequency: service.frequency || Frequency.WEEKLY,
            };
          case ServiceCategory.FREQUENT_MULTIDAY:
            return {
              ...base,
              dayOfWeek: dayOfWeek as string[],
              serviceCategory: ServiceCategory.FREQUENT_MULTIDAY,
              serviceType: ServiceType.SPECIAL,
              startDate: service.startDate
                ? new Date(service.startDate)
                : undefined,
              cycle: service.cycle ?? undefined,
              frequency: service.frequency || Frequency.WEEKLY,
              ordinal: service.ordinal || Ordinal.NEXT,
            };
        }
      }

      // Default values for new services
      const base = {
        name: "",
        time: "",
        isActive: true,
      };

      switch (category) {
        case ServiceCategory.RECURRING:
          return {
            ...base,
            dayOfWeek: "",
            serviceCategory: ServiceCategory.RECURRING,
            serviceType: ServiceType.REGULAR,
            frequency: Frequency.WEEKLY,
            ordinal: Ordinal.NEXT,
            startDate: undefined,
          };
        case ServiceCategory.ONETIME_ONEDAY:
          return {
            ...base,
            dayOfWeek: "",
            serviceCategory: ServiceCategory.ONETIME_ONEDAY,
            serviceType: ServiceType.SPECIAL,
            startDate: undefined,
          };
        case ServiceCategory.ONETIME_MULTIDAY:
          return {
            ...base,
            dayOfWeek: [],
            serviceCategory: ServiceCategory.ONETIME_MULTIDAY,
            serviceType: ServiceType.SPECIAL,
            startDate: undefined,
            endDate: undefined,
            cycle: undefined,
            frequency: Frequency.WEEKLY,
          };
        case ServiceCategory.FREQUENT_MULTIDAY:
          return {
            ...base,
            dayOfWeek: [],
            serviceCategory: ServiceCategory.FREQUENT_MULTIDAY,
            serviceType: ServiceType.SPECIAL,
            startDate: undefined,
            cycle: 1,
            frequency: Frequency.WEEKLY,
            ordinal: Ordinal.NEXT,
          };
      }
    },
    []
  );

  // Single form with dynamic resolver
  const form = useForm<FormSchema>({
    resolver: async (values, context, options) => {
      const currentSchema = schemaMap[activeTab];
      return zodResolver(currentSchema)(values, context, options);
    },
    defaultValues: getDefaultValues(activeTab, editingService || undefined),
  });

  // Update form resolver and values when tab changes
  useEffect(() => {
    if (!editingService) {
      form.reset(getDefaultValues(activeTab));
    }
  }, [activeTab, form, getDefaultValues, editingService]);

  const resetForm = useCallback(() => {
    form.reset(getDefaultValues(activeTab));
    setEditingService(null);
    setShowForm(false);
  }, [form, activeTab, getDefaultValues]);

  // Reset form when tab changes
  useEffect(() => {
    if (editingService) {
      // const values = getDefaultValues(activeTab, editingService || undefined);
      const values = getDefaultValues(
        editingService.serviceCategory,
        editingService
      );
      form.reset(values);
    }
  }, [editingService, form, getDefaultValues]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ServiceCategory);
  }, []);

  const fetchServiceDays = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchServiceDays();
  }, [fetchServiceDays]);

  const handleSubmit = useCallback(
    async (values: FormSchema) => {
      setLoading(true);
      try {
        const currentSchema = schemaMap[values.serviceCategory];

        const validated = currentSchema.safeParse(values);

        if (!validated.success) {
          console.error(validated.error);
          toast.error("Invalid data in form");
          return;
        }

        const validatedData = validated.data;

        // Parse dayOfWeek - convert to array if it's a string, or parse strings to ints if array
        const dayOfWeek = Array.isArray(validatedData.dayOfWeek)
          ? validatedData.dayOfWeek
          : validatedData.dayOfWeek;

        const response = await fetch("/api/service-days", {
          method: editingService ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...validatedData,
            ...(editingService && { id: editingService.id }),
            dayOfWeek, // Send as array
            startDate: validatedData.startDate ? validatedData.startDate : null,
            endDate:
              "endDate" in validatedData && validatedData.endDate
                ? validatedData.endDate
                : null,
          }),
        });
        if (response.ok) {
          toast.success(
            `Service ${editingService ? "updated" : "created"} successfully`
          );
          resetForm();
          fetchServiceDays();
        } else {
          const errorResponse = await response.json();

          if (errorResponse.details?.properties) {
            for (const [, rawError] of Object.entries(
              errorResponse.details?.properties ?? {}
            )) {
              const errorData = rawError as PropertyError;
              if (
                Array.isArray(errorData.errors) &&
                errorData.errors.length > 0
              ) {
                toast.error(errorData.errors[0]);
              }
            }
          }
          toast.error(
            `Failed to ${editingService ? "update" : "create"} service`
          );
        }
      } catch (error) {
        console.error("Error submitting service:", error);
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    },
    [editingService, fetchServiceDays, resetForm, schemaMap]
  );

  const handleEdit = useCallback(
    (service: ServiceDay) => {
      setActiveTab(service.serviceCategory);
      setEditingService(service);
      setShowForm(true);

      // Force form reset after state updates
      setTimeout(() => {
        form.reset(getDefaultValues(service.serviceCategory, service));
      }, 0);
    },
    [form, getDefaultValues]
  );

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
        <Card className="flex">
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
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList>
                <TabsTrigger
                  value={ServiceCategory.RECURRING}
                  disabled={!!editingService}
                >
                  Regular
                </TabsTrigger>
                <TabsTrigger
                  value={ServiceCategory.ONETIME_ONEDAY}
                  disabled={!!editingService}
                >
                  One Day
                </TabsTrigger>
                <TabsTrigger
                  value={ServiceCategory.ONETIME_MULTIDAY}
                  disabled={!!editingService}
                >
                  Multi-Day
                </TabsTrigger>
                <TabsTrigger
                  value={ServiceCategory.FREQUENT_MULTIDAY}
                  disabled={!!editingService}
                >
                  Recurring Special
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <TabsContent value={ServiceCategory.RECURRING}>
                  <RecurringForm
                    form={form as UseFormReturn<RecurringSchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading}
                    isEditing={!!editingService}
                  />
                </TabsContent>
                <TabsContent value={ServiceCategory.ONETIME_ONEDAY}>
                  <OnetimeOneDayForm
                    form={form as UseFormReturn<OnetimeOneDaySchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading}
                    isEditing={!!editingService}
                  />
                </TabsContent>
                <TabsContent value={ServiceCategory.ONETIME_MULTIDAY}>
                  <OnetimeMultiDayForm
                    form={form as UseFormReturn<OnetimeMultiDaySchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading}
                    isEditing={!!editingService}
                  />
                </TabsContent>
                <TabsContent value={ServiceCategory.FREQUENT_MULTIDAY}>
                  <FrequentMultiDayForm
                    form={form as UseFormReturn<FrequentMultiDaySchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading}
                    isEditing={!!editingService}
                  />
                </TabsContent>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      {/* <Card>
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
                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
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
              <div className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedServices.map((service) => (
                    <div
                      key={service.id}
                      className="border rounded-lg p-4 hover:bg-gray-700"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <div className="flex items-center space-x-2 mt-1 text-sm">
                            <CalendarIcon className="h-4 w-4" />
                            {service.weekdays &&
                            service.weekdays.length === 1 ? (
                              <span>
                                {getDayName(service.weekdays[0].dayOfWeek)}
                              </span>
                            ) : (
                              <span>Multiple Service Days</span>
                            )}
                            <Clock className="h-4 w-4 ml-2" />
                            <span>{formatTime(service.time)}</span>
                          </div>
                        </div>
                        <div className="flex flex-row items-end space-x-1">
                          <ButtonGroup>
                            <Badge
                              className={getServiceTypeColor(
                                service.serviceType
                              )}
                            >
                              {service.serviceType.toLowerCase()}
                            </Badge>
                            <Badge
                              className={getServiceStatusColor(
                                service.isActive
                              )}
                            >
                              {service.isActive ? "active" : "inactive"}
                            </Badge>
                          </ButtonGroup>
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

                <CustomPagination
                  currentPage={currentPage}
                  totalItems={serviceDays.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                  itemName="services"
                />
              </div>
            )}
          </CardContent>
        </Card> */}
      <ServiceList
        serviceDays={serviceDays}
        loading={loading}
        onEdit={handleEdit}
        onDelete={fetchServiceDays}
        onShowForm={() => setShowForm(true)}
      />
    </div>
  );
};
