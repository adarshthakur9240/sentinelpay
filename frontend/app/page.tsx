"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useInView, animate } from "framer-motion";
import confetti from "canvas-confetti";
import {
  RadarSweepIcon,
  BiometricShieldIcon,
  TreeAttributionIcon,
  TelemetrySpikeIcon,
  CostMatrixIcon,
} from "@/components/icons/CustomIcons";
import { ChevronRight, ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// Lazy-load the Three.js continuous spine tunnel — SSR-safe
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

// ─── Celebratory Warm-Gold Confetti Burst ───────────────────────────────────────
function fireConfetti() {
  const end = Date.now() + 1600;
  const colors = ["#C9A24D", "#E6C875", "#F5F1E8", "#C4707A"];

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
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0A0A0F] text-[#F5F1E8]">
      {/* ── PERSISTENT FULL-PAGE 3D CANVAS (Z-0) ────────────────────────── */}
      {/* Persists across the entire page scroll height as the 3D spine */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Suspense fallback={null}>
          <HeroTunnel />
        </Suspense>
      </div>

      {/* Atmospheric Warm Vignette */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, transparent 20%, #0A0A0F 95%)",
        }}
      />

      {/* ── SECTION 1: Hero (Landmark 1) ─────────────────────────────────── */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-12 pb-24 text-center">
        {/* Track Badge */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#C9A24D]/35 bg-[#C9A24D]/10 px-4 py-1.5 text-xs font-mono font-medium text-[#E6C875] backdrop-blur-md"
        >
          <RadarSweepIcon size={16} />
          <span>Razorpay Buildathon 2026 · Track 02 Submission</span>
        </motion.div>

        {/* Hero Title (Poppins 900 Black) */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading font-black text-4xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-[#F5F1E8] max-w-5xl leading-[1.06]"
        >
          0.17% of transactions
          <br />
          <span className="text-gold-gradient">
            are fraud.
          </span>
          <br />
          We built a system
          <br />
          <span className="text-[#8E8E9E]">that finds them anyway.</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-7 max-w-2xl text-base sm:text-lg text-[#8E8E9E] font-normal leading-relaxed"
        >
          Cost-sensitive XGBoost (<code className="text-[#E6C875] font-mono">scale_pos_weight=578.55</code>) with
          native SHAP game-theoretic explainability. Held-out PR-AUC{" "}
          <strong className="text-[#F5F1E8] font-mono font-bold">0.8424</strong>, 98.22% false-alarm reduction.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/console">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 36px -4px rgba(201, 162, 77, 0.45)" }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2.5 rounded-xl bg-[#C9A24D] px-7 py-3.5 text-sm font-heading font-bold text-[#0A0A0F] shadow-lg shadow-[#C9A24D]/25 hover:bg-[#E6C875] transition-all"
            >
              <TelemetrySpikeIcon size={18} />
              <span>Launch Risk Console</span>
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </Link>

          <Link href="/evidence">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2.5 rounded-xl border border-[#242436] bg-[#12121A]/80 px-7 py-3.5 text-sm font-heading font-bold text-[#F5F1E8] backdrop-blur-md hover:border-[#383850] hover:bg-[#181824] transition-all"
            >
              <TreeAttributionIcon size={18} />
              <span>SHAP Dispute Dossier</span>
            </motion.button>
          </Link>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 1 }}
          className="mt-16 flex flex-col items-center gap-2 text-xs font-mono text-[#8E8E9E]"
        >
          <span>Scroll to explore the architecture spine</span>
          <div className="flex h-8 w-5 justify-center rounded-full border border-[#242436] p-1">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="h-2 w-1 rounded-full bg-[#C9A24D]"
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
          <div className="mb-5 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#242436] bg-[#12121A]/80 px-3.5 py-1 text-xs font-mono text-[#E6C875] backdrop-blur-md">
              <CostMatrixIcon size={14} />
              <span>THE 0.17% CORE CHALLENGE</span>
            </span>
          </div>

          {/* Line 1 */}
          <p
            ref={lineOneRef}
            className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-[#F5F1E8] opacity-0 leading-tight"
            style={{ willChange: "opacity, transform" }}
          >
            A naive model that predicts{" "}
            <span className="text-[#E6C875]">every transaction as legitimate</span>
            <br />
            achieves{" "}
            <span className="rounded-lg bg-[#C4707A]/20 px-2.5 py-0.5 text-[#C4707A] border border-[#C4707A]/40 font-mono">
              99.83% accuracy
            </span>
            .
          </p>

          {/* Line 2 */}
          <p
            ref={lineTwoRef}
            className="mt-8 font-heading font-bold text-3xl sm:text-4xl md:text-5xl text-[#F5F1E8] opacity-0 leading-tight"
            style={{ willChange: "opacity, transform" }}
          >
            Yet it catches <span className="text-[#C4707A]">zero fraud</span>.
            <br />
            <span className="text-xl font-normal text-[#8E8E9E] sm:text-2xl font-sans mt-2 block">
              Under extreme class imbalance, raw accuracy is mathematically meaningless.
            </span>
          </p>

          {/* Line 3 */}
          <p
            ref={lineThreeRef}
            className="mt-8 font-heading font-bold text-2xl sm:text-3xl text-[#F5F1E8] opacity-0 leading-relaxed"
            style={{ willChange: "opacity, transform" }}
          >
            We trained directly on the{" "}
            <span className="text-[#E6C875]">Precision-Recall operating surface</span>,
            <br />
            minimized asymmetric financial friction ($5 FP vs $122.21 FN),
            <br />
            and engineered{" "}
            <span className="text-[#C9A24D]">exact Shapley game-theoretic evidence</span>.
          </p>
        </div>
      </section>

      {/* ── SECTION 3: The Verified Metrics (Landmark 3) ─────────────────── */}
      <section
        ref={metricsRef}
        className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#242436] bg-[#12121A]/80 px-3.5 py-1 text-xs font-mono text-[#8E8E9E]">
            <BiometricShieldIcon size={14} />
            <span>HELD-OUT TEST SPLIT VALIDATION · N = 42,722 TRANSACTIONS</span>
          </div>
          <h2 className="mt-5 font-heading font-black text-3xl sm:text-5xl md:text-6xl text-[#F5F1E8] tracking-tight">
            Empirical Results Across Test Splits
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#8E8E9E] max-w-xl mx-auto">
            Stratified 70/15/15 split. Evaluated on genuine precision, recall, and false-alarm costs.
          </p>
        </div>

        {/* 4 Large Animated Counter Cards */}
        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: PR-AUC */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            className="rounded-2xl border border-[#C9A24D]/30 bg-gradient-to-b from-[#C9A24D]/10 to-[#12121A]/80 p-6 backdrop-blur-md relative overflow-hidden group hover:border-[#C9A24D]/60 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#E6C875] uppercase font-bold">PR-AUC</span>
              <TelemetrySpikeIcon size={20} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F5F1E8] tabular-nums">
              <AnimatedCounter from={0} to={0.8424} decimals={4} duration={1.8} />
            </div>
            <p className="mt-2 text-xs text-[#8E8E9E] font-mono">
              +0.0520 lift over balanced baseline (0.7904)
            </p>
          </motion.div>

          {/* Card 2: Recall */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-40px" }}
            className="rounded-2xl border border-[#4EAD8A]/30 bg-gradient-to-b from-[#4EAD8A]/10 to-[#12121A]/80 p-6 backdrop-blur-md relative overflow-hidden group hover:border-[#4EAD8A]/60 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#4EAD8A] uppercase font-bold">Recall @ t=0.10</span>
              <RadarSweepIcon size={20} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F5F1E8] tabular-nums">
              <AnimatedCounter from={0} to={85.14} suffix="%" decimals={2} duration={1.6} />
            </div>
            <p className="mt-2 text-xs text-[#8E8E9E] font-mono">
              63 of 74 fraud cases caught in test split
            </p>
          </motion.div>

          {/* Card 3: FP Reduction */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, margin: "-40px" }}
            className="rounded-2xl border border-[#C9A24D]/30 bg-gradient-to-b from-[#C9A24D]/10 to-[#12121A]/80 p-6 backdrop-blur-md relative overflow-hidden group hover:border-[#C9A24D]/60 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#E6C875] uppercase font-bold">FP Reduction</span>
              <CostMatrixIcon size={20} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F5F1E8] tabular-nums">
              <AnimatedCounter from={0} to={98.22} suffix="%" decimals={2} duration={1.7} />
            </div>
            <p className="mt-2 text-xs text-[#8E8E9E] font-mono">
              901 → 16 false alarms vs balanced baseline
            </p>
          </motion.div>

          {/* Card 4: FP Rate */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, margin: "-40px" }}
            className="rounded-2xl border border-[#242436] bg-[#12121A]/80 p-6 backdrop-blur-md relative overflow-hidden group hover:border-[#383850] transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-[#8E8E9E] uppercase font-bold">False Alarm Rate</span>
              <BiometricShieldIcon size={20} />
            </div>
            <div className="font-heading font-black text-4xl sm:text-5xl text-[#F5F1E8] tabular-nums">
              <AnimatedCounter from={0} to={3.7} suffix="" decimals={1} duration={1.5} />
            </div>
            <p className="mt-2 text-xs text-[#8E8E9E] font-mono">
              FP per 10,000 processed transactions
            </p>
          </motion.div>
        </div>

        {/* Model Benchmark Architecture Matrix */}
        <div className="mt-12 overflow-hidden rounded-2xl border border-[#242436] bg-[#12121A]/90 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-4 border-b border-[#242436] bg-[#181824]/90 px-6 py-3.5 text-xs font-mono font-bold uppercase tracking-wider text-[#8E8E9E]">
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
          ].map((row, idx) => (
            <div
              key={row.name}
              className={`grid grid-cols-4 items-center border-b border-[#242436]/60 px-6 py-4.5 text-sm last:border-0 ${
                row.isWinner ? "bg-[#C9A24D]/10" : "hover:bg-[#181824]/40"
              }`}
            >
              <div>
                <span className={`font-heading font-bold text-sm ${row.isWinner ? "text-[#E6C875]" : "text-[#F5F1E8]"}`}>
                  {row.name}
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-mono font-bold border ${
                      row.isWinner
                        ? "bg-[#C9A24D]/20 text-[#E6C875] border-[#C9A24D]/40"
                        : "bg-[#181824] text-[#8E8E9E] border-[#242436]"
                    }`}
                  >
                    {row.badge}
                  </span>
                </div>
              </div>

              <div className={`text-center font-mono font-bold ${row.isWinner ? "text-[#E6C875] text-base" : "text-[#F5F1E8]"}`}>
                {row.prauc}
              </div>

              <div className="text-center font-mono text-[#F5F1E8]">
                {row.fp}
              </div>

              <div className="text-right font-mono text-xs text-[#8E8E9E]">
                {row.strategy}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-[#8E8E9E] font-mono">
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
          className="rounded-3xl border border-[#C9A24D]/30 bg-gradient-to-b from-[#12121A]/95 to-[#0A0A0F]/95 p-8 sm:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C9A24D]/15 border border-[#C9A24D]/40 text-[#C9A24D] shadow-lg shadow-[#C9A24D]/20">
            <TelemetrySpikeIcon size={32} />
          </div>

          <h2 className="font-heading font-black text-3xl sm:text-5xl text-[#F5F1E8] tracking-tight">
            See the Engine Catch Fraud
            <br />
            <span className="text-gold-gradient">in Real Time.</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-[#8E8E9E] max-w-lg mx-auto">
            Test live FastAPI scoring on genuine Kaggle test-set transactions. Sweep the
            threshold slider to visualize the financial cost surface.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/console">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 42px -6px rgba(201, 162, 77, 0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 rounded-xl bg-[#C9A24D] px-8 py-3.5 text-sm font-heading font-bold text-[#0A0A0F] shadow-xl shadow-[#C9A24D]/25 hover:bg-[#E6C875] transition-all"
              >
                <TelemetrySpikeIcon size={18} />
                <span>Open Risk Console</span>
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>

            <Link href="/evidence">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2.5 rounded-xl border border-[#242436] bg-[#181824] px-8 py-3.5 text-sm font-heading font-bold text-[#F5F1E8] hover:border-[#383850] hover:bg-[#202030] transition-all"
              >
                <TreeAttributionIcon size={18} />
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
              "Full-Page Continuous R3F Spine",
              "Stratified 70/15/15 Split",
            ].map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#242436] bg-[#12121A] px-3 py-1 text-[11px] font-mono text-[#8E8E9E]"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}
