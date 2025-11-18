"use client";

import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  skipToken,
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Organization, OrganizationBranchInfo } from "@/generated/prisma";
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
} from "@/schemas/adminCreateNewUserSchema";

import { AddressesTab } from "@/features/profile/components/addresses-tab";
import { ChurchTab } from "@/features/profile/components/church-tab";
import { NotificationsTab } from "@/features/profile/components/notifications-tab";
import { ProfileManagementSkeleton } from "@/features/profile/components/profile-management-skeleton";
import { ProfileTab } from "@/features/profile/components/profile-tab";
import { SecurityTab } from "@/features/profile/components/security-tab";
import { GetUserAddress } from "@/features/user/types";
import { useProfileParams } from "../hooks/use-profile-params";

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

export type OrgInfo = Organization & {
  systemBranchInfos: OrganizationBranchInfo[];
};
export type BranchAddress = OrganizationBranchInfo;

export const ProfileManagement = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: session } = useSession();

  const [params, setParams] = useProfileParams();
  const { tab } = params;

  const [isProfileEditing, setIsProfileEditing] = useState(false);

  const [isAddressEditing, setIsAddressEditing] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<GetUserAddress | null>(
    null
  );

  const [imagePreview, setImagePreview] = useState<string>("");

  const [isEditingBranchAddress, setIsEditingBranchAddress] = useState(false);
  const [branchAddressDialogOpen, setBranchAddressDialogOpen] = useState(false);
  const [selectedBranchAddress, setSelectedBranchAddress] =
    useState<BranchAddress | null>(null);

  const isAdminOrOwner =
    session?.user?.role === "ADMIN" || session?.user?.role === "OWNER";

  const { data: profile } = useSuspenseQuery(
    trpc.userProfile.getUserProfile.queryOptions()
  );
  const { data: addresses, isLoading: loading } = useSuspenseQuery(
    trpc.userAddresses.getUserAddresses.queryOptions()
  );

  const { data: organization, isLoading: organizationLoading } = useQuery(
    trpc.organization.getOrganizationData.queryOptions(
      isAdminOrOwner ? {} : skipToken
    )
  );

  const [DeleteAddressDialog, confirmDeleteAddress] = useConfirm(
    "Delete Address",
    "Are you sure you want to delete this address? This action is irreversible.",
    false
  );

  const profileForm = useForm({
    resolver: zodResolver(profileUpdateSchema),
    values: {
      name: profile?.name || "",
      userName: profile?.username || "",
      email: profile?.email || "",
      phoneNumber: profile?.phoneNumber || "",
      whatsappNumber: profile?.whatsappNumber || "",
      image: profile?.image || "",
    },
    defaultValues: {
      name: profile?.name || "",
      userName: profile?.username || "",
      email: profile?.email || "",
      phoneNumber: profile?.phoneNumber || "",
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
      street: selectedBranchAddress?.street || "",
      city: selectedBranchAddress?.city || "",
      province: selectedBranchAddress?.province || "",
      postalCode: selectedBranchAddress?.postalCode || "",
      country: selectedBranchAddress?.country || "",
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

  // User profile mutation
  const updateUserProfile = useMutation(
    trpc.userProfile.updateUserProfile.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.userProfile.getUserProfile.queryOptions()
        );
        setIsProfileEditing(false);
        setImagePreview("");
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );

  // User address mutations
  const addUserAddress = useMutation(
    trpc.userAddresses.createUserAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.userAddresses.getUserAddresses.queryOptions()
        );
        setAddressDialogOpen(false);
        addressForm.reset();
        toast.success("Address added successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add address");
      },
    })
  );

  const updateUserAddress = useMutation(
    trpc.userAddress.updateUserAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.userAddresses.getUserAddresses.queryOptions()
        );
        setAddressDialogOpen(false);
        setEditingAddress(null);
        addressForm.reset();
        toast.success("Address updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update address");
      },
    })
  );

  const deleteUserAddress = useMutation(
    trpc.userAddress.deleteUserAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.userAddresses.getUserAddresses.queryOptions()
        );

        toast.success("Address deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete address");
      },
    })
  );

  const setDefaultUserAddress = useMutation(
    trpc.userAddress.setDefaultAddress.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.userAddresses.getUserAddresses.queryOptions()
        );

        toast.success("Default address updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to set default address");
      },
    })
  );

  // Organization address mutations
  const addBranchAddress = useMutation(
    trpc.organization.addBranch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.organization.getOrganizationData.queryOptions({})
        );
        setBranchAddressDialogOpen(false);
        churchContactInfoForm.reset();
        toast.success("Branch Added Successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to add branch");
      },
    })
  );

  const updateBranchAddress = useMutation(
    trpc.organization.updateBranch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.organization.getOrganizationData.queryOptions({})
        );
        setBranchAddressDialogOpen(false);
        setSelectedBranchAddress(null);
        churchContactInfoForm.reset();
        toast.success("Branch information updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update branch information");
      },
    })
  );

  const setOrganizationHeadquarter = useMutation(
    trpc.organization.setHeadquarter.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.organization.getOrganizationData.queryOptions({})
        );
        setSelectedBranchAddress(null);
        toast.success("Headquarter address set");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to set headquarters");
      },
    })
  );

  const deleteBranchAddress = useMutation(
    trpc.organization.deleteBranch.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.organization.getOrganizationData.queryOptions({})
        );
        setSelectedBranchAddress(null);
        toast.success("Branch deleted successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete branch");
      },
    })
  );

  // User address handlers
  const handleProfileUpdate = async (values: ProfileUpdateSchema) => {
    const validatedFields = profileUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please correct the errors in the form");
      return;
    }

    await updateUserProfile.mutateAsync(validatedFields.data);
  };

  const handleAddAddress = async (values: AddressUpdateSchema) => {
    const validatedFields = addressUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    await addUserAddress.mutateAsync(validatedFields.data);
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

    await updateUserAddress.mutateAsync({
      ...validatedFields.data,
      id: editingAddress.id,
    });
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    await setDefaultUserAddress.mutateAsync({ id: addressId });
  };

  const handleDeleteAddress = async (addressId: string) => {
    const result = await confirmDeleteAddress();

    if (result !== "confirm") return;

    await deleteUserAddress.mutateAsync({ id: addressId });
  };

  // Organization address handlers
  const handleAddBranchAddress = async (
    values: ChurchBranchContactInfoUpdateSchema
  ) => {
    const validatedFields =
      churchBranchContactInfoUpdateSchema.safeParse(values);

    if (!validatedFields.success) {
      toast.error("Please fill in all required fields");
      return;
    }

    await addBranchAddress.mutateAsync({
      ...validatedFields.data,
    });
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

    await updateBranchAddress.mutateAsync({
      addressId: selectedBranchAddress.id,
      organizationId: selectedBranchAddress.organizationId,
      values: {
        ...validatedFields.data,
      },
    });
  };

  const handleSetHeadquarterAddress = async (addressId: string) => {
    await setOrganizationHeadquarter.mutateAsync({
      addressId,
      organizationId: selectedBranchAddress?.organizationId,
    });
  };

  const handleDeleteBranchAddress = async (addressId: string) => {
    const result = await confirmDeleteAddress();

    if (result !== "confirm") return;

    await deleteBranchAddress.mutateAsync({
      addressId,
      organizationId: selectedBranchAddress?.organizationId as string,
    });
  };

  // Handlers to open form and dialogs
  const handleAddressEdit = (address: GetUserAddress) => {
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
      street: address.street,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
      country: address.country,
      churchPhone: address.churchPhone,
      requestCutOffInHrs: address.requestCutOffInHrs,
      defaultMaxDistance:
        address.defaultMaxDistance as ChurchBranchContactInfoUpdateSchema["defaultMaxDistance"],
    });
  };

  // Security tab handlers
  const handleChangePassword = async (values: SecurityUpdateSchema) => {
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

      // setProfile((prev) => (prev ? { ...prev, [field]: data[field] } : prev));

      toast.success(
        `${field} ${!currentValue ? "enabled" : "disabled"} successfully`
      );
    } catch (error) {
      console.error(`Failed to toggle ${field}:`, error);
      toast.error(`Failed to toggle ${field}`);
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

  const isLoading =
    updateUserProfile.isPending ||
    addUserAddress.isPending ||
    updateUserAddress.isPending ||
    deleteUserAddress.isPending ||
    setDefaultUserAddress.isPending ||
    addBranchAddress.isPending ||
    updateBranchAddress.isPending ||
    deleteBranchAddress.isPending ||
    setOrganizationHeadquarter.isPending;

  if (loading)
    return <ProfileManagementSkeleton isAdminOrOwner={isAdminOrOwner} />;

  return (
    <>
      <DeleteAddressDialog />

      <div className="w-full p-6 space-y-6">
        <h1 className="text-3xl font-bold">Profile Management</h1>

        <Tabs
          className="w-full"
          defaultValue={tab}
          value={tab}
          onValueChange={(value) => {
            setParams({ ...params, tab: value });
          }}
        >
          <TabsList
            className={cn(
              "grid w-full grid-cols-4 [&_button]:data-[state=active]:shadow-none",
              isAdminOrOwner && "grid-cols-5"
            )}
          >
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isAdminOrOwner && (
              <TabsTrigger value="church">Church Settings</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile">
            <ProfileTab
              isProfileEditing={isProfileEditing}
              isLoading={isLoading}
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
              loading={isLoading}
            />
          </TabsContent>

          <TabsContent value="security">
            <SecurityTab
              securityForm={securityForm}
              profile={profile}
              toggleUserSettings={toggleUserSettings}
              handleChangePassword={handleChangePassword}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab
              profile={profile}
              toggleUserSettings={toggleUserSettings}
            />
          </TabsContent>

          {isAdminOrOwner && (
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
                loading={organizationLoading || isLoading}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
};
