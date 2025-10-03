import React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type EmailType =
  | "welcome"
  | "otp"
  | "email_verification"
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
  message: string;
}

const messages = {
  welcome:
    "Thank you for signing up with ActsOnWheel for your organization's transportation. The admin has received your sign up request and will review your request. Upon you organization's administration decision, you will be notified. Decision takes between 2-5 business days.",
  otp: "Your TCIC ActsOnWheels One-Time Password is below. Do not share this code with anyone.",
  emailVerification:
    "Thank you for signing up with ActsOnWheel. Your organization admin has approved your signup request. We want to ensure it is really you and secure your account, please click the button below to verify your email.",
  passwordReset:
    "We received a request to reset your password. Click the button below to create a new password. If you didn't request this, you can safely ignore this email.",
  passwordChange:
    "Your password has been successfully changed. If you didn't make this change, please contact our support team immediately.",
  twoFAConfirm:
    "Two-factor authentication has been successfully enabled on your account. Your account is now more secure with this additional layer of protection.",
  adminUserCreation:
    "Your organization administrator has created an account on your behalf. You can use the button below to login where you would be asked to change your password immediately. It is important to change your passowrd immediately for security concerns.",
  driverAssignment:
    "Your organization administrator has a ride request to you. Please review the details to help complete this assignment.",
  driverAcceptance:
    "Good news! A driver has accepted your ride request. You will get a notification when the driver is 10 minutes away. Ensure that you are ready before the driver arrives as the driver can only give you 5 minutes buffer time. If you are not ready, the driver may leave you.",
  approvalNeeded:
    "A new user just signed up on ActsOnWheel for your organization. Kindly review the signup, approve or decline the request. If request is approved, ensure that the user's role is changed if needed.",
  requestNotification:
    "A new request has been made. Click below to view the details and respond accordingly.",
  driverNotification:
    "The driver is 10 minutes away from you. Ensure you are ready before they arrive. The driver can only wait for you for an extra 5 minutes before cancelling your request.",
};

const getEmailConfig = (type: EmailTemplateProps["type"]) => {
  const configs = {
    welcome: {
      preview: "Welcome to ActsOnWheels For TCIC!",
      subject: "Welcome Aboard!",
      buttonText: "",
      buttonUrl: "",
      defaultMessage: messages.welcome,
    },
    otp: {
      preview: "Verify your Identity with ActsOnWheel",
      subject: "TCIC ActsOnWheel One Time Password (OTP) notification",
      buttonText: "",
      buttonUrl: "",
      defaultMessage: messages.otp,
    },
    email_verification: {
      preview: "Please verify your email address",
      subject: "Verify Your Email Address",
      buttonText: "Verify Email",
      buttonUrl: "/verify-email",
      defaultMessage: messages.emailVerification,
    },
    forgot_password: {
      preview: "Reset your password",
      subject: "Password Reset Request",
      buttonText: "Reset Password",
      buttonUrl: "/reset-password",
      defaultMessage: messages.passwordReset,
    },
    password_change: {
      preview: "Your password has been changed",
      subject: "Password Changed Successfully",
      buttonText: "",
      buttonUrl: "",
      defaultMessage: messages.passwordChange,
    },
    "2FA_confirm": {
      preview: "Two-factor authentication confirmation",
      subject: "Two-Factor Authentication Enabled",
      buttonText: "",
      buttonUrl: "",
      defaultMessage: messages.twoFAConfirm,
    },
    admin_user_creation: {
      preview: "Your admin account has been created",
      subject: "Admin Account Created",
      buttonText: "Login",
      buttonUrl: "/dashboard",
      defaultMessage: messages.adminUserCreation,
    },
    driver_assignment: {
      preview: "You have been assigned a new delivery",
      subject: "New Delivery Assignment",
      buttonText: "View Assignment",
      buttonUrl: "/transportation",
      defaultMessage: messages.driverAssignment,
    },
    driver_accept: {
      preview: "Driver has accepted your request",
      subject: "Driver Accepted Your Request",
      buttonText: "Track Delivery",
      buttonUrl: "/requests",
      defaultMessage: messages.driverAcceptance,
    },
    approval_need: {
      preview: "Action required: Approval needed",
      subject: "Approval Required",
      buttonText: "Review Request",
      buttonUrl: "/users",
      defaultMessage: messages.approvalNeeded,
    },
    request_notify: {
      preview: "You have a new request",
      subject: "New Request Notification",
      buttonText: "View Request",
      buttonUrl: "/requests",
      defaultMessage: messages.requestNotification,
    },
    driver_notice: {
      preview: "Important notice for drivers",
      subject: "Driver Notice",
      buttonText: "View Details",
      buttonUrl: "/requests",
      defaultMessage: messages.driverNotification,
    },
  };

  return configs[type];
};

const EmailTemplate = ({ type = "otp", name, message }: EmailTemplateProps) => {
  const config = getEmailConfig(type);
  const emailName = name || "Jade";
  const verificationCode = "000000";
  const verificationExpiry = "10 minutes";

  // Combine default message with additional message if provided
  const fullMessage = message
    ? `${config.defaultMessage}\n\n${message}`
    : config.defaultMessage;

  return (
    <Html>
      <Head />
      <Body style={main}>
        <Preview>{config.preview}</Preview>
        <Container style={container}>
          <Section style={box}>
            <Section style={imageSection}>
              <Img
                src={`https://res.cloudinary.com/dxt7vk5dg/image/upload/v1743187728/ville-logo_u98blv.png`}
                width="150"
                height="90"
                alt="Stripe"
              />
            </Section>
            <Text style={paragraph}>Hi {emailName},</Text>
            <Text style={paragraph}>{fullMessage}</Text>
            {config.buttonText && config.buttonUrl && (
              <Button style={button} href={config.buttonUrl}>
                {config.buttonText}
              </Button>
            )}
            {type === "otp" && (
              <Section style={verificationSection}>
                <Text style={verifyText}>Verification code</Text>

                <Text style={codeText}>{verificationCode}</Text>
                <Text style={validityText}>
                  (This code is valid for {verificationExpiry})
                </Text>
              </Section>
            )}
            <Hr style={hr} />
            <Text style={paragraph}>
              If you have any questions or need assistance, please don&apos;t
              hesitate to{" "}
              <Link style={anchor} href="/support">
                contact our support team
              </Link>
              .
            </Text>
            <Text style={paragraph}>
              Best regards,
              <br />
              The Team
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              © {new Date().getFullYear()} Your Company. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default EmailTemplate;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const box = {
  padding: "0 48px",
};

const imageSection = {
  backgroundColor: "#252f3d",
  display: "flex",
  padding: "20px 0",
  alignItems: "center",
  justifyContent: "center",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const verificationSection = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#dcf3ff",
  paddingTop: "2px",
  paddingBottom: "2px",
};

const text = {
  color: "#333",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: "14px",
  margin: "24px 0",
};

const verifyText = {
  ...text,
  margin: 0,
  fontWeight: "bold",
  textAlign: "center" as const,
};

const codeText = {
  ...text,
  fontWeight: "bold",
  fontSize: "36px",
  margin: "10px 0",
  textAlign: "center" as const,
};

const validityText = {
  ...text,
  margin: "0px",
  textAlign: "center" as const,
};

const paragraph = {
  color: "#525f7f",

  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
};

const anchor = {
  color: "#556cd6",
};

const button = {
  backgroundColor: "#656ee8",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "10px",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
};
