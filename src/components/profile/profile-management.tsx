"use client";

import {
  Edit,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  emailVerified?: Date;
  phoneVerified?: Date;
}

export const ProfileManagement = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    whatsappNumber: "",
  });

  const [addressForm, setAddressForm] = useState({
    name: "",
    street: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Canada",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
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
        setProfileForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          username: data.username || "",
          phone: data.phone || "",
          whatsappNumber: data.whatsappNumber || "",
        });
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

  const handleProfileUpdate = async () => {
    try {
      const formData = new FormData();

      // Add profile data
      Object.entries(profileForm).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Add image if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        body: formData,
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        setImageFile(null);
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

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
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

  const handleAddressSubmit = async () => {
    try {
      const method = editingAddress ? "PUT" : "POST";
      const url = editingAddress
        ? `/api/user/addresses/${editingAddress.id}`
        : "/api/user/addresses";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addressForm),
      });

      if (response.ok) {
        await fetchAddresses();
        setAddressDialogOpen(false);
        setEditingAddress(null);
        setAddressForm({
          name: "",
          street: "",
          city: "",
          province: "",
          postalCode: "",
          country: "Canada",
        });
        toast.success(editingAddress ? "Address updated" : "Address added");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save address");
      }
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error("Failed to save address");
    }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggle2FA = async () => {
    try {
      const response = await fetch("/api/user/toggle-2fa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !profile?.twoFactorEnabled }),
      });

      if (response.ok) {
        setProfile((prev) =>
          prev ? { ...prev, twoFactorEnabled: !prev.twoFactorEnabled } : null
        );
        toast.success(
          `2FA ${profile?.twoFactorEnabled ? "disabled" : "enabled"}`
        );
      }
    } catch (error) {
      console.error("Failed to toggle 2FA:", error);
      toast.error("Failed to toggle 2FA");
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
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                {isEditing && (
                  <div>
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </div>
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                )}
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileForm.username}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="Choose a unique username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Input id="email" value={profile?.email || ""} disabled />
                    {profile?.emailVerified && (
                      <Badge variant="outline" className="text-green-600">
                        <Mail className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      placeholder="+1 (555) 123-4567"
                    />
                    {profile?.phoneVerified && (
                      <Badge variant="outline" className="text-green-600">
                        <Phone className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={profileForm.whatsappNumber}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        whatsappNumber: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {isEditing && (
                <Button onClick={handleProfileUpdate} className="w-full">
                  Save Changes
                </Button>
              )}
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
                        setAddressForm({
                          name: "",
                          street: "",
                          city: "",
                          province: "",
                          postalCode: "",
                          country: "Canada",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingAddress ? "Edit Address" : "Add New Address"}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        {editingAddress
                          ? "Edit the details of your address"
                          : "Fill in the details for your new address"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="addressName">Address Name</Label>
                        <Select
                          value={addressForm.name}
                          onValueChange={(value) =>
                            setAddressForm((prev) => ({ ...prev, name: value }))
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select address type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Home">Home</SelectItem>
                            <SelectItem value="Work">Work</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={addressForm.street}
                          onChange={(e) =>
                            setAddressForm((prev) => ({
                              ...prev,
                              street: e.target.value,
                            }))
                          }
                          placeholder="123 Main Street"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            value={addressForm.city}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                city: e.target.value,
                              }))
                            }
                            placeholder="Toronto"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="province">Province</Label>
                          <Input
                            id="province"
                            value={addressForm.province}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                province: e.target.value,
                              }))
                            }
                            placeholder="ON"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={addressForm.postalCode}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                postalCode: e.target.value,
                              }))
                            }
                            placeholder="M5H 2N2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={addressForm.country}
                            onChange={(e) =>
                              setAddressForm((prev) => ({
                                ...prev,
                                country: e.target.value,
                              }))
                            }
                            placeholder="Canada"
                          />
                        </div>
                      </div>
                      <Button onClick={handleAddressSubmit} className="w-full">
                        {editingAddress ? "Update Address" : "Add Address"}
                      </Button>
                    </div>
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
                            setEditingAddress(address);
                            setAddressForm({
                              name: address.name,
                              street: address.street,
                              city: address.city,
                              province: address.province,
                              postalCode: address.postalCode,
                              country: address.country,
                            });
                            setAddressDialogOpen(true);
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
                    onCheckedChange={toggle2FA}
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
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button onClick={handlePasswordUpdate} className="w-full">
                  Update Password
                </Button>
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
              <p className="text-gray-600">
                Notification preferences will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
