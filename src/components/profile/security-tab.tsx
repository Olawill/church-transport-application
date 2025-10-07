import { Shield } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

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
import { Switch } from "@/components/ui/switch";

import { UserProfile } from "@/components/profile/profile-management";
import { SecurityUpdateSchema } from "@/types/adminCreateNewUserSchema";

interface SecurityTabProps {
  securityForm: UseFormReturn<SecurityUpdateSchema>;
  profile: UserProfile | null;
  toggleUserSettings: (
    field:
      | "twoFactorEnabled"
      | "emailNotifications"
      | "smsNotifications"
      | "whatsAppNotifications",
    currentValue: boolean
  ) => Promise<void>;
  handleSecuritySubmit: (values: SecurityUpdateSchema) => Promise<void>;
}

export const SecurityTab = ({
  securityForm,
  profile,
  toggleUserSettings,
  handleSecuritySubmit,
}: SecurityTabProps) => {
  return (
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
              <p className="text-sm text-gray-600 dark:text-gray-400">
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
  );
};
