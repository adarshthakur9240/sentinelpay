"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, animate } from "framer-motion";
import {
  NeumorphicRadarIcon,
  NeumorphicShieldCheckIcon,
  NeumorphicSliderScaleIcon,
  NeumorphicSpikeIcon,
} from "@/components/icons/NeumorphicIcons";
import {
  ChevronRight,
  ArrowRight,
  Terminal,
  ExternalLink,
  Cpu,
  Zap,
  Activity,
  Layers,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { API_DOCS_URL } from "@/lib/config";

gsap.registerPlugin(ScrollTrigger);

// Lazy-load the soft 3D clay studio spine — SSR-safe
const HeroTunnel = dynamic(
  () => import("./components/three/hero-tunnel"),
  { ssr: false, loading: () => null }
);

// ─── Animated Counter Component ────────────────────────────────────────────────
interface CounterProps {
  from: number;
  to: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  triggerKey?: boolean;
}

function AnimatedCounter({
  from,
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.6,
  className = "",
  triggerKey = true,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    if (!triggerKey) return;
    const node = ref.current;

    if (hasRun) {
      if (node) {
        node.textContent = prefix + to.toFixed(decimals) + suffix;
      }
      return;
    }
    setHasRun(true);

    if (!node) return;

    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        if (node) {
          node.textContent = prefix + value.toFixed(decimals) + suffix;
        }
      },
      onComplete() {
        if (node) {
          node.textContent = prefix + to.toFixed(decimals) + suffix;
        }
      },
    });

    return () => {
      controls.stop();
      if (node) {
        node.textContent = prefix + to.toFixed(decimals) + suffix;
      }
    };
  }, [triggerKey, hasRun, from, to, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {to.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  const scrollStageRef = useRef<HTMLDivElement>(null);
  const pinnedContainerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // HUD spec modules for Section 4
  const hudModules = [
    {
      id: "mod-1",
      title: "MODEL CORE",
      value: "XGBoost scale_pos_weight=578.55",
      badge: "OPTIMIZED",
      badgeClass: "clay-badge-periwinkle",
      icon: Cpu,
    },
    {
      id: "mod-2",
      title: "EXPLAINABILITY",
      value: "shap.TreeExplainer (Exact Shapley)",
      badge: "ACTIVE",
      badgeClass: "clay-badge-rose",
      icon: Layers,
    },
    {
      id: "mod-3",
      title: "INFERENCE SPEED",
      value: "FastAPI Sub-10ms Lifespan",
      badge: "LIVE",
      badgeClass: "clay-badge-periwinkle",
      icon: Zap,
    },
    {
      id: "mod-4",
      title: "HELD-OUT METRIC",
      value: "PR-AUC 0.8424 Test Split",
      badge: "VERIFIED",
      badgeClass: "clay-badge-periwinkle",
      icon: Activity,
    },
    {
      id: "mod-5",
      title: "COST MATRIX",
      value: "Parametric $122.21 vs $5 Surface",
      badge: "t = 0.10",
      badgeClass: "clay-badge-rose",
      icon: CheckCircle2,
    },
    {
      id: "mod-6",
      title: "DATA SPLIT",
      value: "Stratified 70/15/15 Distribution",
      badge: "BALANCED",
      badgeClass: "clay-pill text-[#8E8E98]",
      icon: Lock,
    },
  ];

  // GSAP ScrollTrigger Master Pin & Progress Tracker
  useEffect(() => {
    if (!scrollStageRef.current || !pinnedContainerRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scrollStageRef.current,
        start: "top top",
        end: "+=4500px",
        pin: pinnedContainerRef.current,
        pinSpacing: true,
        scrub: 1.2,
        anticipatePin: 1,
        onUpdate: (self) => {
          setScrollProgress(self.progress);
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // Compute opacity & visibility per landmark from scrollProgress
  // 1. Hero: [0.00 -> 0.18]
  const heroOpacity = Math.max(0, Math.min(1, 1 - (scrollProgress - 0.08) / 0.10));
  const isHeroActive = scrollProgress < 0.18;

  // 2. Insight: [0.18 -> 0.44]
  const insightOpacity =
    scrollProgress < 0.18
      ? 0
      : scrollProgress < 0.22
      ? (scrollProgress - 0.18) / 0.04
      : scrollProgress < 0.40
      ? 1
      : Math.max(0, 1 - (scrollProgress - 0.40) / 0.04);
  const isInsightActive = scrollProgress >= 0.18 && scrollProgress < 0.44;

  // Insight line reveals (scrubbed)
  const line1Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.19) / 0.06));
  const line1Y = Math.max(0, (1 - line1Opacity) * 28);

  const line2Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.26) / 0.06));
  const line2Y = Math.max(0, (1 - line2Opacity) * 28);

  const line3Opacity = Math.max(0, Math.min(1, (scrollProgress - 0.33) / 0.06));
  const line3Y = Math.max(0, (1 - line3Opacity) * 28);

  // 3. Metrics: [0.44 -> 0.70]
  const metricsOpacity =
    scrollProgress < 0.44
      ? 0
      : scrollProgress < 0.48
      ? (scrollProgress - 0.44) / 0.04
      : scrollProgress < 0.66
      ? 1
      : Math.max(0, 1 - (scrollProgress - 0.66) / 0.04);
  const isMetricsActive = scrollProgress >= 0.44 && scrollProgress < 0.70;

  // 4. Engine & Control Panel: [0.70 -> 0.90]
  const ctaOpacity =
    scrollProgress < 0.70
      ? 0
      : scrollProgress < 0.74
      ? (scrollProgress - 0.70) / 0.04
      : scrollProgress < 0.88
      ? 1
      : Math.max(0, 1 - (scrollProgress - 0.88) / 0.03);
  const isCtaActive = scrollProgress >= 0.70 && scrollProgress < 0.90;

  // 5. Concluding Platform Footer: [0.90 -> 1.00]
  const footerOpacity =
    scrollProgress < 0.90 ? 0 : Math.min(1, (scrollProgress - 0.90) / 0.05);
  const isFooterActive = scrollProgress >= 0.90;

  // Waypoints definition for progress sidebar indicator
  const waypoints = [
    { id: "hero", label: "01 HERO", range: [0, 0.18], active: isHeroActive },
    { id: "insight", label: "02 INSIGHT", range: [0.18, 0.44], active: isInsightActive },
    { id: "metrics", label: "03 METRICS", range: [0.44, 0.70], active: isMetricsActive },
    { id: "engine", label: "04 ENGINE", range: [0.70, 0.90], active: isCtaActive },
    { id: "platform", label: "05 PLATFORM", range: [0.90, 1.00], active: isFooterActive },
  ];

  return (
    <div
      id="landing-scroll-stage"
      ref={scrollStageRef}
      className="relative w-full bg-[#050505] text-[#F7F6F3]"
    >
      {/* ── PERSISTENT FULL-PAGE 3D STUDIO BACKDROP (Z-0) ────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <HeroTunnel />
        </Suspense>
      </div>

      {/* Atmospheric Soft Neutral Pure-Black Vignette */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 20%, #050505 92%)",
        }}
      />

      {/* ── MASTER PINNED 100VH STAGE (Zero Native Vertical Scroll Layout Shift) ── */}
      <div
        ref={pinnedContainerRef}
        className="relative z-10 w-full h-screen overflow-hidden select-none"
      >
        {/* ── WAYPOINT HUD FLIGHT INDICATOR (Desktop Right Edge) ── */}
        <div className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-50 flex-col items-end gap-3 pointer-events-none">
          <div className="text-[9px] font-mono uppercase tracking-widest text-[#8E8E98] mb-1">
            FLIGHT PATH
          </div>
          {waypoints.map((wp) => (
            <div
              key={wp.id}
              className={`flex items-center gap-2.5 transition-all duration-300 font-mono text-[10px] ${
                wp.active
                  ? "text-[#F2B8C6] scale-105 font-bold"
                  : "text-[#8E8E98]/50"
              }`}
            >
              <span>{wp.label}</span>
              <span
                className={`h-2 rounded-full transition-all duration-300 ${
                  wp.active
                    ? "w-4 bg-[#F2B8C6] shadow-[0_0_8px_#F2B8C6]"
                    : "w-2 bg-[#1E1E23]"
                }`}
              />
            </div>
          ))}
          {/* Scroll progress % */}
          <div className="mt-2 text-[10px] font-mono text-[#8E8E98]/70">
            {Math.round(scrollProgress * 100)}%
          </div>
        </div>

        {/* ── LANDMARK 1: Hero (Active: 0.00 -> 0.18) ───────────────────────── */}
        <div
          className={`absolute inset-0 flex flex-col items-center justify-center px-4 pt-24 sm:pt-28 pb-8 text-center transition-all duration-300 ${
            isHeroActive ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            opacity: heroOpacity,
            transform: `scale(${0.96 + heroOpacity * 0.04})`,
            visibility: heroOpacity > 0 ? "visible" : "hidden",
          }}
        >
          {/* Soft Product Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-4 sm:mb-6 inline-flex items-center gap-2.5 clay-pill px-4 sm:px-5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-mono font-medium text-[#F2B8C6] backdrop-blur-md"
          >
            <NeumorphicRadarIcon size={16} />
            <span>Real-Time Fraud Intelligence · Sub-10ms Inference</span>
          </motion.div>

          {/* Hero Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="font-heading font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl tracking-tight text-[#F7F6F3] max-w-5xl leading-[1.06]"
          >
            0.17% of transactions
            <br />
            <span className="text-pastel-gradient">
              are fraud.
            </span>
            <br />
            We built a system
            <br />
            <span className="text-[#8E8E98]">that finds them anyway.</span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.75 }}
            className="mt-4 sm:mt-5 max-w-2xl text-xs sm:text-sm md:text-base text-[#8E8E98] font-normal leading-relaxed px-4"
          >
            Cost-sensitive XGBoost (<code className="text-[#F2B8C6] font-mono font-bold">scale_pos_weight=578.55</code>) with
            native SHAP game-theoretic explainability. Held-out PR-AUC{" "}
            <strong className="text-[#F7F6F3] font-mono font-bold">0.8424</strong>, 98.22% false-alarm reduction.
          </motion.p>

          {/* Unified Glassmorphic Inline Action Console */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.95, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 sm:mt-8 flex justify-center"
          >
            <div className="clay-card inline-flex flex-col sm:flex-row items-center p-1.5 sm:p-2 rounded-2xl sm:rounded-full border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(242,184,198,0.08)] bg-[#0C0C10]/85 backdrop-blur-xl gap-2 select-none">
              <Link href="/console">
                <button
                  className="clay-btn-rose w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-heading font-bold text-[#050505] tracking-tight cursor-pointer group transition-all"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#050505] opacity-50"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#050505]"></span>
                  </span>
                  <span>Launch Risk Console</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>

              <Link href="/evidence">
                <button
                  className="clay-btn-surface w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-full text-xs sm:text-sm font-heading font-medium text-[#F7F6F3] cursor-pointer hover:border-[#A8B5E0]/30 transition-all"
                >
                  <span>SHAP Dispute Dossier</span>
                  <span className="clay-badge-periwinkle text-[10px] font-mono font-bold px-2 py-0.5">
                    PR-AUC: 0.8424
                  </span>
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1 }}
            className="mt-5 sm:mt-6 flex flex-col items-center gap-1.5 text-[11px] sm:text-xs font-mono text-[#8E8E98]"
          >
            <span>Scroll to navigate the 3D architecture</span>
            <div className="flex h-6 w-4 justify-center rounded-full border border-[#1E1E23] p-1 shadow-inner">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1 rounded-full bg-[#F2B8C6]"
              />
            </div>
          </motion.div>
        </div>

        {/* ── LANDMARK 2: The Insight (Active: 0.18 -> 0.44) ────────────────── */}
        <div
          className={`absolute inset-0 flex items-center justify-center px-6 pt-20 sm:pt-24 pb-8 text-center transition-all duration-300 ${
            isInsightActive ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            opacity: insightOpacity,
            transform: `scale(${0.96 + insightOpacity * 0.04})`,
            visibility: insightOpacity > 0 ? "visible" : "hidden",
          }}
        >
          <div className="relative mx-auto max-w-4xl">
            {/* Eyebrow */}
            <div className="mb-6 flex justify-center">
              <span className="clay-pill inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-mono text-[#F2B8C6] backdrop-blur-md">
                <NeumorphicSliderScaleIcon size={16} />
                <span>THE 0.17% CORE CHALLENGE</span>
              </span>
            </div>

            {/* Line 1 */}
            <p
              className="font-heading font-bold text-2xl sm:text-4xl md:text-5xl text-[#F7F6F3] leading-tight transition-all duration-200"
              style={{
                opacity: line1Opacity,
                transform: `translateY(${line1Y}px)`,
              }}
            >
              A naive model that predicts{" "}
              <span className="text-[#A8B5E0]">every transaction as legitimate</span>
              <br />
              achieves{" "}
              <span className="clay-badge-rose px-3 py-1 font-mono text-xl sm:text-3xl inline-block mt-2 font-bold">
                99.83% accuracy
              </span>
              .
            </p>

            {/* Line 2 */}
            <p
              className="mt-6 sm:mt-8 font-heading font-bold text-2xl sm:text-4xl md:text-5xl text-[#F7F6F3] leading-tight transition-all duration-200"
              style={{
                opacity: line2Opacity,
                transform: `translateY(${line2Y}px)`,
              }}
            >
              Yet it catches <span className="text-[#F2B8C6]">zero fraud</span>.
              <br />
              <span className="text-base font-normal text-[#8E8E98] sm:text-xl font-sans mt-2.5 block">
                Under extreme class imbalance, raw accuracy is mathematically meaningless.
              </span>
            </p>

            {/* Line 3 */}
            <p
              className="mt-6 sm:mt-8 font-heading font-bold text-xl sm:text-2xl md:text-3xl text-[#F7F6F3] leading-relaxed transition-all duration-200"
              style={{
                opacity: line3Opacity,
                transform: `translateY(${line3Y}px)`,
              }}
            >
              We trained directly on the{" "}
              <span className="text-[#A8B5E0]">Precision-Recall operating surface</span>,
              <br />
              minimized asymmetric financial friction ($5 FP vs $122.21 FN),
              <br />
              and engineered{" "}
              <span className="text-[#F2B8C6]">exact Shapley game-theoretic evidence</span>.
            </p>
          </div>
        </div>

        {/* ── LANDMARK 3: The Verified Metrics (Active: 0.44 -> 0.70) ───────── */}
        <div
          className={`absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 max-w-6xl mx-auto transition-all duration-300 ${
            isMetricsActive ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            opacity: metricsOpacity,
            transform: `scale(${0.96 + metricsOpacity * 0.04})`,
            visibility: metricsOpacity > 0 ? "visible" : "hidden",
          }}
        >
          <div className="w-full text-center">
            <div className="clay-pill inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-mono text-[#8E8E98]">
              <NeumorphicShieldCheckIcon size={16} />
              <span>HELD-OUT TEST SPLIT VALIDATION · N = 42,722 TRANSACTIONS</span>
            </div>
            <h2 className="mt-4 font-heading font-black text-2xl sm:text-4xl md:text-5xl text-[#F7F6F3] tracking-tight">
              Empirical Results Across Test Splits
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#8E8E98] max-w-xl mx-auto font-normal">
              Stratified 70/15/15 split. Evaluated on genuine precision, recall, and false-alarm costs.
            </p>

            {/* 4 Large Animated Claymorphic Counter Cards */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
              {/* Card 1: PR-AUC */}
              <div className="clay-card-rose p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#F2B8C6] uppercase font-bold">PR-AUC</span>
                  <NeumorphicSpikeIcon size={20} />
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-[#F7F6F3] tabular-nums">
                  <AnimatedCounter from={0} to={0.8424} decimals={4} triggerKey={isMetricsActive} />
                </div>
                <p className="mt-2 text-[11px] text-[#8E8E98] font-mono">
                  +0.0520 lift over balanced baseline (0.7904)
                </p>
              </div>

              {/* Card 2: Recall */}
              <div className="clay-card-periwinkle p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#A8B5E0] uppercase font-bold">Recall @ t=0.10</span>
                  <NeumorphicRadarIcon size={20} />
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-[#A8B5E0] tabular-nums">
                  <AnimatedCounter from={0} to={85.14} suffix="%" decimals={2} triggerKey={isMetricsActive} />
                </div>
                <p className="mt-2 text-[11px] text-[#8E8E98] font-mono">
                  63 of 74 fraud cases caught in test split
                </p>
              </div>

              {/* Card 3: FP Reduction */}
              <div className="clay-card-periwinkle p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#A8B5E0] uppercase font-bold">FP Reduction</span>
                  <NeumorphicSliderScaleIcon size={20} />
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-[#F7F6F3] tabular-nums">
                  <AnimatedCounter from={0} to={98.22} suffix="%" decimals={2} triggerKey={isMetricsActive} />
                </div>
                <p className="mt-2 text-[11px] text-[#8E8E98] font-mono">
                  901 → 16 false alarms vs balanced baseline
                </p>
              </div>

              {/* Card 4: FP Rate */}
              <div className="clay-card p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[#8E8E98] uppercase font-bold">False Alarm Rate</span>
                  <NeumorphicShieldCheckIcon size={20} />
                </div>
                <div className="font-heading font-black text-3xl sm:text-4xl text-[#F7F6F3] tabular-nums">
                  <AnimatedCounter from={0} to={3.7} suffix="" decimals={1} triggerKey={isMetricsActive} />
                </div>
                <p className="mt-2 text-[11px] text-[#8E8E98] font-mono">
                  FP per 10,000 processed transactions
                </p>
              </div>
            </div>

            {/* Model Benchmark Architecture Matrix */}
            <div className="mt-6 clay-card p-5 text-left">
              <div className="grid grid-cols-4 border-b border-[#1E1E23] pb-2.5 text-[11px] font-mono font-bold uppercase tracking-wider text-[#8E8E98]">
                <span>Model Architecture</span>
                <span className="text-center">PR-AUC (Test)</span>
                <span className="text-center">False Positives</span>
                <span className="text-right">Handling Strategy</span>
              </div>

              {[
                {
                  name: "Logistic Regression",
                  badge: "Baseline",
                  prauc: "0.7904",
                  fp: "901",
                  strategy: "class_weight='balanced'",
                  isWinner: false,
                },
                {
                  name: "XGBoost + SMOTE",
                  badge: "Oversampled",
                  prauc: "0.7421",
                  fp: "172",
                  strategy: "Synthetic interpolation",
                  isWinner: false,
                },
                {
                  name: "Cost-Sensitive XGBoost",
                  badge: "Production Engine",
                  prauc: "0.8424",
                  fp: "16",
                  strategy: "scale_pos_weight=578.55",
                  isWinner: true,
                },
              ].map((row) => (
                <div
                  key={row.name}
                  className={`grid grid-cols-4 items-center border-b border-[#1E1E23]/50 py-3 text-xs sm:text-sm last:border-0 ${
                    row.isWinner ? "bg-[#F2B8C6]/10 rounded-xl px-3 my-0.5" : "px-3"
                  }`}
                >
                  <div>
                    <span className={`font-heading font-bold ${row.isWinner ? "text-[#F2B8C6]" : "text-[#F7F6F3]"}`}>
                      {row.name}
                    </span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block text-[9px] font-mono font-bold px-2 py-0.2 ${
                          row.isWinner ? "clay-badge-rose" : "clay-pill text-[#8E8E98]"
                        }`}
                      >
                        {row.badge}
                      </span>
                    </div>
                  </div>

                  <div className={`text-center font-mono font-bold ${row.isWinner ? "text-[#F2B8C6]" : "text-[#F7F6F3]"}`}>
                    {row.prauc}
                  </div>

                  <div className="text-center font-mono text-[#F7F6F3] font-bold">
                    {row.fp}
                  </div>

                  <div className="text-right font-mono text-[11px] text-[#8E8E98]">
                    {row.strategy}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── LANDMARK 4: Interactive Control Panel (Active: 0.70 -> 0.90) ──── */}
        <div
          className={`absolute inset-0 flex items-center justify-center px-4 pt-20 sm:pt-24 pb-8 max-w-5xl mx-auto transition-all duration-300 ${
            isCtaActive ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            opacity: ctaOpacity,
            transform: `scale(${0.96 + ctaOpacity * 0.04})`,
            visibility: ctaOpacity > 0 ? "visible" : "hidden",
          }}
        >
          <div className="clay-card p-6 sm:p-8 w-full relative overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(242,184,198,0.12)] bg-[#0A0A0D]">
            {/* Top Architecture Status Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E1E23]/70">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2B8C6]/10 border border-[#F2B8C6]/30 text-[#F2B8C6]">
                  <NeumorphicSpikeIcon size={20} />
                </div>
                <div>
                  <span className="text-xs font-heading font-bold text-[#F7F6F3]">
                    Verified Architecture &amp; Live Interfaces
                  </span>
                  <span className="text-[10px] text-[#8E8E98] block">
                    Real-time scoring engine and automated dispute dossier
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="clay-badge-periwinkle px-3 py-0.5 flex items-center gap-1.5 text-[10px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A8B5E0] animate-pulse"></span>
                  <span>FastAPI Service Online</span>
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="mt-5 text-center space-y-2">
              <h2 className="font-heading font-black text-2xl sm:text-4xl text-[#F7F6F3] tracking-tight">
                Experience the Engine <span className="text-pastel-gradient">in Action.</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#8E8E98] max-w-xl mx-auto font-normal">
                Explore live payment scoring on genuine test transactions, or inspect exact game-theoretic dispute evidence.
              </p>
            </div>

            {/* Tech Spec Grid */}
            <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {hudModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className="clay-card-sm p-3 flex flex-col justify-between relative group border border-white/5 hover:border-[#F2B8C6]/30 transition-all bg-[#0B0B0E]"
                  >
                    <div className="flex items-center justify-between pb-1.5">
                      <span className="text-[9px] font-mono uppercase text-[#8E8E98] font-bold tracking-wider flex items-center gap-1">
                        <Icon className="h-3 w-3 text-[#F2B8C6]" />
                        <span>{mod.title}</span>
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 ${mod.badgeClass}`}>
                        {mod.badge}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-[#F7F6F3] line-clamp-1">
                      {mod.value}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Two Distinct Destination Cards */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              {/* Destination 1 */}
              <Link href="/console" className="group block">
                <div className="clay-card p-4 sm:p-5 relative overflow-hidden transition-all duration-300 border border-white/8 hover:border-[#F2B8C6]/40 bg-[#0E0E12] flex flex-col justify-between h-full cursor-pointer">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E1E23]/60">
                    <span className="text-[9px] font-mono uppercase font-bold text-[#F2B8C6] tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F2B8C6] animate-pulse"></span>
                      LIVE RISK SCORING
                    </span>
                    <span className="text-[10px] font-mono text-[#8E8E98]">&lt;10ms Engine</span>
                  </div>

                  <h3 className="mt-3 font-heading font-bold text-lg text-[#F7F6F3] group-hover:text-[#F2B8C6] transition-colors">
                    See it score in real time
                  </h3>
                  <p className="mt-1 text-xs text-[#8E8E98] leading-relaxed">
                    Test live probability scoring on genuine transactions and sweep the operating threshold slider.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs font-heading font-bold text-[#F2B8C6] group-hover:translate-x-1 transition-transform">
                    <span>Open Risk Console</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>

              {/* Destination 2 */}
              <Link href="/evidence" className="group block">
                <div className="clay-card p-4 sm:p-5 relative overflow-hidden transition-all duration-300 border border-white/8 hover:border-[#A8B5E0]/40 bg-[#0E0E12] flex flex-col justify-between h-full cursor-pointer">
                  <div className="flex items-center justify-between pb-3 border-b border-[#1E1E23]/60">
                    <span className="text-[9px] font-mono uppercase font-bold text-[#A8B5E0] tracking-wider flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#A8B5E0] animate-pulse"></span>
                      SHAP DISPUTE DOSSIER
                    </span>
                    <span className="text-[10px] font-mono text-[#8E8E98]">Exact Shapley</span>
                  </div>

                  <h3 className="mt-3 font-heading font-bold text-lg text-[#F7F6F3] group-hover:text-[#A8B5E0] transition-colors">
                    See why it flagged something
                  </h3>
                  <p className="mt-1 text-xs text-[#8E8E98] leading-relaxed">
                    Deconstruct exact game-theoretic feature contributions and generate audit-ready dispute summaries.
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs font-heading font-bold text-[#A8B5E0] group-hover:translate-x-1 transition-transform">
                    <span>Inspect Dispute Evidence</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* ── LANDMARK 5: Concluding Platform Destination (Active: 0.90 -> 1.00) ── */}
        <div
          className={`absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-8 max-w-6xl mx-auto transition-all duration-300 ${
            isFooterActive ? "pointer-events-auto" : "pointer-events-none"
          }`}
          style={{
            opacity: footerOpacity,
            transform: `scale(${0.96 + footerOpacity * 0.04})`,
            visibility: footerOpacity > 0 ? "visible" : "hidden",
          }}
        >
          <div className="w-full clay-card p-6 sm:p-10 border border-white/10 bg-[#070709]/95 backdrop-blur-2xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#1E1E23]/60">
              {/* Column 1: Brand */}
              <div className="md:col-span-2 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#F2B8C6]/10 border border-[#F2B8C6]/30 text-[#F2B8C6]">
                    <NeumorphicShieldCheckIcon size={20} />
                  </div>
                  <span className="font-heading font-bold text-xl text-[#F7F6F3]">SentinelPay</span>
                  <span className="clay-badge-rose px-2.5 py-0.5 text-[10px] font-mono font-semibold">v1.0</span>
                </div>
                <p className="text-xs sm:text-sm text-[#8E8E98] max-w-sm leading-relaxed font-sans">
                  Real-time fraud intelligence designed for extreme class imbalance. Operating at cost-optimal
                  operating points with instant Shapley game-theoretic evidence decomposition.
                </p>
              </div>

              {/* Column 2: Navigation */}
              <div className="space-y-2.5 text-xs font-mono">
                <span className="text-[#F7F6F3] font-bold block mb-2 uppercase tracking-wider text-[11px]">
                  Platform Interfaces
                </span>
                <div>
                  <Link href="/console" className="text-[#8E8E98] hover:text-[#F2B8C6] transition-colors">
                    Operational Risk Console →
                  </Link>
                </div>
                <div>
                  <Link href="/evidence" className="text-[#8E8E98] hover:text-[#A8B5E0] transition-colors">
                    SHAP Dispute Dossier →
                  </Link>
                </div>
              </div>

              {/* Column 3: Live Telemetry */}
              <div className="space-y-2.5 text-xs font-mono">
                <span className="text-[#F7F6F3] font-bold block mb-2 uppercase tracking-wider text-[11px]">
                  Inference Telemetry
                </span>
                <div className="flex items-center gap-2 text-[#A8B5E0]">
                  <span className="h-2 w-2 rounded-full bg-[#A8B5E0] animate-pulse"></span>
                  <span>FastAPI Service Online</span>
                </div>
                <div className="text-[#8E8E98]">
                  Operating Point: <span className="text-[#F7F6F3] font-bold">t = 0.10</span>
                </div>
                <div>
                  <a
                    href={API_DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[#F2B8C6] hover:underline"
                  >
                    <Terminal className="h-3 w-3" />
                    <span>OpenAPI Schema Docs</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#8E8E98]">
              <span>
                SentinelPay Engine · XGBoost <code className="text-[#F2B8C6]">scale_pos_weight=578.55</code> · SHAP TreeExplainer
              </span>
              <span>
                Held-Out PR-AUC <strong className="text-[#F7F6F3]">0.8424</strong> · Precision-Recall Optimized
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
