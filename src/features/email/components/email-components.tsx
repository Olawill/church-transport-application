import { OTP } from "@/config/constants";
import { Button, Section, Text } from "@react-email/components";

interface VerificationEmailProps {
  verifyLink: string;
  isAppeal?: boolean;
  mainMsg?: string;
  extraMessage?: string;
}

interface OTPEmailProps {
  verifyCode: string;
}

interface CreationEmailProps {
  loginLink: string;
  securityWord: string;
}

interface EmailLinkProps {
  link: string;
}

interface RejectionEmailProps {
  verifyLink: string;
  mainMsg?: string;
}

interface AppealRequestEmailProps {
  username?: string;
}

export const WelcomeEmailTemplate = () => {
  return (
    <Section>
      <Text className="text-[#525f7f] text-base text-left font-serif leading-6">
        Thank you for signing up with ActsOnWheel for your organization&apos;s
        transportation. The admin has received your sign up request and will
        review your request. Upon your organization&apos;s administration
        decision, you will be notified. Decision takes between 24 - 72 hours.
      </Text>
    </Section>
  );
};

export const OTPEmailVerificationTemplate = ({ verifyCode }: OTPEmailProps) => {
  const mainMessage =
    "Your ActsOnWheels One-Time Password is below. Do not share this code with anyone.";
  const verificationCode = verifyCode ? verifyCode : "0000";
  return (
    <Section className="py-0.5 flex items-center justify-center">
      <Text className="leading-6 font-serif">{mainMessage}</Text>
      <Section>
        <Text className="text-[#333] text-base m-0 font-bold text-center font-serif">
          Verification code
        </Text>

        <Text className="text-[#333] font-serif font-bold text-4xl my-2.5 mx-0 text-center">
          {verificationCode}
        </Text>
        <Text className="text-[#333] text-[12px] font-serif m-0 text-center">
          (This code is valid for {OTP.PERIOD} minutes)
        </Text>
      </Section>
    </Section>
  );
};

export const VerificationEmailTemplate = ({
  verifyLink,
  isAppeal,
  mainMsg,
  extraMessage,
}: VerificationEmailProps) => {
  const link = verifyLink ? verifyLink : "https://example.com/verify-email";
  const mainMessage =
    mainMsg ??
    "Thank you for signing up with ActsOnWheel. Your organization admin has approved your signup request. We want to ensure it is really you and secure your account, please click the button below to verify your email.";

  const appealMsg =
    "Thank you for submitting your appeal regarding your recent sign-up request. After reviewing the information you provided, we’ve approved your appeal, and your account has now been approved. We want to ensure it is really you and secure your account, please click the button below to verify your email.";

  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {isAppeal ? mainMessage : appealMsg}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={link}
      >
        Verify Email
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {link}
      </Text>
      <Text className="text-[#333] font-serif text-base my-6">
        If you did not create the account. Ignore the message.
      </Text>
      {extraMessage && (
        <Text className="text-[#333] font-serif text-base my-6">
          {extraMessage}
        </Text>
      )}
    </Section>
  );
};

export const ForgotPasswordEmailTemplate = ({
  link: resetLink,
}: EmailLinkProps) => {
  const mainMessage =
    "We received a request to reset your password. Click the button below to create a new password.";
  const link = resetLink ? resetLink : "http://localhost:3000/forgot-password";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={link}
      >
        Verify Email
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {link}
      </Text>
      <Text className="text-[#333] font-serif text-base my-6">
        If you didn&apos;t request this, you can safely ignore this email.
      </Text>
    </Section>
  );
};

export const ChangePasswordEmailTemplate = () => {
  const mainMessage =
    "Your password has been successfully changed. If you didn't make this change, please contact our support team immediately.";

  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
    </Section>
  );
};

export const TwoFactorEmailTemplate = () => {
  const mainMessage =
    "Two-factor authentication has been successfully enabled on your account. Your account is now more secure with this additional layer of protection.";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
    </Section>
  );
};

export const CreationEmailTemplate = ({
  loginLink,
  securityWord,
}: CreationEmailProps) => {
  const mainMessage =
    "Your organization administrator has created an account on your behalf. You can use the button below to login where you would be asked to change your password immediately.";
  const password = securityWord ? securityWord : "gehlrikdchidc";
  const link = loginLink ? loginLink : `http://localhost:3000/${password}`;
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={link}
      >
        Verify Email
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {link}
      </Text>
      <Text className="text-[#333] font-serif text-base my-6">
        It is important to change your passowrd immediately for security
        concerns.
      </Text>
    </Section>
  );
};

export const ApprovalNeedEmailTemplate = ({ link }: EmailLinkProps) => {
  const mainMessage =
    "A new user just signed up on ActsOnWheel for your organization. Kindly review the signup, approve or decline the request.";

  const extraMessage =
    "If request is approved, ensure that the user's role is changed if needed.";

  const approvalLink = link ? link : "http://localhost:3000/admin/users";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={approvalLink}
      >
        Approve/Decline New User
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {approvalLink}
      </Text>
      <Text className="text-[#333] font-serif text-base my-6">
        {extraMessage}
      </Text>
    </Section>
  );
};

export const DriverAssignmentEmailTemplate = ({ link }: EmailLinkProps) => {
  const mainMessage =
    "Your organization administrator has assigned a ride request to you. Please review the details to help complete this assignment.";

  const requestLink = link ? link : "http://localhost:3000/transportation";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={requestLink}
      >
        View Request Assigned
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {requestLink}
      </Text>
    </Section>
  );
};

export const DriverAcceptanceEmailTemplate = ({ link }: EmailLinkProps) => {
  const mainMessage =
    "Good news! A driver has accepted your ride request. You will get a notification when the driver is 10 minutes away. Ensure that you are ready before the driver arrives as the driver can only give you 5 minutes buffer time. If you are not ready, the driver may leave you.";

  const requestLink = link ? link : "http://localhost:3000/requests";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={requestLink}
      >
        View Your Request
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {requestLink}
      </Text>
    </Section>
  );
};

export const DriverNotificationEmailTemplate = ({ link }: EmailLinkProps) => {
  const mainMessage =
    "The driver is 10 minutes away from you. Ensure you are ready before they arrive. The driver can only wait for you for an extra 5 minutes before cancelling your request.";

  const requestLink = link ? link : "http://localhost:3000/requests";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={requestLink}
      >
        View Request
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {requestLink}
      </Text>
    </Section>
  );
};

export const RequestNotificationEmailTemplate = ({ link }: EmailLinkProps) => {
  const mainMessage =
    "A new request has been made. Click below to view the details and respond accordingly.";

  const requestLink = link ? link : "http://localhost:3000/requests";
  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={requestLink}
      >
        View Request
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {requestLink}
      </Text>
    </Section>
  );
};

export const UserRejectionEmailTemplate = ({
  verifyLink,
  mainMsg,
}: RejectionEmailProps) => {
  const link = verifyLink ? verifyLink : "https://example.com/appeal";
  const mainMessage =
    mainMsg ??
    "Your sign up request with organization was rejected by the admin. You can appeal the rejection by clicking the button below";

  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
      <Button
        className="bg-[#656ee8] rounded-[5px] text-white text-base font-bold no-underline text-center block p-[10px] font-serif"
        href={link}
      >
        Appeal Rejection
      </Button>
      <Text className="text-[#333] font-serif text-base my-6">
        or you can copy the link below
      </Text>
      <Text className="text-[#333] font-serif text-xs text-center justify-self-center mt-6 ml-6">
        {link}
      </Text>
      <Text className="text-[#333] font-serif text-base my-6">
        If you did not create the account. Ignore the message.
      </Text>
    </Section>
  );
};

export const AppealDecisionEmailTemplate = () => {
  const mainMessage =
    "Thank you for submitting your appeal regarding your sign-up request. After a careful and comprehensive review, we regret to inform you that we are unable to approve your appeal at this time.";

  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
    </Section>
  );
};

export const AppealRequestEmailTemplate = ({
  username,
}: AppealRequestEmailProps) => {
  const name = username ?? "Mary";
  const mainMessage = `An appeal request has been submitted by the user ${name}. Please review the appeal details at your earliest convenience to determine the appropriate next steps.`;

  return (
    <Section>
      <Text className="text-[#333] font-serif text-base my-6">
        {mainMessage}
      </Text>
    </Section>
  );
};
