// WhatsApp Cloud API Service
// This is a placeholder implementation that can be activated after completing the WhatsApp setup

export interface WhatsAppMessage {
  to: string;
  template: string;
  parameters: string[];
}

type WhatsAppAPIResponse = {
  messaging_product: "whatsapp";
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status: string; // You can replace this with an enum if the status values are known
  }>;
};

type SendTemplateMessageResult =
  | { success: true; data: WhatsAppAPIResponse }
  | { success: false; error: unknown };

type RequestAcceptedProps = {
  user: {
    phone: string;
    firstName: string;
    lastName?: string;
  };
  driver: {
    phone: string;
    firstName: string;
    lastName: string;
  };
  requestDate: string;
  serviceDay: {
    name: string;
  };
};

export class WhatsAppService {
  private accessToken: string | undefined;
  private phoneNumberId: string | undefined;
  private apiVersion: string;
  private isConfigured: boolean;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v18.0";
    this.isConfigured = !!(this.accessToken && this.phoneNumberId);
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits and ensure proper format
    return phone.replace(/\D/g, "");
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    parameters: string[]
  ): Promise<SendTemplateMessageResult> {
    if (!this.isConfigured) {
      console.log("WhatsApp not configured. Would send template message:", {
        to,
        templateName,
        parameters,
      });

      return { success: false, error: "WhatsApp not configured" };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: this.formatPhoneNumber(to),
          type: "template",
          template: {
            name: templateName,
            language: {
              code: "en_US",
            },
            components: [
              {
                type: "body",
                parameters: parameters.map((param) => ({
                  type: "text",
                  text: param,
                })),
              },
            ],
          },
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error("Error sending WhatsApp message", error);
      return { success: false, error: error };
    }
  }

  async notifyPickupAccepted(
    userPhone: string,
    userName: string,
    serviceName: string,
    serviceDate: string,
    driverName: string,
    driverPhone: string
  ) {
    return this.sendTemplateMessage(userPhone, "pickup_accepted", [
      userName,
      serviceName,
      serviceDate,
      driverName,
      driverPhone,
    ]);
  }

  async sendPickupReminder(
    userPhone: string,
    serviceName: string,
    pickupTime: string,
    driverName: string,
    pickupAddress: string,
    driverPhone: string
  ) {
    return this.sendTemplateMessage(userPhone, "pickup_reminder", [
      serviceName,
      pickupTime,
      driverName,
      pickupAddress,
      driverPhone,
    ]);
  }

  async notifyNewRequest(
    driverPhone: string,
    userName: string,
    serviceName: string,
    pickupAddress: string,
    serviceDate: string
  ) {
    return this.sendTemplateMessage(driverPhone, "new_request_notification", [
      userName,
      serviceName,
      pickupAddress,
      serviceDate,
    ]);
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }

  getStatus(): { configured: boolean; message: string } {
    if (this.isConfigured) {
      return {
        configured: true,
        message: "WhatsApp integration is configured and ready",
      };
    } else {
      return {
        configured: false,
        message:
          "WhatsApp integration requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID environment variables",
      };
    }
  }
}

// Export singleton instance
export const whatsappService = new WhatsAppService();

// Utility functions for common notification scenarios
export const sendPickupNotifications = {
  async onRequestAccepted(pickupRequest: RequestAcceptedProps) {
    if (!pickupRequest.user?.phone || !pickupRequest.driver?.phone) {
      console.log("Missing phone numbers for notification");
      return;
    }

    try {
      // Notify user that their request was accepted
      await whatsappService.notifyPickupAccepted(
        pickupRequest.user.phone,
        pickupRequest.user.firstName,
        pickupRequest.serviceDay.name,
        new Date(pickupRequest.requestDate).toLocaleDateString(),
        `${pickupRequest.driver.firstName} ${pickupRequest.driver.lastName}`,
        pickupRequest.driver.phone
      );

      console.log("Pickup acceptance notification sent successfully");
    } catch (error) {
      console.error("Failed to send pickup acceptance notification:", error);
    }
  },

  async sendReminders() {
    // This would typically be called by a scheduled job
    // to send reminders for upcoming pickups
    console.log(
      "Reminder notifications would be sent here for upcoming pickups"
    );
  },
};
