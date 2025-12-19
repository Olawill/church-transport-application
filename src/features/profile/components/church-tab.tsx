import {
  Building2Icon,
  Edit,
  Loader2Icon,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";

import {
  CustomPagination,
  usePagination,
} from "@/components/custom-pagination";
import { CustomPhoneInput } from "@/components/custom-phone-input";

import { GetOrganizationData } from "@/features/organization/types";
import { ChurchBranchContactInfoUpdateSchema } from "@/schemas/adminCreateNewUserSchema";
import { BranchAddress } from "./profile-management";

import { CustomFormLabel } from "@/components/custom-form-label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { AddressFields } from "@/features/auth/components/signup-form";

interface ChurchTabProps {
  organization: GetOrganizationData | undefined;
  branchAddressDialogOpen: boolean;
  setBranchAddressDialogOpen: (val: boolean) => void;
  selectedBranchAddress: BranchAddress | null;
  setSelectedBranchAddress: (val: BranchAddress | null) => void;
  isEditingBranchAddress: boolean;
  setIsEditingBranchAddress: (val: boolean) => void;
  churchContactInfoForm: UseFormReturn<ChurchBranchContactInfoUpdateSchema>;
  handleUpdateBranchAddress: (
    values: ChurchBranchContactInfoUpdateSchema
  ) => Promise<void>;
  handleAddBranchAddress: (
    values: ChurchBranchContactInfoUpdateSchema
  ) => Promise<void>;
  handleSetHeadquarterAddress: (addressId: string) => Promise<void>;
  handleBranchAddressEdit: (address: BranchAddress) => void;
  handleDeleteBranchAddress: (addressId: string) => Promise<void>;
  loading: boolean;
}

export const ChurchTab = ({
  organization,
  branchAddressDialogOpen,
  setBranchAddressDialogOpen,
  selectedBranchAddress,
  setSelectedBranchAddress,
  isEditingBranchAddress,
  setIsEditingBranchAddress,
  churchContactInfoForm,
  handleUpdateBranchAddress,
  handleAddBranchAddress,
  handleSetHeadquarterAddress,
  handleBranchAddressEdit,
  handleDeleteBranchAddress,
  loading,
}: ChurchTabProps) => {
  const {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    paginateItems,
  } = usePagination(10);

  // Get paginated branches
  const paginatedBranches = paginateItems(
    organization?.organizationBranches ?? []
  );
  const totalBranches = (organization?.organizationBranches ?? []).length;

  useEffect(() => {
    if (totalBranches === 0) {
      return;
    }

    const totalPages =
      Math.ceil(totalBranches / itemsPerPage) === 0
        ? 1
        : Math.ceil(totalBranches / itemsPerPage);

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, itemsPerPage, totalBranches, setCurrentPage]);

  return (
    <div className="space-y-6">
      {/* Church Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2Icon className="w-5 h-5 mr-2" />
            <div className="flex items-center gap-2">
              {organization && (
                <>
                  <p className="font-medium">{organization?.churchName}</p>
                  {organization?.churchAcronym && (
                    <Badge className="text-sm text-gray-300 dark:text-gray-700">
                      {organization?.churchAcronym}
                    </Badge>
                  )}
                </>
              )}
              {!organization && <p>Your church info will be displayed here</p>}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start gap-2">
            <p className="font-medium">Branch Information</p>
            <p className="text-sm text-gray-600 dark:text-gray-200">
              You can edit your branch information as needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Church Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Branch Contact Information
            <Dialog
              open={branchAddressDialogOpen}
              onOpenChange={setBranchAddressDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setSelectedBranchAddress(null);
                    setIsEditingBranchAddress(!isEditingBranchAddress);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {isEditingBranchAddress && selectedBranchAddress
                      ? "Edit Church Address"
                      : "Add New Church Address"}
                  </DialogTitle>
                  <DialogDescription>
                    {isEditingBranchAddress && selectedBranchAddress
                      ? "Edit the details of your branch address"
                      : "Fill in the address details for your new branch"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...churchContactInfoForm}>
                  <form
                    className="space-y-4"
                    onSubmit={
                      isEditingBranchAddress && selectedBranchAddress
                        ? churchContactInfoForm.handleSubmit(
                            handleUpdateBranchAddress
                          )
                        : churchContactInfoForm.handleSubmit(
                            handleAddBranchAddress
                          )
                    }
                  >
                    {/* Branch Name & Type */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Branch Name */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="branchName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Branch Name</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="Branch Name"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e)}
                                placeholder="Our Calgary Location (optional)"
                                disabled={loading}
                              />
                            </FormControl>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      {/* Branch Type */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="branchCategory"
                        render={({ field }) => (
                          <FormItem>
                            <CustomFormLabel title="Category" />
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className="w-full"
                                  disabled={loading}
                                >
                                  <SelectValue placeholder="Select branch type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="HEADQUARTER">
                                  Headquarter
                                </SelectItem>
                                <SelectItem value="BRANCH">Branch</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Address Info */}
                    <AddressFields
                      form={churchContactInfoForm}
                      loading={loading}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      {/* Phone Number */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="churchPhone"
                        render={({ field, fieldState }) => (
                          <FormItem className="space-y-2">
                            <CustomFormLabel title="Phone Number" />
                            <FormControl>
                              <CustomPhoneInput
                                placeholder="(123) 456-7890"
                                defaultCountry="CA"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={fieldState.error}
                                disabled={loading}
                              />
                            </FormControl>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Cut-off Hours */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="requestCutOffInHrs"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <CustomFormLabel title="Cut-off Time (hrs)" />
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                name="requestCutOffInHrs"
                                onChange={field.onChange}
                                placeholder="Enter the number of hours before service request can be placed"
                                min={1}
                                disabled={loading}
                              />
                            </FormControl>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* Max Distance */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="defaultMaxDistance"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <CustomFormLabel title="Max Distance" />
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className="w-full"
                                  disabled={loading}
                                >
                                  <SelectValue placeholder="Select max distance for drivers" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="min-h-[1.25rem]">
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={
                        churchContactInfoForm.formState.isDirty || loading
                      }
                    >
                      {loading && (
                        <Loader2Icon className="size-4 animate-spin" />
                      )}
                      {selectedBranchAddress ? "Update Address" : "Add Address"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paginatedBranches.map((address) => (
              <div key={address.id} className="border rounded-lg px-2 py-4">
                <div className="flex flex-col md:flex-row gap-2 items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">
                        {address.branchName ?? `${address.city} Branch`}
                      </h3>
                      <Badge
                        variant={
                          address.branchCategory === "HEADQUARTER"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {address.branchCategory === "HEADQUARTER" && (
                          <Star className="w-3 h-3 mr-1" />
                        )}
                        {address.branchCategory === "HEADQUARTER"
                          ? "Headquarter"
                          : "Branch"}
                      </Badge>
                    </div>

                    <div className="flex items-start">
                      <MapPin className="size-4 mr-2 mt-1" />
                      <p className="text-xs">
                        <span className="font-semibold text-sm">Address</span>
                        <br />
                        {address.street}
                        <br />
                        {address.city}, {address.province} {address.postalCode}
                        <br />
                        {address.country}
                      </p>
                    </div>

                    <div className="flex items-start mt-2">
                      <Phone className="size-4 mr-2 mt-1" />
                      <p className="text-xs">
                        <span className="font-semibold text-sm">Phone</span>
                        <br />
                        {address.churchPhone}
                      </p>
                    </div>

                    <div className="flex flex-col md:flex-row items-start gap-2 mt-2">
                      <Badge variant="destructive" className="text-sm">
                        <span className="font-semibold italic">
                          Request Cut-off Hours:
                        </span>
                        <span className="font-bold">
                          {address.requestCutOffInHrs} hrs
                        </span>
                      </Badge>

                      <Badge
                        variant="outline"
                        className="text-sm bg-lime-700 text-white"
                      >
                        <span className="font-semibold italic">
                          Default Max Distance for Drivers:
                        </span>
                        <span className="font-bold">
                          {address.defaultMaxDistance} km
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center -ml-2">
                    {address.branchCategory === "BRANCH" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-4"
                            onClick={() => {
                              setSelectedBranchAddress(address);
                              handleSetHeadquarterAddress(address.id);
                            }}
                          >
                            Set Headquarter
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground">
                          Make Headquarter
                        </TooltipContent>
                      </Tooltip>
                    )}

                    <div className="flex items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              handleBranchAddressEdit(address);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground">
                          Edit Branch Address
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // address.branchCategory === "HEADQUARTER"
                              setSelectedBranchAddress(address);
                              handleDeleteBranchAddress(address.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-background text-foreground">
                          Delete Branch Address
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {totalBranches === 0 && (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No addresses added yet</p>
                <p className="text-sm">
                  Add your church&apos;s first address to get started
                </p>
              </div>
            )}

            <CustomPagination
              currentPage={currentPage}
              totalItems={totalBranches}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemName="branches"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
