import { Upload } from "lucide-react";
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

import CustomPhoneInput from "@/components/custom-phone-input";
import { UserProfile } from "@/components/profile/profile-management";
import { ProfileUpdateSchema } from "@/types/adminCreateNewUserSchema";

interface ProfileTabProps {
  isProfileEditing: boolean;
  setIsProfileEditing: (val: boolean) => void;
  profileForm: UseFormReturn<ProfileUpdateSchema>;
  handleProfileUpdate: (val: ProfileUpdateSchema) => Promise<void>;
  profile: UserProfile | null;
  imagePreview: string;
  handleImageChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileTab = ({
  isProfileEditing,
  setIsProfileEditing,
  profileForm,
  handleProfileUpdate,
  profile,
  imagePreview,
  handleImageChange,
}: ProfileTabProps) => {
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
              {/* First name */}
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
                        disabled={!isProfileEditing}
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
  );
};
