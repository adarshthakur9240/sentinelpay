"use client";

import { useEffect, useRef, ReactNode } from "react";
// Use the renamed package — @studio-freight/lenis re-exports from lenis
// but installed as @studio-freight/lenis 1.0.x
import Lenis from "@studio-freight/lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface LenisProviderProps {
  children: ReactNode;
}

export default function LenisProvider({ children }: LenisProviderProps) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      smoothWheel: true,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    // Sync Lenis with GSAP ScrollTrigger so both systems
    // read the same scroll position — critical for pinned sections
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time: number) => {
      lenis.raf(time * 1000);
    });

    // Prevent GSAP from adding its own requestAnimationFrame loop
    // when using Lenis — they share the ticker
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time: number) => {
        lenis.raf(time * 1000);
      });
    };
  }, []);

  return <>{children}</>;
}
