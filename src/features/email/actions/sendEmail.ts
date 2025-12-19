"use server";

import { sendEmailSchema, SendEmailSchema } from "@/features/email/emailSchema";

import nodemailer from "nodemailer";
import { render, toPlainText } from "@react-email/render";
import EmailTemplate from "../../../../emails/email-template";
import { inngest } from "@/inngest/client";

const mailTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass || !process.env.SMTP_FROM_EMAIL) {
    throw new Error("SMTP env vars missing (HOST, USER, PASSWORD, FROM_EMAIL)");
  }
  const secure =
    process.env.SMTP_SECURE?.toLowerCase() === "true" || port === 465;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 465 && { requireTLS: true }),
    pool: true,
    maxConnections: 5,
    connectionTimeout: 10000,
  });
};
export const sendEmailAction = async (values: SendEmailSchema) => {
  const validatedValues = sendEmailSchema.safeParse(values);

  if (!validatedValues.success) {
    return {
      error: "Validation error",
      success: false,
    };
  }

  const { to, type, name, message, verifyCode, verifyLink, username, status } =
    validatedValues.data;

  try {
    // Create transporter
    const transporter = mailTransporter();

    // Render email template
    const emailHtml = await render(
      EmailTemplate({
        type,
        name,
        message: message,
        verifyCode,
        verifyLink,
        username,
        status,
      })
    );

    const emailText = toPlainText(emailHtml);

    // Get Subject from template config if not provided
    const emailSubject = getDefaultSubject(type);
    const defaultFrom = `"${process.env.SMTP_FROM_NAME || "ActsOnWheel"}" <${process.env.SMTP_FROM_EMAIL}>`;

    // Send Email
    await transporter.sendMail({
      from: defaultFrom,
      to,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });

    return {
      success: true,
      error: null,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
};

export const sendMail = async (values: SendEmailSchema) => {
  // Validate before queuing
  const validatedValues = sendEmailSchema.safeParse(values);

  if (!validatedValues.success) {
    return {
      success: false,
      error: "Validation error",
    };
  }

  try {
    await inngest.send({
      name: "app/email.notifications",
      data: { values: validatedValues.data },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error queuing email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to queue email",
    };
  }
};

// Helper function to get default subject based on email type
function getDefaultSubject(type: SendEmailSchema["type"]): string {
  const subjects: Record<SendEmailSchema["type"], string> = {
    welcome: "Welcome Aboard!",
    email_verification: "Verify Your Email Address",
    rejection_email: "Your Sign up request has been rejected",
    appeal_status: "Update on your appeal",
    appeal_request: "Sign Up Rejection Appeal",
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
