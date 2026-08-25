"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring } from "framer-motion";

interface SpringOvershootCounterProps {
  targetValue: number; // e.g. 0.9998 or 0.0012 (0.0 to 1.0)
  suffix?: string;
  decimals?: number;
  className?: string;
}

export default function SpringOvershootCounter({
  targetValue,
  suffix = "%",
  decimals = 1,
  className = "",
}: SpringOvershootCounterProps) {
  // Target percentage e.g. 99.98
  const targetPct = targetValue * 100;

  // Satisfying spring physics with noticeable physical overshoot
  const spring = useSpring(0, {
    stiffness: 75,
    damping: 11,
    mass: 0.9,
    restDelta: 0.01,
  });

  const [displayValue, setDisplayValue] = useState<string>("0.0");

  useEffect(() => {
    // Reset and spring to target
    spring.set(0);
    const timeout = setTimeout(() => {
      spring.set(targetPct);
    }, 40);

    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.max(0, latest).toFixed(decimals));
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [targetPct, spring, decimals]);

  return (
    <motion.span
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-block font-mono font-black tabular-nums tracking-tight ${className}`}
    >
      {displayValue}
      {suffix}
    </motion.span>
  );
}
