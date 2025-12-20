import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  pixelBasedPreset,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import React from "react";

export const EmailFooter = () => {
  return (
    <Section className="bg-[#fff1e2] text-white p-5 text-[13px] text-center font-serif">
      <Text className="text-slate-700">
        © {new Date().getFullYear()} ActsOnWheels. All rights reserved.
      </Text>
    </Section>
  );
};

// export const EmailHeader = () => {
//   return (
//     <Section className="bg-[#fff1e2] text-white p-5 w-full text-center mb-5 border-b border-[#e1e1e1] box-border">
//       <Img
//         src={`https://res.cloudinary.com/dxt7vk5dg/image/upload/v1743187728/ville-logo_u98blv.png`}
//         width="150"
//         height="90"
//         alt="ActsOnWheel Logo"
//         style={{ margin: "0 auto", display: "block" }}
//       />
//     </Section>
//   );
// };

export const EmailHeader = () => {
  return (
    <Section className="bg-[#fff1e2] text-white p-5 w-full text-center mb-5 border-b border-[#e1e1e1] box-border">
      <svg
        width="280"
        height="48"
        viewBox="0 0 280 48"
        xmlns="http://www.w3.org/2000/svg"
        style={{ margin: "0 auto", display: "block" }}
      >
        {/* Blue rounded square background */}
        <rect x="0" y="4" width="40" height="40" rx="8" fill="#2563eb" />

        {/* Car icon (simplified) */}
        <g transform="translate(12.5, 16.5)">
          <path
            d="M3 8L5 4H10L12 8M3 8H0V11H1.5M3 8H12M12 8H15V11H13.5M1.5 11C1.5 11.8284 2.17157 12.5 3 12.5C3.82843 12.5 4.5 11.8284 4.5 11M1.5 11C1.5 10.1716 2.17157 9.5 3 9.5C3.82843 9.5 4.5 10.1716 4.5 11M4.5 11H10.5M13.5 11C13.5 11.8284 12.8284 12.5 12 12.5C11.1716 12.5 10.5 11.8284 10.5 11M13.5 11C13.5 10.1716 12.8284 9.5 12 9.5C11.1716 9.5 10.5 10.1716 10.5 11"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* "Acts" text */}
        <text
          x="52"
          y="32"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="700"
          fill="#111827"
        >
          Acts
        </text>

        {/* "On" text in blue */}
        <text
          x="92"
          y="32"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="700"
          fill="#2563eb"
        >
          On
        </text>

        {/* "Wheels" text */}
        <text
          x="117"
          y="32"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="20"
          fontWeight="700"
          fill="#111827"
        >
          Wheels
        </text>

        {/* "CHURCH TRANSPORTATION" subtitle */}
        <text
          x="52"
          y="41"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="7"
          fontWeight="500"
          fill="#6b7280"
          letterSpacing="1.2"
        >
          CHURCH TRANSPORTATION
        </text>
      </svg>
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
