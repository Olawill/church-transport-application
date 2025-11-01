import { cn } from "@/lib/utils";
import { FaSms, FaWhatsappSquare } from "react-icons/fa";
import { MdMarkEmailUnread } from "react-icons/md";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { GetUserProfile } from "@/features/user/types";

interface NotificationsTab {
  profile: GetUserProfile | null;
  toggleUserSettings: (
    field:
      | "twoFactorEnabled"
      | "emailNotifications"
      | "smsNotifications"
      | "whatsAppNotifications",
    currentValue: boolean
  ) => Promise<void>;
}

export const NotificationsTab = ({
  profile,
  toggleUserSettings,
}: NotificationsTab) => {
  return (
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
                You need to verify your email to receive email notifications
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                className={cn(profile?.emailNotifications && "bg-green-500")}
                variant={profile?.emailNotifications ? "secondary" : "default"}
              >
                {profile?.emailNotifications ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                checked={profile?.emailNotifications}
                onCheckedChange={(checked) => {
                  toggleUserSettings("emailNotifications", !checked);
                }}
                disabled={!profile?.emailVerified}
                className="cursor-pointer"
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
                className={cn(profile?.smsNotifications && "bg-green-500")}
                variant={profile?.smsNotifications ? "secondary" : "default"}
              >
                {profile?.smsNotifications ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                checked={profile?.smsNotifications}
                onCheckedChange={(checked) => {
                  toggleUserSettings("smsNotifications", !checked);
                }}
                disabled={!profile?.phoneNumberVerified}
                className="cursor-pointer"
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
                className={cn(profile?.whatsAppNotifications && "bg-green-500")}
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
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
