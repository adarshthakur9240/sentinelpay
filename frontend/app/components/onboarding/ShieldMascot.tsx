"use client";

import { motion } from "framer-motion";

interface ShieldMascotProps {
  size?: number;
  mood?: "happy" | "analyzing" | "pointing";
  className?: string;
}

export default function ShieldMascot({
  size = 48,
  mood = "happy",
  className = "",
}: ShieldMascotProps) {
  return (
    <motion.div
      animate={{ y: [0, -3.5, 0] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mascotBody" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1C1C24" />
            <stop offset="50%" stopColor="#101015" />
            <stop offset="100%" stopColor="#08080B" />
          </linearGradient>
          <linearGradient id="mascotRim" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCE2E9" />
            <stop offset="50%" stopColor="#F2B8C6" />
            <stop offset="100%" stopColor="#A8B5E0" />
          </linearGradient>
          <filter id="mascotGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F2B8C6" floodOpacity="0.2" />
            <feDropShadow dx="2" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.8" />
          </filter>
        </defs>

        {/* Shield Body */}
        <path
          d="M24 4 L39 9 V22 C39 32.5 32.5 39 24 44 C15.5 39 9 32.5 9 22 V9 L24 4 Z"
          fill="url(#mascotBody)"
          stroke="url(#mascotRim)"
          strokeWidth="2"
          filter="url(#mascotGlow)"
        />

        {/* Inner Clay Inset */}
        <path
          d="M24 7 L36 11 V22 C36 30.5 30.5 36 24 40 C17.5 36 12 30.5 12 22 V11 L24 7 Z"
          fill="#0B0B0E"
          opacity="0.6"
        />

        {/* Mascot Eyes */}
        <g>
          {/* Left Eye */}
          <circle cx="19" cy="20" r="2.4" fill="#F7F6F3" />
          <motion.circle
            cx="19.5"
            cy="19.5"
            r="1"
            fill="#050505"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
          />
          {/* Left Blush Cheek */}
          <circle cx="16" cy="23" r="1.8" fill="#F2B8C6" opacity="0.75" />

          {/* Right Eye */}
          <circle cx="29" cy="20" r="2.4" fill="#F7F6F3" />
          <motion.circle
            cx="28.5"
            cy="19.5"
            r="1"
            fill="#050505"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
          />
          {/* Right Blush Cheek */}
          <circle cx="32" cy="23" r="1.8" fill="#F2B8C6" opacity="0.75" />
        </g>

        {/* Mascot Smile / Expression */}
        {mood === "happy" && (
          <path
            d="M21 25.5 Q24 28.5 27 25.5"
            stroke="#F7F6F3"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
        {mood === "analyzing" && (
          <path
            d="M21 26 H27"
            stroke="#A8B5E0"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}
        {mood === "pointing" && (
          <path
            d="M21 25 Q24 27.5 27 25"
            stroke="#F2B8C6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        )}

        {/* Sparkle on Top */}
        <motion.circle
          cx="24"
          cy="7"
          r="1.2"
          fill="#A8B5E0"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  );
}
