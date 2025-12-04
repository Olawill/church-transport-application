import React from "react";
import { templates } from "./template";
import { EmailLayout } from "@/features/email/components/email-section";

export type EmailType =
  | "welcome"
  | "otp"
  | "email_verification"
  | "rejection_email"
  | "appeal_denial"
  | "forgot_password"
  | "password_change"
  | "2FA_confirm"
  | "admin_user_creation"
  | "driver_assignment"
  | "driver_accept"
  | "approval_need"
  | "request_notify"
  | "driver_notice";

interface EmailTemplateProps {
  type: EmailType;
  name: string;
  message?: string;
  verifyCode?: string;
  verifyLink?: string;
}

const emailItems = {
  welcome: {
    preview: "Welcome to ActsOnWheels For TCIC!",
  },
  otp: {
    preview: "Verify your Identity with ActsOnWheel",
  },
  email_verification: {
    preview: "Please verify your email address",
  },
  rejection_email: {
    preview: "Your Sign up request was rejected",
  },
  appeal_denial: {
    preview: "Decision has been made about your appeal",
  },
  forgot_password: {
    preview: "Reset your password",
  },
  password_change: {
    preview: "Your password has been changed",
  },
  "2FA_confirm": {
    preview: "Two-factor authentication confirmation",
  },
  admin_user_creation: {
    preview: "Your admin account has been created",
  },
  driver_assignment: {
    preview: "You have been assigned a new delivery",
  },
  driver_accept: {
    preview: "Driver has accepted your request",
  },
  approval_need: {
    preview: "Action required: Approval needed",
  },
  request_notify: {
    preview: "You have a new request",
  },
  driver_notice: {
    preview: "Important notice for drivers",
  },
};

const EmailTemplate = ({
  type = "welcome",
  name,
  verifyCode,
  message,
  verifyLink,
}: EmailTemplateProps) => {
  const Template = templates[type];
  const preview = emailItems[type].preview;

  return (
    <EmailLayout preview={preview} name={name}>
      {/* Render Appropriate Email Template */}
      <Template
        verifyCode={verifyCode || ""}
        verifyLink={verifyLink || ""}
        link={verifyLink || ""}
        loginLink={""}
        securityWord={verifyLink || ""}
        mainMsg={message}
      />
    </EmailLayout>
  );
};

export default EmailTemplate;
