"use client";

import Orb from "@/components/Orb";
import Particles from "@/components/Particles";
import { useTheme } from "next-themes";

export const LayoutBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <div className="w-full min-h-screen relative">
      <div className="absolute inset-0 w-full h-full">
        {theme === "dark" ? (
          <Orb
            hoverIntensity={0.5}
            rotateOnHover={true}
            hue={0}
            forceHoverState={false}
          />
        ) : (
          <Particles
            particleColors={["#bedeff", "#74d600"]}
            particleCount={1000}
            particleSpread={2}
            speed={0.1}
            particleBaseSize={150}
            moveParticlesOnHover={true}
            alphaParticles={false}
            disableRotation={false}
          />
        )}
      </div>
      <div className="relative w-full">{children}</div>
    </div>
  );
};
