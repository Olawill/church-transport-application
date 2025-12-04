// components/email/templates/index.ts

import {
  ChangePasswordEmailTemplate,
  ForgotPasswordEmailTemplate,
  OTPEmailVerificationTemplate,
  TwoFactorEmailTemplate,
  VerificationEmailTemplate,
  WelcomeEmailTemplate,
  CreationEmailTemplate,
  ApprovalNeedEmailTemplate,
  DriverAssignmentEmailTemplate,
  DriverAcceptanceEmailTemplate,
  DriverNotificationEmailTemplate,
  RequestNotificationEmailTemplate,
  UserRejectionEmailTemplate,
  AppealDecisionEmailTemplate,
} from "@/features/email/components/email-components";

export const templates = {
  welcome: WelcomeEmailTemplate,
  otp: OTPEmailVerificationTemplate,
  email_verification: VerificationEmailTemplate,
  rejection_email: UserRejectionEmailTemplate,
  appeal_denial: AppealDecisionEmailTemplate,
  forgot_password: ForgotPasswordEmailTemplate,
  password_change: ChangePasswordEmailTemplate,
  "2FA_confirm": TwoFactorEmailTemplate,
  admin_user_creation: CreationEmailTemplate,
  approval_need: ApprovalNeedEmailTemplate,
  driver_assignment: DriverAssignmentEmailTemplate,
  driver_accept: DriverAcceptanceEmailTemplate,
  driver_notice: DriverNotificationEmailTemplate,
  request_notify: RequestNotificationEmailTemplate,
};
