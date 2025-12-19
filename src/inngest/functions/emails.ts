import { sendEmailAction } from "@/features/email/actions/sendEmail";
import { inngest } from "../client";

export const emailSendingService = inngest.createFunction(
  {
    id: "email-sending-service",
    name: "Email Sending Service",
    throttle: {
      limit: 1000,
      period: "1m",
    },
  },
  {
    event: "app/email.notifications",
  },
  async ({ event, step }) => {
    const { values } = event.data;

    const result = await step.run("send-email", async () => {
      return await sendEmailAction(values);
    });

    if (result.error) {
      return { success: false };
    }

    return { success: result.success };
  }
);
