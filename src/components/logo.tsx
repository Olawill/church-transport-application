import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CarIcon } from "lucide-react";
import { useState } from "react";

import { CustomLink as Link } from "./custom-link";

export const ActsOnWheelsLogo = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex items-center">
      <Link
        href="/"
        className="flex items-center gap-3"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className={cn(
            "relative flex size-10 items-center justify-center overflow-hidden rounded-lg bg-blue-600 transition-shadow duration-200",
            isHovered ? "shadow-lg" : "shadow-md",
          )}
          animate={{
            y: isHovered ? -2 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={
              isHovered
                ? {
                    x: [0, 50, -50, 0],
                    y: [0, -1, -1, 0],
                    rotate: [0, 3, -3, 0],
                    scale: [1, 0.95, 0.95, 1],
                    transition: {
                      duration: 1.4,
                      times: [0, 0.3, 0.31, 1],
                      ease: ["easeIn", "linear", "easeOut"],
                    },
                  }
                : {
                    x: 0,
                    y: 0,
                    rotate: 0,
                    scale: 1,
                  }
            }
          >
            <CarIcon className="size-5 text-white" />
          </motion.div>
        </motion.div>

        <div className="block">
          <div className="text-xl font-bold tracking-tight whitespace-nowrap text-gray-900 dark:text-white">
            Acts
            <span className="text-blue-600">On</span>
            Wheels
          </div>
          <div className="-mt-0.5 text-[10px] font-medium tracking-widest whitespace-nowrap text-gray-500 uppercase dark:text-gray-100">
            Church Transportation
          </div>
        </div>
      </Link>
    </div>
  );
};
