"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import {
  Server,
  Activity,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Terminal,
  Cpu,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useBackendWarmup } from "../../hooks/useBackendWarmup";

// Realistic Cold Start Terminal Logs
const TERMINAL_LOGS = [
  { prefix: "[SYS]", text: "Handshaking FastAPI container gateway...", color: "text-[#8E8E98]" },
  { prefix: "[HOST]", text: "Waking Render free-tier inference instance...", color: "text-[#A8B5E0]" },
  { prefix: "[ENV]", text: "Allocating Python 3.11 runtime & libgomp...", color: "text-[#8E8E98]" },
  { prefix: "[ML]", text: "Loading XGBoost model (scale_pos_weight=578.55)...", color: "text-[#F2B8C6]" },
  { prefix: "[SHAP]", text: "Pre-warming shap.TreeExplainer for zero cold-start...", color: "text-[#F2B8C6]" },
  { prefix: "[GRAPH]", text: "Initializing entity linkage & ring detector...", color: "text-[#A8B5E0]" },
  { prefix: "[STREAM]", text: "Binding in-memory sliding window ring buffer...", color: "text-[#8E8E98]" },
  { prefix: "[READY]", text: "Cluster online · Sub-10ms decision SLA ready", color: "text-[#A8B5E0]" },
];

// 3D Soft Matte Clay Capsule/Orb Component
function ClayWarmupObject({ isReady }: { isReady: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const speed = isReady ? 3.0 : 1.2;
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8 * speed;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 1.5) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x += delta * 0.5 * speed;
      ringRef.current.rotation.z += delta * 0.6 * speed;
    }
  });

  const bodyColor = isReady ? "#A8B5E0" : "#F2B8C6";
  const ringColor = isReady ? "#F2B8C6" : "#A8B5E0";

  return (
    <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.8}>
      <group position={[0, 0, 0]}>
        {/* Central Smooth Clay Pill / Rounded Cylinder */}
        <mesh ref={meshRef}>
          <capsuleGeometry args={[0.55, 0.75, 16, 32]} />
          <meshStandardMaterial
            color={bodyColor}
            roughness={0.58}
            metalness={0.12}
            emissive={bodyColor}
            emissiveIntensity={0.15}
          />
        </mesh>

        {/* Orbiting Clay Torus Ring */}
        <mesh ref={ringRef} scale={[0.85, 0.85, 0.85]}>
          <torusGeometry args={[0.95, 0.12, 16, 48]} />
          <meshStandardMaterial
            color={ringColor}
            roughness={0.62}
            metalness={0.15}
            emissive={ringColor}
            emissiveIntensity={0.18}
          />
        </mesh>
      </group>
    </Float>
  );
}

export default function ColdStartClayHUD() {
  const { isWarmingUp, isReady, elapsedSeconds, retryCount, apiHealthData } = useBackendWarmup();
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [logIndex, setLogIndex] = useState<number>(0);

  // Cycle terminal loading lines progressively based on elapsed time
  useEffect(() => {
    if (isReady) {
      setLogIndex(TERMINAL_LOGS.length - 1);
      return;
    }

    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % (TERMINAL_LOGS.length - 1));
    }, 2800);

    return () => clearInterval(interval);
  }, [isReady]);

  // If backend is already fast/awake on initial load, do not show HUD
  if (!isWarmingUp && !isReady) return null;

  return (
    <AnimatePresence>
      {isWarmingUp && (
        <motion.aside
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.9, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[390px] select-none pointer-events-auto"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#070709]/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] transition-all">
            {/* Ambient clay glow gradient backdrop */}
            <div
              className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700 ${
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
                  {isReady ? "Cluster Operational" : "Inference Node Warmup"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/5 border border-white/10 text-[#8E8E98]">
                  Render Free-Tier
                </span>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  title={isMinimized ? "Expand HUD" : "Minimize HUD"}
                  className="p-1 rounded-lg text-[#8E8E98] hover:text-[#F7F6F3] hover:bg-white/5 transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minimize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Minimized Compact View */}
            {isMinimized ? (
              <div className="px-4 py-3 flex items-center justify-between text-xs font-mono text-[#8E8E98]">
                <span>Waking cluster: {elapsedSeconds}s</span>
                <span className="text-[#F2B8C6] font-bold">Attempt #{retryCount + 1}</span>
              </div>
            ) : (
              /* Expanded Rich Telemetry View */
              <div className="p-4 space-y-4">
                {/* 3D Clay Orb + Live Metrics Row */}
                <div className="flex items-center gap-3">
                  {/* 3D Canvas viewport */}
                  <div className="relative w-20 h-20 rounded-2xl bg-[#0B0B10] border border-white/5 overflow-hidden flex-shrink-0 shadow-inner">
                    <Canvas
                      camera={{ position: [0, 0, 3], fov: 42 }}
                      gl={{ antialias: true, alpha: true }}
                    >
                      <ambientLight intensity={1.2} />
                      <directionalLight position={[3, 4, 3]} intensity={1.8} />
                      <pointLight position={[-3, -2, -1]} intensity={0.6} color="#A8B5E0" />
                      <ClayWarmupObject isReady={isReady} />
                    </Canvas>
                  </div>

                  {/* Telemetry Stats */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-heading font-black text-[#F7F6F3] truncate">
                        {isReady ? "Inference Ready" : "Active Node Spin-up"}
                      </span>
                      <span className="text-xs font-mono font-bold text-[#F2B8C6]">
                        {elapsedSeconds}s elapsed
                      </span>
                    </div>

                    <p className="text-[11px] font-mono text-[#8E8E98] leading-tight line-clamp-2">
                      {isReady
                        ? "FastAPI server & SHAP TreeExplainer pre-warmed."
                        : "Container instance waking from spin-down. Cold start takes ~30-45s on free tier."}
                    </p>

                    {/* Progress indicator bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isReady ? "bg-[#A8B5E0]" : "bg-gradient-to-r from-[#F2B8C6] to-[#A8B5E0]"
                        }`}
                        animate={{
                          width: isReady
                            ? "100%"
                            : `${Math.min(95, Math.max(15, (elapsedSeconds / 45) * 100))}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Simulated Real-Time Terminal Log Ticker */}
                <div className="rounded-2xl bg-[#040406] border border-white/5 p-3 space-y-1.5 shadow-inner">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8E8E98] pb-1 border-b border-white/5">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3 h-3 text-[#A8B5E0]" /> Cluster Event Stream
                    </span>
                    <span className="text-[9px] text-[#8E8E98]">
                      Ping #{retryCount + 1}
                    </span>
                  </div>

                  <div className="h-8 flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={logIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25 }}
                        className="text-[10px] font-mono flex items-center gap-1.5 truncate"
                      >
                        <span className="font-bold text-[#A8B5E0]">
                          {TERMINAL_LOGS[logIndex].prefix}
                        </span>
                        <span className={TERMINAL_LOGS[logIndex].color}>
                          {TERMINAL_LOGS[logIndex].text}
                        </span>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer Micro-Badge */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#8E8E98] pt-1">
                  <span className="flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-[#8E8E98]" /> 0.17% Class-Ratio Engine
                  </span>
                  <span className="text-[#A8B5E0] font-bold">
                    {isReady ? "Ready for Traffic" : "Initializing..."}
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
