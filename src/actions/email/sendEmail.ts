"use server";

import { sendEmailSchema, SendEmailSchema } from "./emailSchema";

import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { z } from "zod";
import EmailTemplate from "../../../emails/email-template";

const mailTransporter = async () => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

const sendEmailAction = async (values: SendEmailSchema) => {
  const validatedValues = sendEmailSchema.safeParse(values);

  if (!validatedValues.success) {
    return {
      // errors: validatedValues.error.flatten().fieldErrors,
      errors: z.treeifyError(validatedValues.error).properties,
    };
  }

  const { from, to, type, name, message } = validatedValues.data;

  try {
    // Create transporter
    const transporter = await mailTransporter();

    // Render email template
    const emailHtml = await render(
      EmailTemplate({
        type,
        name,
        message: message || "",
      })
    );

    // Get Subject from template config if not provided
    const emailSubject = getDefaultSubject(type);
    const defaultFrom = `"${process.env.SMTP_FROM_NAME || "ActsOnWheel"}" <${process.env.SMTP_FROM_EMAIL}>`;

    // Send Email
    await transporter.sendMail({
      from: from ? from : defaultFrom,
      to,
      //   bcc: "henry.williams658@gmail.com",
      subject: emailSubject,
      html: emailHtml,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
};

export const sendMail = async (values: SendEmailSchema) => {
  const validatedFields = sendEmailSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid email values" };
  }

  const { data } = validatedFields;

  await sendEmailAction(data);

  return { success: "Email sent successfully" };
};

// Helper function to get default subject based on email type
function getDefaultSubject(type: SendEmailSchema["type"]): string {
  const subjects: Record<SendEmailSchema["type"], string> = {
    welcome: "Welcome Aboard!",
    email_verification: "Verify Your Email Address",
    forgot_password: "Password Reset Request",
    password_change: "Password Changed Successfully",
    "2FA_confirm": "Two-Factor Authentication Enabled",
    admin_user_creation: "Admin Account Created",
    driver_assignment: "New Delivery Assignment",
    driver_accept: "Driver Accepted Your Request",
    approval_need: "Approval Required",
    request_notify: "New Request Notification",
    driver_notice: "Driver Notice",
    otp: "TCIC ActsOnWheel One Time Password (OTP) notification",
  };

  return subjects[type];
}
