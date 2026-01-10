"use client";

import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import {
  Frequency,
  Ordinal,
  ServiceCategory,
  ServiceType,
} from "@/generated/prisma/enums";
import {
  frequentMultiDaySchema,
  FrequentMultiDaySchema,
  onetimeMultiDaySchema,
  OnetimeMultiDaySchema,
  onetimeOneDaySchema,
  OnetimeOneDaySchema,
  recurringSchema,
  RecurringSchema,
} from "@/schemas/serviceDaySchema";

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

import {
  useServiceDayParams,
  useServiceFormParams,
} from "../hooks/use-serviceDay-params";
import { GetServiceType } from "../types";
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

export const ServiceManagement = ({ locale }: { locale: string }) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [editingService, setEditingService] = useState<GetServiceType | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<ServiceCategory>(
    ServiceCategory.RECURRING,
  );

  // Schema map for each tab
  const schemaMap = useMemo(
    () => ({
      [ServiceCategory.RECURRING]: recurringSchema,
      [ServiceCategory.ONETIME_ONEDAY]: onetimeOneDaySchema,
      [ServiceCategory.ONETIME_MULTIDAY]: onetimeMultiDaySchema,
      [ServiceCategory.FREQUENT_MULTIDAY]: frequentMultiDaySchema,
    }),
    [],
  );

  const [params] = useServiceDayParams();
  const [showFormParams, setShowForm] = useServiceFormParams();
  const { showForm } = showFormParams;
  const { page, pageSize, status } = params;

  const { data: serviceDaysData, isLoading: loading } = useSuspenseQuery(
    trpc.services.getPaginatedServices.queryOptions({
      status,
      page,
      pageSize,
    }),
  );

  // Default values map
  const getDefaultValues = useCallback(
    (category: ServiceCategory, service?: GetServiceType) => {
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
    [],
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
    setShowForm({ showForm: false });
  }, [form, activeTab, getDefaultValues]);

  // Reset form when tab changes
  useEffect(() => {
    if (editingService) {
      // const values = getDefaultValues(activeTab, editingService || undefined);
      const values = getDefaultValues(
        editingService.serviceCategory,
        editingService,
      );
      form.reset(values);
    }
  }, [editingService, form, getDefaultValues]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as ServiceCategory);
  }, []);

  // Logic to create, edit service
  const addService = useMutation(
    trpc.services.createService.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${data.name} created successfully!`);

        resetForm();

        queryClient.invalidateQueries(
          trpc.services.getPaginatedServices.queryOptions({}),
        );

        queryClient.invalidateQueries(
          trpc.services.getServices.queryOptions({}),
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to create service`);
      },
    }),
  );

  const editService = useMutation(
    trpc.services.updateService.mutationOptions({
      onSuccess: (data) => {
        toast.success(`${data.name} updated successfully!`);

        resetForm();

        queryClient.invalidateQueries(
          trpc.services.getPaginatedServices.queryOptions({}),
        );

        queryClient.invalidateQueries(
          trpc.services.getServices.queryOptions({}),
        );
      },
      onError: (error) => {
        toast.error(error.message || `Failed to update service`);
      },
    }),
  );

  const handleSubmit = useCallback(
    async (values: FormSchema) => {
      try {
        const currentSchema = schemaMap[values.serviceCategory];

        const validated = currentSchema.safeParse(values);

        if (!validated.success) {
          console.error(validated.error);
          toast.error("Invalid data in form");
          return;
        }

        const validatedData = validated.data;

        if (editingService) {
          await editService.mutateAsync({
            id: editingService.id,
            service: validatedData,
          });
        }

        if (!editingService) {
          await addService.mutateAsync(validatedData);
        }
      } catch (error) {
        console.error("Error submitting service:", error);
        toast.error("An error occurred");
      }
    },
    [editingService, resetForm, schemaMap],
  );

  const handleEdit = useCallback(
    (service: GetServiceType) => {
      setActiveTab(service.serviceCategory);
      setEditingService(service);
      setShowForm({ showForm: true });

      // Force form reset after state updates
      setTimeout(() => {
        form.reset(getDefaultValues(service.serviceCategory, service));
      }, 0);
    },
    [form, getDefaultValues],
  );

  const formLoading = addService.isPending || editService.isPending;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Service Management</h1>
          <p className="mt-1">
            Configure church service days and times for pickup requests
          </p>
        </div>
        <Button
          onClick={() => setShowForm({ showForm: true })}
          disabled={loading || !!editingService}
        >
          <Plus className="size-4" />
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
              <TabsList className="flex h-auto w-full flex-nowrap items-center justify-start overflow-x-auto sm:w-fit [&_button]:data-[state=active]:shadow-none">
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
                    loading={loading || formLoading}
                    service={editingService}
                  />
                </TabsContent>
                <TabsContent value={ServiceCategory.ONETIME_ONEDAY}>
                  <OnetimeOneDayForm
                    form={form as UseFormReturn<OnetimeOneDaySchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading || formLoading}
                    service={editingService}
                  />
                </TabsContent>
                <TabsContent value={ServiceCategory.ONETIME_MULTIDAY}>
                  <OnetimeMultiDayForm
                    form={form as UseFormReturn<OnetimeMultiDaySchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading || formLoading}
                    service={editingService}
                  />
                </TabsContent>
                <TabsContent value={ServiceCategory.FREQUENT_MULTIDAY}>
                  <FrequentMultiDayForm
                    form={form as UseFormReturn<FrequentMultiDaySchema>}
                    onSubmit={handleSubmit}
                    onCancel={resetForm}
                    loading={loading || formLoading}
                    service={editingService}
                  />
                </TabsContent>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Services List */}
      <ServiceList
        serviceDaysData={serviceDaysData}
        loading={loading}
        onEdit={handleEdit}
        // onDelete={fetchServiceDays}
        onShowForm={() => setShowForm({ showForm: true })}
        locale={locale}
      />
    </div>
  );
};
