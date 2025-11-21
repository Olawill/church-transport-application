"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

interface CarBackProps {
  size?: number;
  className?: string;
  patrolDistance?: number;
  duration?: number;
}

export function CarBack({
  size = 64,
  className = "",
  patrolDistance = 8,
  duration = 2,
}: CarBackProps) {
  const carRef = useRef<SVGSVGElement>(null);
  const leftWheelRef = useRef<SVGCircleElement>(null);
  const rightWheelRef = useRef<SVGCircleElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);

  useEffect(() => {
    if (!carRef.current) return;

    // Wheels spinning
    [leftWheelRef.current, rightWheelRef.current].forEach((wheel) => {
      if (wheel) {
        gsap.to(wheel, {
          rotate: 360,
          transformOrigin: "50% 50%",
          repeat: -1,
          duration: 0.5,
          ease: "linear",
        });
      }
    });

    // Car side-to-side cruising
    gsap.to(carRef.current, {
      x: patrolDistance,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      duration,
    });

    // Animate gradient across car
    if (gradientRef.current) {
      gsap.to(gradientRef.current, {
        attr: { x1: "100%", x2: "0%" },
        repeat: -1,
        yoyo: true,
        duration: 2,
        ease: "sine.inOut",
      });
    }
  }, [patrolDistance, duration]);

  return (
    <svg
      ref={carRef}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 256 256"
      className={className}
    >
      <defs>
        <linearGradient
          ref={gradientRef}
          id="carGradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Car body */}
      <path
        fill="url(#carGradient)"
        d="M240 112h-28.69L168 68.69A15.86 15.86 0 0 0 156.69 64H44.28A16 16 0 0 0 31 71.12L1.34 115.56A8.07 8.07 0 0 0 0 120v48a16 16 0 0 0 16 16h17a32 32 0 0 0 62 0h66a32 32 0 0 0 62 0h17a16 16 0 0 0 16-16v-40a16 16 0 0 0-16-16M44.28 80h112.41l32 32H23Z"
      />

      {/* Left wheel */}
      <circle ref={leftWheelRef} cx="64" cy="192" r="16" fill="#000" />
      {/* Right wheel */}
      <circle ref={rightWheelRef} cx="192" cy="192" r="16" fill="#000" />
    </svg>
  );
}
