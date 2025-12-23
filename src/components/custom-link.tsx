"use client";

import Link from "next/link";
import { useNavigationBlocker } from "./contexts/navigation-blocker";
import { useRouter } from "next/navigation";
import { Route } from "next";

interface CustomLinkProps extends React.ComponentProps<typeof Link> {
  children: React.ReactNode;
}

export const CustomLink = ({ children, ...props }: CustomLinkProps) => {
  const { isBlocked, setIsBlocked, confirmExit } = useNavigationBlocker();
  const router = useRouter();

  return (
    <Link
      onNavigate={async (e) => {
        if (isBlocked) {
          e.preventDefault();

          const result = await confirmExit();

          if (result.action === "confirm" || result.action === "primary") {
            const href = props.href;
            setIsBlocked(false);
            router.push(href as Route);
          }
        }
      }}
      {...props}
    >
      {children}
    </Link>
  );
};
