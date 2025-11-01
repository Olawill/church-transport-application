import { Edit, MapPin, Plus, Star, Trash2 } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

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
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CustomFormLabel } from "@/components/custom-form-label";
import {
  CustomPagination,
  usePagination,
} from "@/components/custom-pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AddressFields } from "@/features/auth/components/signup-form";
import { GetUserAddress } from "@/features/user/types";
import { AddressUpdateSchema } from "@/schemas/adminCreateNewUserSchema";

interface AddressesTabProps {
  isAddressEditing: boolean;
  addressDialogOpen: boolean;
  setAddressDialogOpen: (val: boolean) => void;
  editingAddress: GetUserAddress | null;
  setEditingAddress: (val: GetUserAddress | null) => void;
  setIsAddressEditing: (val: boolean) => void;
  addressForm: UseFormReturn<AddressUpdateSchema>;
  handleUpdateAddress: (values: AddressUpdateSchema) => Promise<void>;
  handleAddAddress: (values: AddressUpdateSchema) => Promise<void>;
  handleAddressEdit: (address: GetUserAddress) => void;
  handleDeleteAddress: (addressId: string) => Promise<void>;
  handleSetDefaultAddress: (addressId: string) => Promise<void>;
  addresses: GetUserAddress[];
  loading: boolean;
}

export const AddressesTab = ({
  isAddressEditing,
  addressDialogOpen,
  setAddressDialogOpen,
  editingAddress,
  setEditingAddress,
  setIsAddressEditing,
  addressForm,
  handleUpdateAddress,
  handleAddAddress,
  handleAddressEdit,
  handleDeleteAddress,
  handleSetDefaultAddress,
  addresses,
  loading,
}: AddressesTabProps) => {
  const {
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage,
    paginateItems,
  } = usePagination(10);

  // Get paginated addresses
  const paginatedAddresses = paginateItems(addresses);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          My Addresses
          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddressEditing(!isAddressEditing);
                }}
              >
                <Plus className="w-4 h-4" />
                Add Address
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isAddressEditing && editingAddress
                    ? "Edit Address"
                    : "Add New Address"}
                </DialogTitle>
                <DialogDescription>
                  {isAddressEditing && editingAddress
                    ? "Edit the details of your address"
                    : "Fill in the details for your new address"}
                </DialogDescription>
              </DialogHeader>
              <Form {...addressForm}>
                <form
                  className="space-y-4"
                  onSubmit={
                    isAddressEditing && editingAddress
                      ? addressForm.handleSubmit(handleUpdateAddress)
                      : addressForm.handleSubmit(handleAddAddress)
                  }
                >
                  {/* Address Name */}
                  <FormField
                    control={addressForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <CustomFormLabel title="Address Name" />
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select address type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="min-h-[1.25rem]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  {/* Address */}
                  <AddressFields form={addressForm} loading={loading} />

                  <Button type="submit" className="w-full">
                    {editingAddress ? "Update Address" : "Add Address"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {paginatedAddresses.map((address) => (
            <div key={address.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{address.name}</h3>
                    {address.isDefault && (
                      <Badge variant="default" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm">
                    {address.street}
                    <br />
                    {address.city}, {address.province} {address.postalCode}
                    <br />
                    {address.country}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!address.isDefault && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefaultAddress(address.id)}
                        >
                          Set Default
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-background text-foreground">
                        Set Address as Default
                      </TooltipContent>
                    </Tooltip>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleAddressEdit(address);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-background text-foreground">
                      Edit Address
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-background text-foreground">
                      Delete Address
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No addresses added yet</p>
              <p className="text-sm">Add your first address to get started</p>
            </div>
          )}

          <CustomPagination
            currentPage={currentPage}
            totalItems={addresses.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemName="addresses"
          />
        </div>
      </CardContent>
    </Card>
  );
};
