"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface MagneticTiltCardProps {
  children: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  maxTilt?: number;
  glowColor?: "rose" | "periwinkle" | "neutral";
}

export default function MagneticTiltCard({
  children,
  isSelected = false,
  onClick,
  className = "",
  maxTilt = 6,
  glowColor = "rose",
}: MagneticTiltCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);

  // Raw mouse coordinates relative to card center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery-smooth responsiveness and recovery
  const springConfig = { stiffness: 260, damping: 22, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D rotation transforms
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);
  const translateX = useTransform(smoothMouseX, [-0.5, 0.5], [-4, 4]);
  const translateY = useTransform(smoothMouseY, [-0.5, 0.5], [-4, 4]);

  // Spotlight coordinates (0% to 100%)
  const spotlightX = useTransform(mouseX, [-0.5, 0.5], ["20%", "80%"]);
  const spotlightY = useTransform(mouseY, [-0.5, 0.5], ["20%", "80%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const glowRgba =
    glowColor === "rose"
      ? "rgba(242, 184, 198, 0.12)"
      : glowColor === "periwinkle"
      ? "rgba(168, 181, 224, 0.12)"
      : "rgba(255, 255, 255, 0.06)";

  return (
    <div style={{ perspective: 1000 }} className="w-full">
      <motion.button
        ref={cardRef}
        type="button"
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          x: translateX,
          y: translateY,
          transformStyle: "preserve-3d",
        }}
        whileTap={{ scale: 0.985 }}
        className={`relative w-full overflow-hidden text-left cursor-pointer transition-colors duration-200 ${className}`}
      >
        {/* Subtle dynamic cursor-following spotlight glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(280px circle at ${spotlightX} ${spotlightY}, ${glowRgba}, transparent 70%)`,
          }}
        />

        <div className="relative z-10 w-full">{children}</div>
      </motion.button>
    </div>
  );
}
