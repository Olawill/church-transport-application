import {
  Building2Icon,
  Edit,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";

import { PROVINCES } from "@/lib/types";
import CustomPhoneInput from "../custom-phone-input";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChurchBranchContactInfoUpdateSchema } from "@/types/adminCreateNewUserSchema";
import { CustomPagination, usePagination } from "../custom-pagination";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { BranchAddress, OrgInfo } from "./profile-management";

interface ChurchTabProps {
  organization: OrgInfo | null;
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
    organization?.systemBranchInfos ?? []
  );
  const totalBranches = (organization?.systemBranchInfos ?? []).length;

  return (
    <div className="space-y-6">
      {/* Church Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2Icon className="w-5 h-5 mr-2" />
            <div className="flex items-center gap-2">
              <p className="font-medium">{organization?.churchName}</p>
              {organization?.churchAcronym && (
                <Badge className="text-sm text-gray-600">
                  {organization?.churchAcronym}
                </Badge>
              )}
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
                      ? "Edit Address"
                      : "Add New Address"}
                  </DialogTitle>
                  <DialogDescription className="sr-only">
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Branch Type */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="branchCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Street Address */}
                    <FormField
                      control={churchContactInfoForm.control}
                      name="churchAddress"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Church Address</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              name="churchAddress"
                              onChange={(e) => field.onChange(e)}
                              placeholder="123 Main Street"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* City & Province */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* City */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="churchCity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="churchCity"
                                onChange={(e) => field.onChange(e)}
                                placeholder="Toronto"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {/* Province */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="churchProvince"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Province</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger
                                  disabled={loading}
                                  className="w-full"
                                >
                                  <SelectValue placeholder="Select province" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectGroup>
                                  <SelectLabel>Canada</SelectLabel>
                                  {PROVINCES.map((province) => (
                                    <SelectItem value={province} key={province}>
                                      {province}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Postal code  & Country */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Postal Code */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="churchPostalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="churchPostalCode"
                                placeholder="M5H 2N2"
                                disabled={loading}
                                onChange={(e) =>
                                  field.onChange(e.target.value.toUpperCase())
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Country */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="churchCountry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="text"
                                name="churchCountry"
                                placeholder="Canada"
                                onChange={(e) => field.onChange(e)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {/* Phone Number */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="churchPhone"
                        render={({ field, fieldState }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <CustomPhoneInput
                                placeholder="(123) 456-7890"
                                defaultCountry="CA"
                                value={field.value}
                                onChange={field.onChange}
                                onBlur={field.onBlur}
                                error={fieldState.error}
                                disabled={
                                  churchContactInfoForm.formState.isSubmitting
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Cut-off Hours */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="requestCutOffInHrs"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Cut-off Time (hrs)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                name="requestCutOffInHrs"
                                onChange={field.onChange}
                                placeholder="Enter the number of hours before service request can be placed"
                                min={1}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Max Distance */}
                      <FormField
                        control={churchContactInfoForm.control}
                        name="defaultMaxDistance"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel>Max Distance</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="submit" className="w-full">
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
                        {address.branchName ?? `${address.churchCity} Branch`}
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
                        {address.churchAddress}
                        <br />
                        {address.churchCity}, {address.churchProvince}{" "}
                        {address.churchPostalCode}
                        <br />
                        {address.churchCountry}
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

                      <Badge variant="outline" className="text-sm bg-lime-700">
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-4"
                        onClick={() => handleSetHeadquarterAddress(address.id)}
                      >
                        Set Headquarter
                      </Button>
                    )}

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        title="Edit Branch"
                        onClick={() => {
                          handleBranchAddressEdit(address);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Delete Branch"
                        onClick={() => {
                          // address.branchCategory === "HEADQUARTER"
                          handleDeleteBranchAddress(address.id);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
