"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { ActsOnWheelsLogo } from "@/components/logo";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-screen items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex flex-col items-center gap-6">
        <ActsOnWheelsLogo />

        <motion.div
          layout
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
          }
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: "easeInOut" }
              }
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
