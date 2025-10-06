"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import CustomPhoneInput from "@/components/custom-phone-input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "../ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import { Edit, MapPin, Plus, Shield, Star, Trash2, Upload } from "lucide-react";
import { FaSms, FaWhatsappSquare } from "react-icons/fa";
import { MdMarkEmailUnread } from "react-icons/md";

import { cn } from "@/lib/utils";

import {
  AddressUpdateSchema,
  addressUpdateSchema,
  ProfileUpdateSchema,
  profileUpdateSchema,
  SecurityUpdateSchema,
  securityUpdateSchema,
} from "@/types/newUserSchema";
import { PROVINCES } from "@/lib/types";

interface Address {
  id: string;
  name: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isActive: boolean;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  username?: string;
  image?: string;
  whatsappNumber?: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  whatsAppNotifications: boolean;
  smsNotifications: boolean;
  emailVerified?: Date;
  phoneVerified?: Date;
}

export const ProfileManagement = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    values: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      userName: profile?.username || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      whatsappNumber: profile?.whatsappNumber || "",
      image: profile?.image || "",
    },
    defaultValues: {
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      userName: profile?.username || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      whatsappNumber: profile?.whatsappNumber || "",
      image: profile?.image || "",
    },
  });

  const addressForm = useForm({
    resolver: zodResolver(addressUpdateSchema),
    values: {
      name: editingAddress?.name || "",
      street: editingAddress?.street || "",
      city: editingAddress?.city || "",
      province: editingAddress?.province || "",
      postalCode: editingAddress?.postalCode || "",
      country: editingAddress?.country || "Canada",
    },
  });

  const securityForm = useForm({
    resolver: zodResolver(securityUpdateSchema),
    values: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
      fetchAddresses();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile");
    }
  };

  const fetchAddresses = async () => {
    try {
      const response = await fetch("/api/user/addresses");
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching address:", error);
      toast.error("Failed to fetch addresses");
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (values: ProfileUpdateSchema) => {
    const validatedFields = profileUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please correct the errors in the form");
    }
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(validatedFields.data),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsProfileEditing(false);
        setImagePreview("");
        toast.success("Profile updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleAddAddress = async (values: AddressUpdateSchema) => {
    const validatedFields = addressUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/user/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedFields.data),
      });

      if (response.ok) {
        await fetchAddresses();
        setAddressDialogOpen(false);
        addressForm.reset();
        toast.success("Address added successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add address");
      }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
    }
  };

  const handleUpdateAddress = async (values: AddressUpdateSchema) => {
    if (!editingAddress) {
      toast.error("No address selected for editing");
      return;
    }

    const validatedFields = addressUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please correct the errors in the form");
      return;
    }

    try {
      const response = await fetch(`/api/user/addresses/${editingAddress.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedFields.data),
      });

      if (response.ok) {
        await fetchAddresses();
        setAddressDialogOpen(false);
        setEditingAddress(null);
        addressForm.reset();
        toast.success("Address updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update address");
      }
    } catch (error) {
      console.error("Error updating address:", error);
      toast.error("Failed to update address");
    }
  };

  const handleAddressEdit = (address: Address) => {
    setEditingAddress(address);
    setIsAddressEditing(true);
    setAddressDialogOpen(true);
    addressForm.reset({
      name: address.name,
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
    });
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const response = await fetch(
        `/api/user/addresses/${addressId}/set-default`,
        {
          method: "PUT",
        }
      );

      if (response.ok) {
        await fetchAddresses();
        toast.success("Default address updated");
      }
    } catch (error) {
      console.error("Failed to set default address:", error);
      toast.error("Failed to set default address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
      try {
        const response = await fetch(`/api/user/addresses/${addressId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          await fetchAddresses();
          toast.success("Address deleted");
        }
      } catch (error) {
        console.error("Failed to delete address:", error);
        toast.error("Failed to delete address");
      }
    }
  };

  const handleSecuritySubmit = async (values: SecurityUpdateSchema) => {
    const validatedFields = securityUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please correct the errors in the form");
      return;
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: validatedFields?.data?.currentPassword,
          newPassword: validatedFields?.data?.newPassword,
        }),
      });

      if (response.ok) {
        securityForm.reset();
        toast.success("Password updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleUserSettings = async (
    field:
      | "twoFactorEnabled"
      | "emailNotifications"
      | "smsNotifications"
      | "whatsAppNotifications",
    currentValue: boolean
  ) => {
    try {
      const response = await fetch("/api/user/toggle-setting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, value: !currentValue }),
      });

      if (!response.ok) throw new Error("Failed to update setting");

      const data = await response.json();

      setProfile((prev) => (prev ? { ...prev, [field]: data[field] } : prev));

      toast.success(
        `${field} ${!currentValue ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      console.error(`Failed to toggle ${field}:`, error);
      toast.error(`Failed to toggle ${field}`);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Profile Management</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Profile Information
                <Button
                  variant={isProfileEditing ? "outline" : "default"}
                  onClick={() => setIsProfileEditing(!isProfileEditing)}
                >
                  {isProfileEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Form */}
              <Form {...profileForm}>
                <form
                  className="space-y-6"
                  onSubmit={profileForm.handleSubmit(handleProfileUpdate)}
                >
                  {/* Profile Picture */}
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-24 h-24">
                      <AvatarImage
                        src={imagePreview || profile?.image}
                        alt={`${profile?.firstName} ${profile?.lastName}`}
                      />
                      <AvatarFallback className="text-xl">
                        {profile?.firstName?.[0]}
                        {profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    {isProfileEditing && (
                      <FormField
                        control={profileForm.control}
                        name="image"
                        render={({ field }) => (
                          <FormItem className="space-y-2">
                            <FormLabel className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                              <Upload className="w-4 h-4" />
                              <span>Upload Photo</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Firstname */}
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              name="firstName"
                              onChange={(e) => field.onChange(e)}
                              disabled={!isProfileEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Last Name */}
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="text"
                              name="lastName"
                              onChange={(e) => field.onChange(e)}
                              disabled={!isProfileEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Username */}
                    <FormField
                      control={profileForm.control}
                      name="userName"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              type="text"
                              name="userName"
                              placeholder="Choose a unique username"
                              onChange={(e) => field.onChange(e)}
                              disabled={!isProfileEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              name="email"
                              onChange={(e) => field.onChange(e)}
                              disabled={!isProfileEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone Number */}
                    <FormField
                      control={profileForm.control}
                      name="phone"
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
                              disabled={!isProfileEditing}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* WhatsApp Number */}
                    <FormField
                      control={profileForm.control}
                      name="whatsappNumber"
                      render={({ field, fieldState }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>WhatsApp Number</FormLabel>
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {isProfileEditing && (
                    <Button type="submit" className="w-full">
                      Save Changes
                    </Button>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                My Addresses
                <Dialog
                  open={addressDialogOpen}
                  onOpenChange={setAddressDialogOpen}
                >
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
                      <DialogDescription className="sr-only">
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
                              <FormLabel>Address Name</FormLabel>
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
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Street Address */}
                        <FormField
                          control={addressForm.control}
                          name="street"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="text"
                                  name="street"
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
                            control={addressForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    name="city"
                                    onChange={(e) => field.onChange(e)}
                                    placeholder="Toronto"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          {/* Province */}
                          <FormField
                            control={addressForm.control}
                            name="province"
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
                                        <SelectItem
                                          value={province}
                                          key={province}
                                        >
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
                            control={addressForm.control}
                            name="postalCode"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    name="postalCode"
                                    placeholder="M5H 2N2"
                                    disabled={loading}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value.toUpperCase()
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Country */}
                          <FormField
                            control={addressForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="text"
                                    name="country"
                                    placeholder="Canada"
                                    disabled={loading}
                                    onChange={(e) => field.onChange(e)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
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
                {addresses.map((address) => (
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
                        <p>
                          {address.street}
                          <br />
                          {address.city}, {address.province}{" "}
                          {address.postalCode}
                          <br />
                          {address.country}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!address.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleAddressEdit(address);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteAddress(address.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No addresses added yet</p>
                    <p className="text-sm">
                      Add your first address to get started
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Two-Factor Authentication
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {profile?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch
                    checked={profile?.twoFactorEnabled || false}
                    onCheckedChange={(checked) =>
                      toggleUserSettings("twoFactorEnabled", !checked)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Password Form */}
                <Form {...securityForm}>
                  <form
                    className="space-y-4"
                    onSubmit={securityForm.handleSubmit(handleSecuritySubmit)}
                  >
                    {/* Current Password */}
                    <FormField
                      control={securityForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              name="currentPassword"
                              onChange={(e) => field.onChange(e)}
                              placeholder="Enter Current Password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* New Password */}
                    <FormField
                      control={securityForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              name="newPassword"
                              onChange={(e) => field.onChange(e)}
                              placeholder="Enter New Password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm New Password */}
                    <FormField
                      control={securityForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              name="confirmPassword"
                              onChange={(e) => field.onChange(e)}
                              placeholder="Confirm New password"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Update Button */}
                    <Button type="submit" className="w-full">
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Notification Form */}
              <div className="space-y-6">
                {/* Email Notification */}
                <div className="flex items-start justify-between">
                  <div>
                    <Label>
                      <MdMarkEmailUnread />
                      Email Notification
                    </Label>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      You need to verify your email to receive email
                      notifications
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={cn(
                        profile?.emailNotifications && "bg-green-500"
                      )}
                      variant={
                        profile?.emailNotifications ? "secondary" : "default"
                      }
                    >
                      {profile?.emailNotifications ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={profile?.emailNotifications}
                      onCheckedChange={(checked) => {
                        toggleUserSettings("emailNotifications", !checked);
                      }}
                      disabled={!profile?.emailVerified}
                    />
                  </div>
                </div>

                {/* SMS Notification */}
                <div className="flex items-start justify-between">
                  <div>
                    <Label>
                      <FaSms />
                      SMS Notification
                    </Label>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      You need to verify your phone number to receive sms
                      notifications
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={cn(
                        profile?.smsNotifications && "bg-green-500"
                      )}
                      variant={
                        profile?.smsNotifications ? "secondary" : "default"
                      }
                    >
                      {profile?.smsNotifications ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={profile?.smsNotifications}
                      onCheckedChange={(checked) => {
                        toggleUserSettings("smsNotifications", !checked);
                      }}
                      disabled={!profile?.phoneVerified}
                    />
                  </div>
                </div>

                {/* whatsApp Notification */}
                <div className="flex items-start justify-between">
                  <div>
                    <Label>
                      <FaWhatsappSquare />
                      whatsApp Notification
                    </Label>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      You need whatsApp number to receive whatsApp notifications
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={cn(
                        profile?.whatsAppNotifications && "bg-green-500"
                      )}
                      variant={
                        profile?.whatsAppNotifications ? "secondary" : "default"
                      }
                    >
                      {profile?.whatsAppNotifications ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={profile?.whatsAppNotifications}
                      onCheckedChange={(checked) => {
                        toggleUserSettings("whatsAppNotifications", !checked);
                      }}
                      disabled={!profile?.whatsappNumber}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
