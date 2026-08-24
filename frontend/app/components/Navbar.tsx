"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import {
  NeumorphicShieldCheckIcon,
  NeumorphicRadarIcon,
  NeumorphicTreeIcon,
  NeumorphicSpikeIcon,
} from "@/components/icons/NeumorphicIcons";
import { Terminal, ExternalLink } from "lucide-react";

// ─── Magnetic Portal Component with Cursor Tracking ───────────────────────────
interface MagneticPortalProps {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

function MagneticPortal({ children, strength = 0.25, className = "" }: MagneticPortalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 180, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distanceX = (e.clientX - centerX) * strength;
    const distanceY = (e.clientY - centerY) * strength;
    x.set(distanceX);
    y.set(distanceY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={`relative ${className}`}
    >
      {children}
    </motion.div>
  );
}

// ─── Main Floating Kinetic Capsule Navbar (Hover-Only Expand) ───────────────────
export default function Navbar() {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [hoveredPortal, setHoveredPortal] = useState<string | null>(null);

  const navItems = [
    {
      id: "summary",
      name: "Executive Summary",
      shortName: "Summary",
      href: "/",
      icon: NeumorphicSpikeIcon,
      accent: "#F2B8C6",
    },
    {
      id: "console",
      name: "Risk Console",
      shortName: "Console",
      href: "/console",
      icon: NeumorphicRadarIcon,
      accent: "#A8B5E0",
    },
    {
      id: "evidence",
      name: "Evidence Dossier",
      shortName: "Dossier",
      href: "/evidence",
      icon: NeumorphicTreeIcon,
      accent: "#A8B5E0",
    },
  ];

  // Resting state is ALWAYS compact/minimal. ONLY expands on active cursor hover.
  const isCompact = !isHovered;

  return (
    <header className="fixed top-4 sm:top-5 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: -30, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredPortal(null);
        }}
        layout
        className={`pointer-events-auto relative flex items-center transition-all duration-300 ease-out select-none ${
          isCompact
            ? "clay-card px-3.5 py-2 gap-2.5 rounded-full border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_20px_rgba(242,184,198,0.10)] bg-[#0A0A0D]/92 backdrop-blur-2xl"
            : "clay-card px-4 sm:px-5 py-2.5 sm:py-3 gap-3 sm:gap-4 rounded-3xl sm:rounded-full border border-white/12 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_25px_rgba(242,184,198,0.12)] bg-[#0C0C10]/95 backdrop-blur-2xl"
        }`}
      >
        {/* Brand Emblem Portal */}
        <MagneticPortal strength={0.2}>
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E1E28] to-[#0A0A0E] border border-[#F2B8C6]/30 text-[#F2B8C6] shadow-sm group-hover:border-[#F2B8C6] transition-colors">
              <NeumorphicShieldCheckIcon size={20} />
              {/* Subtle Ambient Pulse Ring */}
              <span className="absolute inset-0 rounded-2xl bg-[#F2B8C6]/10 animate-ping opacity-25"></span>
            </div>

            <AnimatePresence>
              {!isCompact && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden md:flex flex-col overflow-hidden whitespace-nowrap pr-1"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-black text-sm tracking-tight text-[#F7F6F3]">
                      SentinelPay
                    </span>
                    <span className="clay-badge-rose px-1.5 py-0.2 text-[9px] font-mono font-bold">
                      v1.0
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8E8E98] font-mono leading-none">
                    Fraud Intelligence
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </MagneticPortal>

        {/* Vertical Clay Inset Divider */}
        <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-white/12 to-transparent mx-0.5"></div>

        {/* Magnetic Navigation Portals Deck */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isItemHovered = hoveredPortal === item.id;

            return (
              <MagneticPortal key={item.id} strength={0.3}>
                <Link
                  href={item.href}
                  onMouseEnter={() => setHoveredPortal(item.id)}
                  onMouseLeave={() => setHoveredPortal(null)}
                  className={`relative flex items-center gap-2 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isCompact
                      ? "p-2"
                      : "px-3 py-1.5 sm:px-3.5 sm:py-2"
                  } ${
                    isActive
                      ? "clay-card-selected text-[#F7F6F3]"
                      : "clay-card-interactive text-[#8E8E98] hover:text-[#F7F6F3]"
                  }`}
                >
                  {/* Neumorphic Icon */}
                  <div className="relative">
                    <Icon
                      size={18}
                      className={isActive ? "opacity-100 scale-105" : "opacity-75"}
                    />
                    {isActive && (
                      <motion.span
                        layoutId="activeDot"
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#F2B8C6]"
                      />
                    )}
                  </div>

                  {/* Expandable Label */}
                  <AnimatePresence>
                    {(!isCompact || isItemHovered) && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden whitespace-nowrap text-xs font-heading font-medium tracking-tight"
                      >
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </MagneticPortal>
            );
          })}
        </nav>

        {/* Vertical Clay Inset Divider */}
        <div className="h-6 w-[1px] bg-gradient-to-b from-transparent via-white/12 to-transparent mx-0.5"></div>

        {/* System Active Telemetry Pill & OpenAPI Shortcut */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Engine Status Indicator */}
          <MagneticPortal strength={0.2}>
            <div
              className={`flex items-center gap-1.5 rounded-2xl clay-card-inset text-xs font-mono transition-all ${
                isCompact ? "p-2" : "px-2.5 py-1.5 text-[11px]"
              } text-[#A8B5E0]`}
              title="FastAPI Sub-10ms Engine Active"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A8B5E0] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A8B5E0]"></span>
              </span>
              <AnimatePresence>
                {!isCompact && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden sm:inline overflow-hidden whitespace-nowrap font-medium"
                  >
                    Active
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </MagneticPortal>

          {/* OpenAPI Docs Portal */}
          <MagneticPortal strength={0.25}>
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-1.5 rounded-2xl clay-card-interactive text-xs font-mono text-[#8E8E98] hover:text-[#F7F6F3] transition-colors ${
                isCompact ? "p-2" : "px-2.5 py-1.5 text-[11px]"
              }`}
              title="Inspect OpenAPI Schema Documentation"
            >
              <Terminal className="h-3.5 w-3.5 text-[#F2B8C6]" />
              <AnimatePresence>
                {!isCompact && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hidden lg:inline overflow-hidden whitespace-nowrap text-[#8E8E98]"
                  >
                    API
                  </motion.span>
                )}
              </AnimatePresence>
              <ExternalLink className="h-2.5 w-2.5 text-[#5A5A65] hidden sm:inline" />
            </a>
          </MagneticPortal>
        </div>
      </motion.div>
    </header>
  );
}
