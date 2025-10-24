import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useEffect } from "react";

import { PasswordScore } from "./signup-form";

export const PasswordStrength = ({ strength }: { strength: PasswordScore }) => {
  const score = useMotionValue(0);

  // Animate the score value whenever it changes
  useEffect(() => {
    if (strength?.score != null) {
      const controls = animate(score, strength.score, {
        duration: 0.5,
        ease: "easeOut",
      });
      return () => controls.stop();
    }
  }, [strength?.score, score]);

  // Map score to color smoothly using HSL interpolation
  const hue = useTransform(score, [0, 100], [0, 120]);
  const barColor = useTransform(hue, (h) => `hsl(${h}, 90%, 45%)`);
  const gradient = useTransform(
    hue,
    (h) =>
      `linear-gradient(90deg, hsl(${Math.max(h - 20, 0)}, 90%, 45%), hsl(${h}, 90%, 45%))`
  );

  // Use same color for text label
  const labelColor = barColor;

  // Convert numeric motion value to a readable text (rounded)
  const width = useTransform(score, (v) => `${v}%`);
  const displayScore = useTransform(score, (latest) => Math.round(latest));

  if (!strength) return null;

  return (
    <AnimatePresence mode="wait">
      {strength && (
        <motion.div
          // key={strength.score}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          // className="mt-2"
          aria-live="polite"
        >
          {/* Title Row */}
          <div className="flex items-center justify-between mb-2">
            <motion.span
              layout
              className="text-xs text-green-500"
              transition={{ duration: 0.3 }}
            >
              Password strength
            </motion.span>

            {/* Animated Strength Label and Score */}
            <div className="flex items-center gap-2">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={strength.strength}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.25 }}
                  style={{ color: labelColor }}
                  className="text-xs font-medium capitalize"
                >
                  {strength.strength}
                </motion.span>
              </AnimatePresence>

              {/* Animated numeric score */}
              <motion.span
                className="text-[10px] text-gray-500 dark:text-gray-200"
                layout
              >
                <motion.span>{displayScore}</motion.span>
                <span className="text-[10px] opacity-70"> / 100</span>
              </motion.span>
            </div>
          </div>

          {/* Progress Bar with animated gradient */}
          <div className="relative h-2 rounded bg-gray-200 overflow-hidden">
            <motion.div
              key="bar"
              className="h-full rounded"
              style={{
                width,
                background: gradient,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Animated error list */}
          <AnimatePresence>
            {strength.errors?.length > 0 && (
              <motion.div
                key="errors"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                <span className="text-xs italic block">
                  Requirements: <span className="font-bold">Password must</span>
                </span>
                <ul className="text-xs italic list-disc ml-4 text-red-500 space-y-1">
                  {strength.errors.map((error, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.25, delay: index * 0.05 }}
                    >
                      {error}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
