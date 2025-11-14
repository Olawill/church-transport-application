"use client";

import { useTheme } from "next-themes";

import Orb from "@/features/background/components/Orb";
import Particles from "@/features/background/components/Particles";
import { useEffect, useState } from "react";

export const LayoutBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <div className="w-full min-h-screen relative">
      <div className="absolute inset-0 w-full h-full">
        {!mounted ? (
          // Optional: subtle background while loading
          <div className="w-full h-full bg-background" />
        ) : (
          <>
            {isDark ? (
              <Orb
                hoverIntensity={0.5}
                rotateOnHover={true}
                hue={0}
                forceHoverState={false}
              />
            ) : (
              <Particles
                // particleColors={["#bedeff", "#74d600"]}
                particleColors={[
                  "#bedeff", // light blue
                  "#74d600", // vibrant green
                  "#ffa500", // orange
                  "#ff69b4", // hot pink
                  "#8a2be2", // blue violet
                  "#00ffff", // cyan
                ]}
                particleCount={1000}
                particleSpread={2}
                speed={0.1}
                particleBaseSize={150}
                moveParticlesOnHover={true}
                alphaParticles={false}
                disableRotation={false}
              />
            )}
          </>
        )}
      </div>
      <div className="relative w-full h-full">{children}</div>
    </div>
  );
};
