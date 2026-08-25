"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import {
  Terminal,
  Cpu,
  Minimize2,
  Maximize2,
  X,
  CheckCircle2,
  Server,
  Zap,
  Clock,
} from "lucide-react";
import { useBackendWarmup } from "../../hooks/useBackendWarmup";

// Rotating status messages framed positively, explaining WHY with honesty regarding free-tier hosting
const ROTATING_STATUS_MESSAGES = [
  {
    prefix: "[INIT]",
    text: "Spinning up the inference engine container…",
    color: "text-[#F2B8C6]",
    detail: "Allocating Python 3.11 container & libgomp runtime",
  },
  {
    prefix: "[ENGINE]",
    text: "Loading XGBoost + SHAP TreeExplainer…",
    color: "text-[#A8B5E0]",
    detail: "Pre-warming cost-sensitive tree splits (scale_pos_weight=578.55)",
  },
  {
    prefix: "[GRAPH]",
    text: "Initializing entity linkage & fraud-ring detector…",
    color: "text-[#F2B8C6]",
    detail: "Mounting high-speed in-memory transaction buffer",
  },
  {
    prefix: "[HOST]",
    text: "Almost there — free-tier hosting naps after 15 minutes idle",
    color: "text-[#A8B5E0]",
    detail: "Free-tier spins down to conserve compute; waking takes ~30-45s",
  },
  {
    prefix: "[READY]",
    text: "Finalizing sub-10ms decision pipeline & health checks…",
    color: "text-[#F2B8C6]",
    detail: "Handshaking FastAPI gateway for sub-10ms decision SLA",
  },
];

// 3D Soft Matte Clay Capsule / Orb Component with Dynamic "Charging Up" Glow
function ClayWarmupObject({
  isReady,
  progressPercent,
}: {
  isReady: boolean;
  progressPercent: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const speed = isReady ? 3.2 : 1.0 + (progressPercent / 100) * 0.8;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8 * speed;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.6) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.6 * speed;
      ringRef.current.rotation.z += delta * 0.7 * speed;
    }
  });

  const bodyColor = isReady ? "#A8B5E0" : "#F2B8C6";
  const ringColor = isReady ? "#F2B8C6" : "#A8B5E0";
  const emissiveInt = isReady ? 0.35 : 0.12 + (progressPercent / 100) * 0.25;

  return (
    <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.8}>
      <group position={[0, 0, 0]}>
        {/* Central Smooth Clay Pill */}
        <mesh ref={meshRef}>
          <capsuleGeometry args={[0.55, 0.75, 16, 32]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.58}
            metalness={0.12}
            emissive={bodyColor}
            emissiveIntensity={emissiveInt}
          />
        </mesh>

        {/* Orbiting Clay Torus Ring */}
        <mesh ref={ringRef} scale={[0.88, 0.88, 0.88]}>
          <torusGeometry args={[0.98, 0.12, 16, 48]} />
          <meshStandardMaterial
            color={ringColor}
            roughness={0.62}
            metalness={0.15}
            emissive={ringColor}
            emissiveIntensity={emissiveInt * 1.1}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function ColdStartClayHUD() {
  const {
    isWarmingUp,
    isReady,
    elapsedSeconds,
    retryCount,
    dismissWarmup,
  } = useBackendWarmup();

  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [msgIndex, setMsgIndex] = useState<number>(0);

  // Rotate through explanatory status messages every 4.5s
  useEffect(() => {
    if (isReady) {
      setMsgIndex(ROTATING_STATUS_MESSAGES.length - 1);
      return;
    }

    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % ROTATING_STATUS_MESSAGES.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isReady]);

  // Estimate progress based on typical 40-45s Render free-tier cold boot
  const estimatedTotal = 45;
  const progressPercent = isReady
    ? 100
    : Math.min(94, Math.max(8, Math.round((elapsedSeconds / estimatedTotal) * 100)));

  // SVG Circular progress calculations (Radius = 38, Perimeter = 2 * PI * 38 = ~238.76)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentMsg = ROTATING_STATUS_MESSAGES[msgIndex];

  return (
    <AnimatePresence mode="wait">
      {isWarmingUp && (
        <motion.aside
          key="cold-start-clay-hud"
          initial={{ opacity: 0, y: 36, scale: 0.92, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          exit={{
            opacity: 0,
            y: 28,
            scale: 0.92,
            filter: "blur(10px)",
            transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 w-[370px] sm:w-[410px] select-none pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070709]/95 backdrop-blur-2xl shadow-[0_24px_60px_rgba(0,0,0,0.92),0_0_30px_rgba(242,184,198,0.12)] transition-all">
            {/* Ambient pastel glow gradient backdrop */}
            <div
              className={`absolute -top-14 -right-14 w-44 h-44 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700 ${
                isReady ? "bg-[#A8B5E0]" : "bg-[#F2B8C6]"
              }`}
            />

            {/* HUD Header Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      isReady ? "bg-[#A8B5E0]" : "bg-[#F2B8C6]"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isReady ? "bg-[#A8B5E0]" : "bg-[#F2B8C6]"
                    }`}
                  />
                </span>
                <span className="font-mono text-[11px] font-bold tracking-wider uppercase text-[#F7F6F3]">
                  {isReady ? "Inference Engine Online" : "Inference Node Warmup"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-[#8E8E98]">
                  Render Free-Tier
                </span>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand HUD" : "Minimize HUD"}
                  className="p-1 rounded-lg text-[#8E8E98] hover:text-[#F7F6F3] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minimize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={dismissWarmup}
                  title="Dismiss HUD (will auto-reopen on error)"
                  className="p-1 rounded-lg text-[#8E8E98] hover:text-[#F7F6F3] hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Minimized Compact View */}
            {isMinimized ? (
              <div className="px-4 py-3 flex items-center justify-between text-xs font-mono text-[#8E8E98]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#F2B8C6]" />
                  <span>Waking up: <strong className="text-[#F7F6F3]">{elapsedSeconds}s</strong> elapsed</span>
                </div>
                <span className="text-[#F2B8C6] font-bold text-[11px]">{progressPercent}%</span>
              </div>
            ) : (
              /* Expanded Rich Telemetry View */
              <div className="p-4 space-y-4">
                {/* 3D Clay Orb with Surrounding Radial Progress Ring */}
                <div className="flex items-center gap-4">
                  {/* Radial Progress Ring with embedded 3D Three.js Canvas */}
                  <div className="relative w-22 h-22 flex-shrink-0 flex items-center justify-center">
                    {/* SVG Circular Progress Meter */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 88 88">
                      {/* Background track */}
                      <circle
                        cx="44"
                        cy="44"
                        r={radius}
                        className="stroke-white/10"
                        strokeWidth="3.5"
                        fill="none"
                      />
                      {/* Animated Filling Progress Ring */}
                      <motion.circle
                        cx="44"
                        cy="44"
                        r={radius}
                        stroke={isReady ? "#A8B5E0" : "#F2B8C6"}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        fill="none"
                        style={{
                          strokeDasharray: circumference,
                          strokeDashoffset: strokeDashoffset,
                          transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease",
                        }}
                      />
                    </svg>

                    {/* Embedded 3D Canvas */}
                    <div className="w-17 h-17 rounded-full bg-[#0B0B10] overflow-hidden flex items-center justify-center shadow-inner">
                      <Canvas
                        camera={{ position: [0, 0, 3], fov: 42 }}
                        gl={{ antialias: true, alpha: true }}
                      >
                        <ambientLight intensity={1.2} />
                        <directionalLight position={[3, 4, 3]} intensity={1.8} />
                        <pointLight position={[-3, -2, -1]} intensity={0.6} color="#A8B5E0" />
                        <ClayWarmupObject
                          isReady={isReady}
                          progressPercent={progressPercent}
                        />
                      </Canvas>
                    </div>
                  </div>

                  {/* Telemetry Stats & Live Counter */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-heading font-black text-[#F7F6F3] truncate flex items-center gap-1.5">
                        {isReady ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#A8B5E0]" />
                            <span>Inference Ready</span>
                          </>
                        ) : (
                          <span>Active Node Spin-up</span>
                        )}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#F2B8C6]">
                        {elapsedSeconds}s elapsed
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-[#8E8E98] leading-tight line-clamp-2">
                      {isReady
                        ? "FastAPI server & TreeExplainer online. Sub-10ms decision pipeline ready."
                        : currentMsg.detail}
                    </p>

                    {/* Progress Percentage & Estimated Time bar */}
                    <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-[#8E8E98]">
                      <span>{isReady ? "Ready" : "Charging cache..."}</span>
                      <span className="font-bold text-[#F7F6F3]">{progressPercent}%</span>
                    </div>
                  </div>
                </div>

                {/* Rotating Positive Status Message Banner */}
                <div className="rounded-2xl bg-[#040406] border border-white/5 p-3 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E8E98] pb-1 border-b border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-[#A8B5E0]" /> Cluster Event Stream
                    </span>
                    <span className="text-[9px] text-[#8E8E98]">
                      Ping #{retryCount + 1}
                    </span>
                  </div>

                  <div className="min-h-7 flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={msgIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.28 }}
                        className="text-[11px] font-mono flex items-center gap-1.5 leading-snug"
                      >
                        <span className="font-bold text-[#A8B5E0] text-[10px]">
                          {currentMsg.prefix}
                        </span>
                        <span className={currentMsg.color}>
                          {currentMsg.text}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer Micro-Badge with Fast SLA Info */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8E8E98] pt-0.5">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#8E8E98]" /> 0.17% Class-Ratio Engine
                  </span>
                  <span className="text-[#A8B5E0] font-bold">
                    {isReady ? "Sub-10ms Decision SLA" : "Auto-waking..."}
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
