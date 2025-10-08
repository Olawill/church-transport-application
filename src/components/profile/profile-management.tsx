"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { cn } from "@/lib/utils";

import { getOrgInfo } from "@/actions/getOrgInfo";
import { useConfirm } from "@/hooks/use-confirm";
import {
  AddressUpdateSchema,
  addressUpdateSchema,
  churchBranchContactInfoUpdateSchema,
  ChurchBranchContactInfoUpdateSchema,
  ProfileUpdateSchema,
  profileUpdateSchema,
  SecurityUpdateSchema,
  securityUpdateSchema,
} from "@/types/adminCreateNewUserSchema";
import { SystemBranchInfo, SystemConfig } from "../../generated/prisma";

import { AddressesTab } from "@/components/profile/addresses-tab";
import { ChurchTab } from "@/components/profile/church-tab";
import { NotificationsTab } from "@/components/profile/notifications-tab";
import { ProfileTab } from "@/components/profile/profile-tab";
import { SecurityTab } from "@/components/profile/security-tab";
import { ProfileManagementSkeleton } from "./profile-management-skeleton";

export interface Address {
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

export interface UserProfile {
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

export type OrgInfo = SystemConfig & { systemBranchInfos: SystemBranchInfo[] };
export type BranchAddress = SystemBranchInfo;

export const ProfileManagement = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<OrgInfo | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProfileEditing, setIsProfileEditing] = useState(false);

  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const [imagePreview, setImagePreview] = useState<string>("");

  const [isEditingBranchAddress, setIsEditingBranchAddress] = useState(false);
  const [branchAddressDialogOpen, setBranchAddressDialogOpen] = useState(false);
  const [selectedBranchAddress, setSelectedBranchAddress] =
    useState<BranchAddress | null>(null);

  const isAdmin = session?.user.role === "ADMIN";

  const [DeleteAddressDialog, confirmDeleteAddress] = useConfirm(
    "Delete Address",
    "Are you sure you want to delete this address? This is irreversible.",
    true
  );

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

  const churchContactInfoForm = useForm<ChurchBranchContactInfoUpdateSchema>({
    resolver: zodResolver(churchBranchContactInfoUpdateSchema),
    values: {
      branchName: selectedBranchAddress?.branchName || "",
      branchCategory: selectedBranchAddress?.branchCategory || "BRANCH",
      churchAddress: selectedBranchAddress?.churchAddress || "",
      churchCity: selectedBranchAddress?.churchCity || "",
      churchProvince: selectedBranchAddress?.churchProvince || "",
      churchPostalCode: selectedBranchAddress?.churchPostalCode || "",
      churchCountry: selectedBranchAddress?.churchCountry || "",
      churchPhone: selectedBranchAddress?.churchPhone || "",
      requestCutOffInHrs: selectedBranchAddress?.requestCutOffInHrs || "",
      defaultMaxDistance:
        (selectedBranchAddress?.defaultMaxDistance as ChurchBranchContactInfoUpdateSchema["defaultMaxDistance"]) ||
        "10",
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

    if (session?.user.role === "ADMIN") {
      fetchOrganization();
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

  const fetchOrganization = async () => {
    try {
      const response = await getOrgInfo();

      if (!response.success || !response.organization) {
        toast.error(response.error || "Organization not found");
        return;
      }

      const data = response.organization;
      setOrganization(data);
    } catch (error) {
      console.error("Error fetching organization info:", error);
      toast.error("Failed to fetch organization info");
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

  const handleAddBranchAddress = async (
    values: ChurchBranchContactInfoUpdateSchema
  ) => {
    const validatedFields =
      churchBranchContactInfoUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // const response = await fetch("/api/user/addresses", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(validatedFields.data),
      // });

      // if (response.ok) {
      //   await fetchAddresses();
      //   setAddressDialogOpen(false);
      //   addressForm.reset();
      //   toast.success("Address added successfully");
      console.log("Add branch address");
      // } else {
      //   const error = await response.json();
      //   toast.error(error.message || "Failed to add address");
      // }
    } catch (error) {
      console.error("Error adding address:", error);
      toast.error("Failed to add address");
    }
  };

  const handleUpdateBranchAddress = async (
    values: ChurchBranchContactInfoUpdateSchema
  ) => {
    if (!selectedBranchAddress) {
      toast.error("No address selected for editing");
      return;
    }

    const validatedFields =
      churchBranchContactInfoUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please correct the errors in the form");
      return;
    }

    try {
      // const response = await fetch(`/api/user/addresses/${selectedBranchAddress.id}`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(validatedFields.data),
      // });

      // if (response.ok) {
      //   await fetchAddresses();
      //   setAddressDialogOpen(false);
      //   setEditingAddress(null);
      //   addressForm.reset();
      //   toast.success("Address updated successfully");
      // } else {
      //   const error = await response.json();
      //   toast.error(error.message || "Failed to update address");
      // }
      console.log("Updating address");
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

  const handleBranchAddressEdit = (address: BranchAddress) => {
    setSelectedBranchAddress(address);
    setIsEditingBranchAddress(true);
    setBranchAddressDialogOpen(true);
    churchContactInfoForm.reset({
      branchName: address.branchName,
      branchCategory: address.branchCategory,
      churchAddress: address.churchAddress,
      churchCity: address.churchCity,
      churchProvince: address.churchProvince,
      churchPostalCode: address.churchPostalCode,
      churchCountry: address.churchCountry,
      churchPhone: address.churchPhone,
      requestCutOffInHrs: address.requestCutOffInHrs,
      defaultMaxDistance:
        address.defaultMaxDistance as ChurchBranchContactInfoUpdateSchema["defaultMaxDistance"],
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

  const handleSetHeadquarterAddress = async (addressId: string) => {
    try {
      // const response = await fetch(
      //   `/api/user/addresses/${addressId}/set-default`,
      //   {
      //     method: "PUT",
      //   }
      // );

      // if (response.ok) {
      //   await fetchAddresses();
      //   toast.success("Default address updated");
      // }
      console.log(`Setting ${addressId} as headquarter`);
    } catch (error) {
      console.error("Failed to set default address:", error);
      toast.error("Failed to set default address");
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const ok = await confirmDeleteAddress();

    if (!ok) return;

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
  };

  const handleDeleteBranchAddress = async (addressId: string) => {
    const ok = await confirmDeleteAddress();

    if (!ok) return;

    try {
      // const response = await fetch(`/api/user/addresses/${addressId}`, {
      //   method: "DELETE",
      // });

      // if (response.ok) {
      //   await fetchAddresses();
      //   toast.success("Address deleted");
      // }
      console.log(`Deleting branch information for ${addressId}`);
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast.error("Failed to delete address");
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

  if (loading) return <ProfileManagementSkeleton isAdmin={isAdmin} />;

  return (
    <>
      <DeleteAddressDialog />

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">Profile Management</h1>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList
            className={cn(
              "grid w-full grid-cols-4",
              session?.user.role === "ADMIN" && "grid-cols-5"
            )}
          >
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {session?.user.role === "ADMIN" && (
              <TabsTrigger value="church">Church Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab
              isProfileEditing={isProfileEditing}
              setIsProfileEditing={setIsProfileEditing}
              profileForm={profileForm}
              handleProfileUpdate={handleProfileUpdate}
              profile={profile}
              imagePreview={imagePreview}
              handleImageChange={handleImageChange}
            />
          </TabsContent>

          <TabsContent value="addresses">
            <AddressesTab
              isAddressEditing={isAddressEditing}
              addressDialogOpen={addressDialogOpen}
              setAddressDialogOpen={setAddressDialogOpen}
              editingAddress={editingAddress}
              setEditingAddress={setEditingAddress}
              setIsAddressEditing={setIsAddressEditing}
              addressForm={addressForm}
              handleUpdateAddress={handleUpdateAddress}
              handleAddAddress={handleAddAddress}
              handleAddressEdit={handleAddressEdit}
              handleDeleteAddress={handleDeleteAddress}
              handleSetDefaultAddress={handleSetDefaultAddress}
              addresses={addresses}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab
              securityForm={securityForm}
              profile={profile}
              toggleUserSettings={toggleUserSettings}
              handleSecuritySubmit={handleSecuritySubmit}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab
              profile={profile}
              toggleUserSettings={toggleUserSettings}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="church">
              <ChurchTab
                organization={organization}
                branchAddressDialogOpen={branchAddressDialogOpen}
                setBranchAddressDialogOpen={setBranchAddressDialogOpen}
                selectedBranchAddress={selectedBranchAddress}
                setSelectedBranchAddress={setSelectedBranchAddress}
                isEditingBranchAddress={isEditingBranchAddress}
                setIsEditingBranchAddress={setIsEditingBranchAddress}
                churchContactInfoForm={churchContactInfoForm}
                handleUpdateBranchAddress={handleUpdateBranchAddress}
                handleAddBranchAddress={handleAddBranchAddress}
                handleSetHeadquarterAddress={handleSetHeadquarterAddress}
                handleBranchAddressEdit={handleBranchAddressEdit}
                handleDeleteBranchAddress={handleDeleteBranchAddress}
                loading={loading}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};
