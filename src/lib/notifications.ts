import { prisma } from "./db";

export interface WhatsAppMessage {
  to: string;
  type: "text" | "template";
  text?: string;
  templateName?: string;
  templateParams?: string[];
}

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

export class NotificationService {
  static async scheduleWhatsAppNotification(
    userId: string,
    message: WhatsAppMessage,
    scheduledFor?: Date
  ): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: "whatsapp",
        title: "WhatsApp Notification",
        message: message.text || `Template: ${message.templateName}`,
        scheduledFor: scheduledFor || new Date(),
        metadata: JSON.stringify(message),
      },
    });
  }

  static async scheduleEmailNotification(
    userId: string,
    email: EmailMessage,
    scheduledFor?: Date
  ): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: "email",
        title: email.subject,
        message: email.body,
        scheduledFor: scheduledFor || new Date(),
        metadata: JSON.stringify(email),
      },
    });
  }

  static async sendPickupAcceptedNotification(
    userId: string,
    driverName: string,
    pickupTime: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { whatsappNumber: true, email: true, firstName: true },
    });

    if (!user) return;

    const message = `Hello ${user.firstName}! Good news! ${driverName} has accepted your pickup request for ${pickupTime}. They will contact you soon with more details.`;

    if (user.whatsappNumber) {
      await this.scheduleWhatsAppNotification(userId, {
        to: user.whatsappNumber,
        type: "text",
        text: message,
      });
    }

    await this.scheduleEmailNotification(userId, {
      to: user.email,
      subject: "Pickup Request Accepted",
      body: message,
    });
  }

  static async sendPickupAssignmentNotification(
    userId: string,
    // driverName: string,
    driverId: string,
    pickupTime: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { whatsappNumber: true, email: true, firstName: true },
    });

    const driver = await prisma.user.findUnique({
      where: { id: driverId },
    });

    if (!user || !driver) return;

    const message = `Hello ${driver.firstName}! You have been assigned to pickup ${user.firstName} for ${pickupTime}. Please check tour dashboard for more details and contact them to make arrangements.`;

    if (driver.whatsappNumber) {
      await this.scheduleWhatsAppNotification(driverId, {
        to: driver.whatsappNumber,
        type: "text",
        text: message,
      });
    }

    await this.scheduleEmailNotification(driverId, {
      to: driver.email,
      subject: "Pickup Assignment",
      body: message,
    });
  }

  static async sendPickupReminderNotification(
    userId: string,
    pickupTime: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { whatsappNumber: true, email: true, firstName: true },
    });

    if (!user) return;

    const message = `Hi ${user.firstName}! This is a reminder that your pickup is scheduled in 10 minutes at ${pickupTime}. Please be ready!`;

    // Schedule for 10 minutes before pickup
    const reminderTime = new Date(pickupTime);
    reminderTime.setMinutes(reminderTime.getMinutes() - 10);

    if (user.whatsappNumber) {
      await this.scheduleWhatsAppNotification(
        userId,
        {
          to: user.whatsappNumber,
          type: "text",
          text: message,
        },
        reminderTime
      );
    }

    await this.scheduleEmailNotification(
      userId,
      {
        to: user.email,
        subject: "Pickup Reminder - 10 Minutes",
        body: message,
      },
      reminderTime
    );
  }

  static async sendOTPNotification(
    userId: string,
    code: string,
    type: "email" | "whatsapp"
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { whatsappNumber: true, email: true, firstName: true },
    });

    if (!user) return;

    const message = `Hello ${user.firstName}! Your verification code is: ${code}. This code will expire in 10 minutes.`;

    if (type === "whatsapp" && user.whatsappNumber) {
      await this.scheduleWhatsAppNotification(userId, {
        to: user.whatsappNumber,
        type: "text",
        text: message,
      });
    } else if (type === "email") {
      await this.scheduleEmailNotification(userId, {
        to: user.email,
        subject: "Your Verification Code",
        body: message,
      });
    }
  }

  static async notifyDriver(
    metadata: WhatsAppMessage | EmailMessage,
    type: "email" | "whatsapp"
  ): Promise<void> {
    if (type === "whatsapp") {
      await this.sendWhatsAppMessage(metadata as WhatsAppMessage);
    }

    if (type === "email") {
      await this.sendEmailMessage(metadata as EmailMessage);
    }
  }

  static async processPendingNotifications(): Promise<void> {
    const pendingNotifications = await prisma.notification.findMany({
      where: {
        status: "pending",
        scheduledFor: { lte: new Date() },
      },
      take: 100, // Process in batches
    });

    for (const notification of pendingNotifications) {
      try {
        if (notification.type === "whatsapp") {
          // Here you would integrate with WhatsApp Cloud API
          await this.sendWhatsAppMessage(
            JSON.parse(notification.metadata || "{}")
          );
        } else if (notification.type === "email") {
          // Here you would integrate with email service
          await this.sendEmailMessage(
            JSON.parse(notification.metadata || "{}")
          );
        }

        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "sent", sentAt: new Date() },
        });
      } catch (error) {
        console.error("Failed to send notification:", error);
        await prisma.notification.update({
          where: { id: notification.id },
          data: { status: "failed" },
        });
      }
    }
  }

  // Placeholder for WhatsApp API integration
  private static async sendWhatsAppMessage(
    message: WhatsAppMessage
  ): Promise<void> {
    // TODO: Implement WhatsApp Cloud API integration
    console.log("WhatsApp message would be sent:", message);
  }

  // Placeholder for email service integration
  private static async sendEmailMessage(email: EmailMessage): Promise<void> {
    // TODO: Implement email service integration
    console.log("Email would be sent:", email);
  }
}
