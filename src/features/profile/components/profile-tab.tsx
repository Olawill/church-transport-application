import { Loader2Icon, Upload } from "lucide-react";
import { ChangeEvent } from "react";
import { UseFormReturn } from "react-hook-form";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { CustomFormLabel } from "@/components/custom-form-label";
import { CustomPhoneInput } from "@/components/custom-phone-input";
import { GetUserProfile } from "@/features/user/types";
import { ProfileUpdateSchema } from "@/schemas/adminCreateNewUserSchema";
import { useNavigationBlocker } from "@/components/contexts/navigation-blocker";

interface ProfileTabProps {
  isProfileEditing: boolean;
  isLoading: boolean;
  setIsProfileEditing: (val: boolean) => void;
  profileForm: UseFormReturn<ProfileUpdateSchema>;
  handleProfileUpdate: (val: ProfileUpdateSchema) => Promise<void>;
  profile: GetUserProfile | null;
  imagePreview: string;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileTab = ({
  isProfileEditing,
  setIsProfileEditing,
  isLoading,
  profileForm,
  handleProfileUpdate,
  profile,
  imagePreview,
  handleImageChange,
}: ProfileTabProps) => {
  const { setIsBlocked } = useNavigationBlocker();

  return (
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
            onChange={() => setIsBlocked(true)}
          >
            {/* Profile Picture */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-24 h-24">
                <AvatarImage
                  src={imagePreview ?? profile?.image ?? undefined}
                  alt={`${profile?.name}`}
                />
                <AvatarFallback className="text-xl">
                  {profile?.name.split(" ")[0][0]}
                  {profile?.name.split(" ")[1]?.[0]}
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
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First name */}
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <CustomFormLabel title="Name" />
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        name="Name"
                        onChange={(e) => field.onChange(e)}
                        disabled={!isProfileEditing || isLoading}
                      />
                    </FormControl>
                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
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
                        disabled={!isProfileEditing || isLoading}
                      />
                    </FormControl>
                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <CustomFormLabel title="Email" />
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        name="email"
                        onChange={(e) => field.onChange(e)}
                        disabled={!isProfileEditing || isLoading}
                      />
                    </FormControl>
                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              {/* Phone Number */}
              <FormField
                control={profileForm.control}
                name="phoneNumber"
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
                        disabled={!isProfileEditing || isLoading}
                      />
                    </FormControl>
                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
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
                        disabled={!isProfileEditing || isLoading}
                      />
                    </FormControl>
                    <div className="min-h-[1.25rem]">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            {isProfileEditing && (
              <Button
                type="submit"
                className="w-full"
                disabled={!profileForm.formState.isDirty || isLoading}
              >
                {isLoading && <Loader2Icon className="size-4 animate-spin" />}
                Save Changes
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
