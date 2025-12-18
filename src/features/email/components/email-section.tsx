import React from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export const EmailFooter = () => {
  return (
    <Section className="bg-[#fff1e2] text-white p-5 text-[13px] text-center font-serif">
      <Text className="text-slate-700">
        © {new Date().getFullYear()} ActsOnWheels. All rights reserved.
      </Text>
    </Section>
  );
};

export const EmailHeader = () => {
  return (
    <Section className="bg-[#fff1e2] text-white p-5 w-full text-center mb-5 border-b border-[#e1e1e1] box-border">
      <Img
        src={`https://res.cloudinary.com/dxt7vk5dg/image/upload/v1743187728/ville-logo_u98blv.png`}
        width="150"
        height="90"
        alt="ActsOnWheel Logo"
        style={{ margin: "0 auto", display: "block" }}
      />
    </Section>
  );
};

export const EmailLayout = ({
  preview,
  children,
  name = "Jane",
}: {
  preview: string;
  name?: string;
  children: React.ReactNode;
}) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="bg-[#f6f9fc] text-[#333]">
          <Preview>{preview}</Preview>

          <Container className="bg-white my-0 mx-auto pt-6 pb-12 px-0 mb-12">
            <Section className="py-0 px-12">
              {/* Logo */}
              <EmailHeader />

              {/* Greeting */}
              {/* lineHeight :24px */}
              <Text className="text-[#333] text-[16px]">Hi {name},</Text>

              {/* MAIN CONTENT from actual email template */}
              {children}

              <Hr className="border border-[#e6ebf1]" />

              <Text className="text-[#333] text-[16px]">
                If you need any help,{" "}
                <Link className="text-[#556cd6]" href="/support">
                  contact our support team
                </Link>
                .
              </Text>

              <Text className="text-[#333] text-[16px]">
                Best regards,
                <br />
                The Team
              </Text>

              <Hr className="border border-[#e6ebf1]" />

              <EmailFooter />
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
