"use client";

import Orb from "@/components/Orb";
import Squares from "@/components/Squares";
import { useTheme } from "next-themes";

export const LayoutBackground = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  return (
    <div className="w-full h-[600px] relative">
      {theme === "dark" ? (
        <Orb
          hoverIntensity={0.5}
          rotateOnHover={true}
          hue={0}
          forceHoverState={false}
        />
      ) : (
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal" // up, down, left, right, diagonal
          borderColor="#fff"
          hoverFillColor="#222"
        />
      )}
      <div className="absolute top-0 left-0 w-full">{children}</div>
    </div>
  );
};
