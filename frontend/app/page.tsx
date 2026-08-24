"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useInView, animate } from "framer-motion";
import confetti from "canvas-confetti";
import {
  NeumorphicRadarIcon,
  NeumorphicTreeIcon,
  NeumorphicShieldCheckIcon,
  NeumorphicSliderScaleIcon,
  NeumorphicSpikeIcon,
} from "@/components/icons/NeumorphicIcons";
import { ChevronRight, ArrowRight, Shield, Terminal, ExternalLink } from "lucide-react";

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
}

function AnimatedCounter({
  from,
  to,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1.8,
  className = "",
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!isInView || hasStarted) return;
    setHasStarted(true);

    const node = ref.current!;
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(value) {
        node.textContent = prefix + value.toFixed(decimals) + suffix;
      },
      onComplete() {
        node.textContent = prefix + to.toFixed(decimals) + suffix;
      },
    });

    return () => controls.stop();
  }, [isInView, hasStarted, from, to, duration, decimals, prefix, suffix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {from.toFixed(decimals)}
      {suffix}
    </span>
  );
}

// ─── Celebratory Soft Pastel Confetti Burst ────────────────────────────────────
function fireConfetti() {
  const end = Date.now() + 1600;
  const colors = ["#F2B8C6", "#D4C8EB", "#B5D8C5", "#F7F6F3"];

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
      disableForReducedMotion: true,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}

// ─── Main Landing Page ─────────────────────────────────────────────────────────
export default function HomePage() {
  const insightSectionRef = useRef<HTMLDivElement>(null);
  const lineOneRef = useRef<HTMLParagraphElement>(null);
  const lineTwoRef = useRef<HTMLParagraphElement>(null);
  const lineThreeRef = useRef<HTMLParagraphElement>(null);
  const metricsRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const confettiFiredRef = useRef(false);
  const isMetricsInView = useInView(metricsRef, { once: true, margin: "-80px" });

  // Confetti triggers once when the metrics section enters view
  useEffect(() => {
    if (isMetricsInView && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      setTimeout(() => fireConfetti(), 1200);
    }
  }, [isMetricsInView]);

  // Section 2: GSAP ScrollTrigger Pinned Scrub Reveals
  useEffect(() => {
    if (!insightSectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: insightSectionRef.current,
        start: "top top",
        end: "+=240%",
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
      });

      // Line 1: Early entry
      gsap.fromTo(
        lineOneRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: insightSectionRef.current,
            start: "top top",
            end: "+=75%",
            scrub: 1,
          },
        }
      );

      // Line 2: Mid reveal
      gsap.fromTo(
        lineTwoRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: insightSectionRef.current,
            start: "top+=35% top",
            end: "top+=120% top",
            scrub: 1.2,
          },
        }
      );

      // Line 3: Final takeaway
      gsap.fromTo(
        lineThreeRef.current,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          ease: "power2.out",
          scrollTrigger: {
            trigger: insightSectionRef.current,
            start: "top+=90% top",
            end: "top+=180% top",
            scrub: 1.2,
          },
        }
      );

      // Footer Closing Section Staggered Reveal
      if (footerRef.current) {
        gsap.fromTo(
          footerRef.current.children,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: footerRef.current,
              start: "top 85%",
            },
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-[#F7F6F3]">
      {/* ── PERSISTENT FULL-PAGE 3D STUDIO BACKDROP (Z-0) ────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <HeroTunnel />
        </Suspense>
      </div>

      {/* Atmospheric Soft Neutral Vignette */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 30%, #0A0A0A 95%)",
        }}
      />

      {/* ── SECTION 1: Hero (Landmark 1) ─────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-16 pb-24 text-center">
        {/* Soft Product Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8 inline-flex items-center gap-3 clay-pill px-5 py-2 text-xs font-mono font-medium text-[#F2B8C6] backdrop-blur-md"
        >
          <NeumorphicRadarIcon size={18} />
          <span>Real-Time Fraud Intelligence · Sub-10ms Inference</span>
        </motion.div>

        {/* Hero Title (Reduced ~18% for balanced viewport proportion) */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight text-[#F7F6F3] max-w-5xl leading-[1.04]"
        >
          0.17% of transactions
          <br />
          <span className="text-pastel-gradient">
            are fraud.
          </span>
          <br />
          We built a system
          <br />
          <span className="text-[#9A9AA4]">that finds them anyway.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-8 max-w-2xl text-base sm:text-lg text-[#9A9AA4] font-normal leading-relaxed"
        >
          Cost-sensitive XGBoost (<code className="text-[#F2B8C6] font-mono font-bold">scale_pos_weight=578.55</code>) with
          native SHAP game-theoretic explainability. Held-out PR-AUC{" "}
          <strong className="text-[#F7F6F3] font-mono font-bold">0.8424</strong>, 98.22% false-alarm reduction.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.0 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/console">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97, y: 1 }}
              className="clay-btn-rose inline-flex items-center gap-3 px-8 py-3.5 text-sm font-heading font-bold text-[#0A0A0A] tracking-wide cursor-pointer"
            >
              <NeumorphicSpikeIcon size={20} />
              <span>Launch Risk Console</span>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </Link>

          <Link href="/evidence">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98, y: 1 }}
              className="clay-btn-surface inline-flex items-center gap-3 px-8 py-3.5 text-sm font-heading font-bold text-[#F7F6F3] backdrop-blur-md cursor-pointer"
            >
              <NeumorphicTreeIcon size={20} />
              <span>SHAP Dispute Dossier</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-16 flex flex-col items-center gap-2 text-xs font-mono text-[#9A9AA4]"
        >
          <span>Scroll to explore the architecture</span>
          <div className="flex h-8 w-5 justify-center rounded-full border border-[#26262B] p-1 shadow-inner">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-1 rounded-full bg-[#F2B8C6]"
            />
          </div>
        </motion.div>
      </section>

      {/* ── SECTION 2: The Insight (Landmark 2 - Pinned Scrub) ───────────── */}
      <section
        ref={insightSectionRef}
        className="relative z-10 flex min-h-screen items-center justify-center px-6 text-center"
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
            ref={lineOneRef}
            className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-[#F7F6F3] opacity-0 leading-tight"
            style={{ willChange: "opacity, transform" }}
          >
            A naive model that predicts{" "}
            <span className="text-[#F2B8C6]">every transaction as legitimate</span>
            <br />
            achieves{" "}
            <span className="clay-badge-rose px-3 py-1 font-mono text-2xl sm:text-3xl inline-block mt-2 font-bold">
              99.83% accuracy
            </span>
            .
          </p>

          {/* Line 2 */}
          <p
            ref={lineTwoRef}
            className="mt-8 font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-[#F7F6F3] opacity-0 leading-tight"
            style={{ willChange: "opacity, transform" }}
          >
            Yet it catches <span className="text-[#F2B8C6]">zero fraud</span>.
            <br />
            <span className="text-lg font-normal text-[#9A9AA4] sm:text-2xl font-sans mt-3 block">
              Under extreme class imbalance, raw accuracy is mathematically meaningless.
            </span>
          </p>

          {/* Line 3 */}
          <p
            ref={lineThreeRef}
            className="mt-8 font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-[#F7F6F3] opacity-0 leading-relaxed"
            style={{ willChange: "opacity, transform" }}
          >
            We trained directly on the{" "}
            <span className="text-[#B5D8C5]">Precision-Recall operating surface</span>,
            <br />
            minimized asymmetric financial friction ($5 FP vs $122.21 FN),
            <br />
            and engineered{" "}
            <span className="text-[#D4C8EB]">exact Shapley game-theoretic evidence</span>.
          </p>
        </div>
      </section>

      {/* ── SECTION 3: The Verified Metrics (Landmark 3) ─────────────────── */}
      <section
        ref={metricsRef}
        className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center">
          <div className="clay-pill inline-flex items-center gap-2.5 px-4 py-1.5 text-xs font-mono text-[#9A9AA4]">
            <NeumorphicShieldCheckIcon size={16} />
            <span>HELD-OUT TEST SPLIT VALIDATION · N = 42,722 TRANSACTIONS</span>
          </div>
          <h2 className="mt-6 font-heading font-black text-3xl sm:text-5xl md:text-6xl text-[#F7F6F3] tracking-tight">
            Empirical Results Across Test Splits
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#9A9AA4] max-w-xl mx-auto font-normal">
            Stratified 70/15/15 split. Evaluated on genuine precision, recall, and false-alarm costs.
          </p>
        </div>

        {/* 4 Large Animated Claymorphic Counter Cards */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: PR-AUC */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className="clay-card-rose p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#F2B8C6] uppercase font-bold">PR-AUC</span>
              <NeumorphicSpikeIcon size={22} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F7F6F3] tabular-nums">
              <AnimatedCounter from={0} to={0.8424} decimals={4} duration={1.8} />
            </div>
            <p className="mt-2.5 text-xs text-[#9A9AA4] font-mono">
              +0.0520 lift over balanced baseline (0.7904)
            </p>
          </motion.div>

          {/* Card 2: Recall */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-40px" }}
            className="clay-card p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#B5D8C5] uppercase font-bold">Recall @ t=0.10</span>
              <NeumorphicRadarIcon size={22} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#B5D8C5] tabular-nums">
              <AnimatedCounter from={0} to={85.14} suffix="%" decimals={2} duration={1.6} />
            </div>
            <p className="mt-2.5 text-xs text-[#9A9AA4] font-mono">
              63 of 74 fraud cases caught in test split
            </p>
          </motion.div>

          {/* Card 3: FP Reduction */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: "-40px" }}
            className="clay-card p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#D4C8EB] uppercase font-bold">FP Reduction</span>
              <NeumorphicSliderScaleIcon size={22} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F7F6F3] tabular-nums">
              <AnimatedCounter from={0} to={98.22} suffix="%" decimals={2} duration={1.7} />
            </div>
            <p className="mt-2.5 text-xs text-[#9A9AA4] font-mono">
              901 → 16 false alarms vs balanced baseline
            </p>
          </motion.div>

          {/* Card 4: FP Rate */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, margin: "-40px" }}
            className="clay-card p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#9A9AA4] uppercase font-bold">False Alarm Rate</span>
              <NeumorphicShieldCheckIcon size={22} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F7F6F3] tabular-nums">
              <AnimatedCounter from={0} to={3.7} suffix="" decimals={1} duration={1.5} />
            </div>
            <p className="mt-2.5 text-xs text-[#9A9AA4] font-mono">
              FP per 10,000 processed transactions
            </p>
          </motion.div>
        </div>

        {/* Model Benchmark Architecture Matrix (Clay Card) */}
        <div className="mt-12 clay-card p-6 sm:p-7">
          <div className="grid grid-cols-4 border-b border-[#26262B] pb-3.5 text-xs font-mono font-bold uppercase tracking-wider text-[#9A9AA4]">
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
              className={`grid grid-cols-4 items-center border-b border-[#26262B]/50 py-4.5 text-sm last:border-0 ${
                row.isWinner ? "bg-[#F2B8C6]/10 rounded-2xl px-3 my-1" : "px-3"
              }`}
            >
              <div>
                <span className={`font-heading font-bold text-base ${row.isWinner ? "text-[#F2B8C6]" : "text-[#F7F6F3]"}`}>
                  {row.name}
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 ${
                      row.isWinner ? "clay-badge-rose" : "clay-pill text-[#9A9AA4]"
                    }`}
                  >
                    {row.badge}
                  </span>
                </div>
              </div>

              <div className={`text-center font-mono font-bold ${row.isWinner ? "text-[#F2B8C6] text-base" : "text-[#F7F6F3]"}`}>
                {row.prauc}
              </div>

              <div className="text-center font-mono text-[#F7F6F3] font-bold">
                {row.fp}
              </div>

              <div className="text-right font-mono text-xs text-[#9A9AA4]">
                {row.strategy}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-[#9A9AA4] font-mono">
          SMOTE degraded precision due to synthetic artifact generation in high-dimensional PCA projection space.
        </p>
      </section>

      {/* ── SECTION 4: Live Interactive CTA (Landmark 4) ─────────────────── */}
      <section className="relative z-10 py-32 px-4 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: "-60px" }}
          className="clay-card p-9 sm:p-12 relative overflow-hidden"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl clay-btn-surface text-[#F2B8C6]">
            <NeumorphicSpikeIcon size={32} />
          </div>

          <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#F7F6F3] tracking-tight">
            See the Engine Catch Fraud
            <br />
            <span className="text-pastel-gradient">in Real Time.</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#9A9AA4] max-w-lg mx-auto font-normal">
            Test live FastAPI scoring on genuine Kaggle test-set transactions. Sweep the
            threshold slider to visualize the financial cost surface.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/console">
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97, y: 1 }}
                className="clay-btn-rose inline-flex items-center gap-3 px-8 py-3.5 text-sm font-heading font-bold text-[#0A0A0A] tracking-wide cursor-pointer"
              >
                <NeumorphicSpikeIcon size={20} />
                <span>Open Risk Console</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>

            <Link href="/evidence">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97, y: 1 }}
                className="clay-btn-surface inline-flex items-center gap-3 px-8 py-3.5 text-sm font-heading font-bold text-[#F7F6F3] cursor-pointer"
              >
                <NeumorphicTreeIcon size={20} />
                <span>SHAP Evidence Dossier</span>
              </motion.button>
            </Link>
          </div>

          {/* Architecture Badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {[
              "XGBoost scale_pos_weight=578.55",
              "shap.TreeExplainer",
              "FastAPI Real-Time Lifespan",
              "PR-AUC 0.8424",
              "Continuous Adaptive Architecture",
              "Stratified 70/15/15 Split",
            ].map((tag) => (
              <span
                key={tag}
                className="clay-pill px-3.5 py-1.5 text-[11px] font-mono text-[#9A9AA4]"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── SECTION 5: Animated Concluding Footer Destination ──────────────── */}
      <footer
        ref={footerRef}
        className="relative z-10 border-t border-[#26262B]/70 bg-[#0A0A0A]/90 backdrop-blur-2xl pt-16 pb-12 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#26262B]/60">
            {/* Column 1: Brand & Philosophy */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#F2B8C6]/10 border border-[#F2B8C6]/30 text-[#F2B8C6]">
                  <NeumorphicShieldCheckIcon size={18} />
                </div>
                <span className="font-heading font-bold text-lg text-[#F7F6F3]">SentinelPay</span>
                <span className="clay-badge-rose px-2.5 py-0.5 text-[10px] font-mono font-semibold">v1.0</span>
              </div>
              <p className="text-xs text-[#9A9AA4] max-w-sm leading-relaxed font-sans">
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
                <Link href="/" className="text-[#9A9AA4] hover:text-[#F2B8C6] transition-colors">
                  Executive Summary
                </Link>
              </div>
              <div>
                <Link href="/console" className="text-[#9A9AA4] hover:text-[#F2B8C6] transition-colors">
                  Operational Risk Console
                </Link>
              </div>
              <div>
                <Link href="/evidence" className="text-[#9A9AA4] hover:text-[#F2B8C6] transition-colors">
                  SHAP Dispute Dossier
                </Link>
              </div>
            </div>

            {/* Column 3: Live Telemetry */}
            <div className="space-y-2.5 text-xs font-mono">
              <span className="text-[#F7F6F3] font-bold block mb-2 uppercase tracking-wider text-[11px]">
                Inference Telemetry
              </span>
              <div className="flex items-center gap-2 text-[#B5D8C5]">
                <span className="h-2 w-2 rounded-full bg-[#B5D8C5] animate-pulse"></span>
                <span>FastAPI Service Online</span>
              </div>
              <div className="text-[#9A9AA4]">
                Operating Point: <span className="text-[#F7F6F3] font-bold">t = 0.10</span>
              </div>
              <div>
                <a
                  href="http://localhost:8000/docs"
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
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-[#9A9AA4]">
            <span>
              SentinelPay Engine · XGBoost <code className="text-[#F2B8C6]">scale_pos_weight=578.55</code> · SHAP TreeExplainer
            </span>
            <span>
              Held-Out PR-AUC <strong className="text-[#F7F6F3]">0.8424</strong> · Precision-Recall Optimized
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
