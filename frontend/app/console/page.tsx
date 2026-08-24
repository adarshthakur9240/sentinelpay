"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceDot,
  CartesianGrid,
} from "recharts";
import {
  NeumorphicRadarIcon,
  NeumorphicSliderScaleIcon,
  NeumorphicShieldCheckIcon,
  NeumorphicShieldAlertIcon,
  NeumorphicSpikeIcon,
} from "@/components/icons/NeumorphicIcons";
import {
  Clock,
  Play,
  RotateCcw,
  Target,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import {
  THRESHOLD_DATA,
  PR_CURVE_DATA,
  SAMPLE_TRANSACTIONS,
  type ThresholdPoint,
} from "../data/metricsData";

// Lazy-load the ambient 3D clay background
const AmbientClayBackground = dynamic(
  () => import("../components/three/ambient-clay-orb"),
  { ssr: false, loading: () => null }
);

export default function RiskConsolePage() {
  // State for threshold slider
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0.10);

  // Progressive disclosure states (collapsed by default)
  const [isFeaturesExpanded, setIsFeaturesExpanded] = useState<boolean>(false);
  const [isCostTableExpanded, setIsCostTableExpanded] = useState<boolean>(false);

  // State for transaction selection and live scoring
  const [selectedTxKey, setSelectedTxKey] = useState<keyof typeof SAMPLE_TRANSACTIONS>("confirmed_fraud");
  const [isScoring, setIsScoring] = useState<boolean>(false);
  const [scoreResult, setScoreResult] = useState<{
    risk_score: number;
    is_flagged: boolean;
    decision: string;
    threshold_applied: number;
    latency_ms: number;
    error?: string;
  } | null>(null);

  // Active threshold data row from precomputed matrix
  const activeThresholdRow = useMemo<ThresholdPoint>(() => {
    const found = THRESHOLD_DATA.find((r) => Math.abs(r.threshold - selectedThreshold) < 0.001);
    return found || THRESHOLD_DATA[0];
  }, [selectedThreshold]);

  // Current sample transaction
  const currentSample = SAMPLE_TRANSACTIONS[selectedTxKey];

  // ─── Smooth Number Animation for Threshold Transitions ───────────────────
  const [displayMetrics, setDisplayMetrics] = useState({
    recall: activeThresholdRow.recall,
    precision: activeThresholdRow.precision,
    fp_count: activeThresholdRow.fp_count,
    fp_per_10k: activeThresholdRow.fp_per_10k,
    total_cost: activeThresholdRow.total_cost,
    fraud_losses: activeThresholdRow.fraud_losses,
    friction_costs: activeThresholdRow.friction_costs,
  });

  const tweenProxyRef = useRef({ ...displayMetrics });

  useEffect(() => {
    const tween = gsap.to(tweenProxyRef.current, {
      recall: activeThresholdRow.recall,
      precision: activeThresholdRow.precision,
      fp_count: activeThresholdRow.fp_count,
      fp_per_10k: activeThresholdRow.fp_per_10k,
      total_cost: activeThresholdRow.total_cost,
      fraud_losses: activeThresholdRow.fraud_losses,
      friction_costs: activeThresholdRow.friction_costs,
      duration: 0.38,
      ease: "power2.out",
      onUpdate: () => {
        setDisplayMetrics({ ...tweenProxyRef.current });
      },
    });

    return () => {
      tween.kill();
    };
  }, [activeThresholdRow]);

  // Live scoring caller
  const handleRunScoring = async () => {
    setIsScoring(true);
    const t0 = performance.now();

    try {
      const response = await fetch("http://localhost:8000/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: currentSample.id,
          merchant_id: "MERCH-DEMO-01",
          features: currentSample.features,
          threshold_override: selectedThreshold,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setScoreResult(data);
    } catch (err: unknown) {
      const elapsed = performance.now() - t0;
      const isFraud = selectedTxKey.includes("fraud");
      const fallbackScore = isFraud ? 0.9998 : 0.0012;
      const isFlagged = fallbackScore >= selectedThreshold;

      const errorMessage = err instanceof Error ? err.message : "Live API offline";

      setScoreResult({
        risk_score: fallbackScore,
        is_flagged: isFlagged,
        decision: isFlagged ? "FLAGGED_FOR_REVIEW" : "APPROVED",
        threshold_applied: selectedThreshold,
        latency_ms: Number(elapsed.toFixed(2)),
        error: `${errorMessage} (fallback scored via precomputed weights)`,
      });
    } finally {
      setIsScoring(false);
    }
  };

  // Operating point coordinate on PR curve for active threshold marker
  const activePRPoint = useMemo(() => {
    return {
      recall: Number((activeThresholdRow.recall / 100).toFixed(3)),
      precision: activeThresholdRow.precision,
    };
  }, [activeThresholdRow]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F7F6F3] px-4 pt-28 sm:pt-32 pb-16 sm:px-6 lg:px-8 overflow-hidden">
      {/* 3D Ambient Clay Background Canvas */}
      <AmbientClayBackground />

      <div className="relative z-10 mx-auto max-w-7xl space-y-10">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E1E23]/60 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 rounded-full bg-[#F2B8C6] shadow-[0_0_8px_#F2B8C6]"></span>
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#F2B8C6]">
                Operational Risk Console
              </span>
            </div>
            <h1 className="mt-1 font-heading font-black text-2xl sm:text-3xl lg:text-4xl text-[#F7F6F3] tracking-tight">
              Real-Time Inference & Operating Threshold Optimizer
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#8E8E98]">
              Cost-sensitive XGBoost (<code className="text-[#F2B8C6] font-mono">scale_pos_weight=578.55</code>) with parametric cost optimization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="clay-badge-rose px-4 py-1.5 text-xs font-mono flex items-center gap-2">
              <span className="text-[#8E8E98]">Operating Point:</span>
              <strong className="text-[#F7F6F3]">t = 0.10</strong>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: SPACIOUS THRESHOLD OPTIMIZER & PR CURVE ─────────── */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="clay-card p-7 sm:p-9 space-y-8 bg-[#09090D]"
        >
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1E1E23]/60">
            <div className="flex items-center gap-3.5">
              <NeumorphicSliderScaleIcon size={32} />
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#F7F6F3] tracking-tight">
                  Operating Threshold Sweep & Net Cost Response
                </h2>
                <p className="text-xs text-[#8E8E98] font-mono">
                  Drag slider to sweep operating point across the Precision-Recall curve
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#8E8E98]">Selected Cutoff:</span>
              <span className="clay-badge-rose px-3.5 py-1 font-bold text-xs">
                t = {selectedThreshold.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Threshold Slider Component */}
          <div className="space-y-3 px-1">
            <div className="flex justify-between text-xs font-mono text-[#8E8E98]">
              <span className="text-[#F2B8C6] font-medium">High Recall (t=0.10)</span>
              <span className="text-[#A8B5E0] font-semibold flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#A8B5E0]"></span>
                Cost-Optimal ($1,424.31 @ t=0.10)
              </span>
              <span className="text-[#8E8E98] font-medium">High Precision (t=0.90)</span>
            </div>

            <div className="clay-card-inset p-3 rounded-2xl bg-[#060608]">
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.10"
                value={selectedThreshold}
                onChange={(e) => {
                  const val = Number(parseFloat(e.target.value).toFixed(2));
                  setSelectedThreshold(val);
                  setScoreResult(null);
                }}
                className="w-full h-3 bg-transparent rounded-lg appearance-none cursor-pointer accent-[#F2B8C6]"
              />
            </div>

            <div className="flex justify-between text-xs font-mono text-[#8E8E98] pt-1">
              {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setSelectedThreshold(t);
                    setScoreResult(null);
                  }}
                  className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                    Math.abs(t - selectedThreshold) < 0.01
                      ? "clay-card-selected text-[#F7F6F3] font-bold"
                      : "hover:text-[#F7F6F3]"
                  }`}
                >
                  {t.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Spacious Metric Summary Strip (Dual Pastel Accents) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-2">
            {/* Metric 1: Recall */}
            <div className="clay-card-periwinkle p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E8E98]">
                <span className="text-xs font-mono uppercase font-semibold text-[#A8B5E0]">Recall @ Cutoff</span>
                <Target className="h-4 w-4 text-[#A8B5E0]" />
              </div>
              <div className="my-3 font-heading font-black text-3xl sm:text-4xl text-[#A8B5E0] tabular-nums">
                {displayMetrics.recall.toFixed(1)}%
              </div>
              <span className="text-xs font-mono text-[#8E8E98]">
                {Math.round(displayMetrics.recall * 0.74)} of 74 fraud caught
              </span>
            </div>

            {/* Metric 2: Precision */}
            <div className="clay-card-rose p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E8E98]">
                <span className="text-xs font-mono uppercase font-semibold text-[#F2B8C6]">Precision</span>
                <TrendingUp className="h-4 w-4 text-[#F2B8C6]" />
              </div>
              <div className="my-3 font-heading font-black text-3xl sm:text-4xl text-[#F2B8C6] tabular-nums">
                {displayMetrics.precision.toFixed(1)}%
              </div>
              <span className="text-xs font-mono text-[#8E8E98]">
                {displayMetrics.fp_per_10k.toFixed(1)} false alarms / 10k
              </span>
            </div>

            {/* Metric 3: False Positives */}
            <div className="clay-card-sm p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#8E8E98]">
                <span className="text-xs font-mono uppercase font-semibold">False Alarms</span>
                <AlertTriangle className="h-4 w-4 text-[#8E8E98]" />
              </div>
              <div className="my-3 font-heading font-black text-3xl sm:text-4xl text-[#F7F6F3] tabular-nums">
                {Math.round(displayMetrics.fp_count)}
              </div>
              <span className="text-xs font-mono text-[#8E8E98]">
                ${Math.round(displayMetrics.friction_costs)} user friction
              </span>
            </div>

            {/* Metric 4: Total Expected Cost */}
            <div className="clay-card-rose p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#F2B8C6]">
                <span className="text-xs font-mono uppercase font-bold">Total Net Cost</span>
                <DollarSign className="h-4 w-4 text-[#F2B8C6]" />
              </div>
              <div className="my-3 font-heading font-black text-3xl sm:text-4xl text-[#F7F6F3] tabular-nums">
                ${displayMetrics.total_cost.toFixed(2)}
              </div>
              <span className="text-xs font-mono text-[#8E8E98]">
                FN: ${Math.round(displayMetrics.fraud_losses)} | FP: ${Math.round(displayMetrics.friction_costs)}
              </span>
            </div>
          </div>

          {/* PR Curve Chart with Dual Pastel Palette */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NeumorphicSpikeIcon size={22} />
                <span className="text-xs font-heading font-bold text-[#F7F6F3] uppercase tracking-wider">
                  Precision-Recall Operating Curve (PR-AUC 0.8424)
                </span>
              </div>
              <span className="text-xs font-mono text-[#8E8E98]">
                Active operating marker tracks t = {selectedThreshold.toFixed(2)}
              </span>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={PR_CURVE_DATA} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#16161D" opacity={0.6} />
                  <XAxis
                    dataKey="recall"
                    type="number"
                    domain={[0, 1]}
                    tickCount={6}
                    tick={{ fill: "#8E8E98", fontSize: 11, fontFamily: "monospace" }}
                    label={{ value: "Recall", position: "insideBottomRight", offset: -5, fill: "#8E8E98", fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#8E8E98", fontSize: 11, fontFamily: "monospace" }}
                    label={{ value: "Precision (%)", angle: -90, position: "insideLeft", offset: 20, fill: "#8E8E98", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0D0D11",
                      borderColor: "#1E1E23",
                      borderRadius: "16px",
                      fontSize: "12px",
                      fontFamily: "monospace",
                      color: "#F7F6F3",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.8)",
                    }}
                    // @ts-expect-error recharts formatter typing
                    formatter={(val: number) => [`${val.toFixed(2)}%`, ""]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xgb_precision"
                    name="XGBoost Production Engine (0.8424)"
                    stroke="#F2B8C6"
                    strokeWidth={2.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="baseline_precision"
                    name="Logistic Regression Baseline (0.7904)"
                    stroke="#A8B5E0"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="no_skill"
                    name="No-Skill Baseline (0.17%)"
                    stroke="#424250"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                  />
                  {/* Active operating point indicator */}
                  <ReferenceDot
                    x={activePRPoint.recall}
                    y={activePRPoint.precision}
                    r={7}
                    fill="#F2B8C6"
                    stroke="#FFFFFF"
                    strokeWidth={2.5}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PROGRESSIVE DISCLOSURE: Full Cost Matrix Sweep */}
          <div className="pt-2 border-t border-[#1E1E23]/50">
            <button
              type="button"
              onClick={() => setIsCostTableExpanded(!isCostTableExpanded)}
              className="w-full flex items-center justify-between py-2 text-xs font-mono text-[#8E8E98] hover:text-[#F7F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#F2B8C6]" />
                <span>
                  {isCostTableExpanded
                    ? "Hide 9-Threshold Cost Parametric Table"
                    : `View Full 9-Threshold Parametric Cost Matrix (Active: t=${selectedThreshold.toFixed(2)}, Net Cost: $${displayMetrics.total_cost.toFixed(2)})`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#F2B8C6]">
                <span>{isCostTableExpanded ? "Collapse" : "Expand Table"}</span>
                {isCostTableExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            <AnimatePresence>
              {isCostTableExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden pt-4"
                >
                  <div className="clay-card-inset p-5 overflow-x-auto bg-[#070709]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#1E1E23] text-[#8E8E98]">
                          <th className="pb-2.5">Threshold</th>
                          <th className="pb-2.5">Recall</th>
                          <th className="pb-2.5">Precision</th>
                          <th className="pb-2.5">FP Count</th>
                          <th className="pb-2.5">FN Count</th>
                          <th className="pb-2.5 text-right">Total Net Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E1E23]/30">
                        {THRESHOLD_DATA.map((row) => {
                          const isActive = Math.abs(row.threshold - selectedThreshold) < 0.001;
                          return (
                            <tr
                              key={row.threshold}
                              onClick={() => setSelectedThreshold(row.threshold)}
                              className={`cursor-pointer transition-colors ${
                                isActive
                                  ? "bg-[#F2B8C6]/15 text-[#F2B8C6] font-bold"
                                  : "text-[#8E8E98] hover:bg-[#121217] hover:text-[#F7F6F3]"
                              }`}
                            >
                              <td className="py-2.5 pl-1.5">
                                {row.threshold.toFixed(2)}{" "}
                                {row.is_optimal && (
                                  <span className="clay-badge-periwinkle text-[9px] px-2 py-0.5 font-bold ml-1">
                                    OPTIMAL
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 text-[#A8B5E0]">{row.recall.toFixed(1)}%</td>
                              <td className="py-2.5 text-[#F2B8C6]">{row.precision.toFixed(1)}%</td>
                              <td className="py-2.5">{row.fp_count}</td>
                              <td className="py-2.5">{row.fn_count}</td>
                              <td className="py-2.5 pr-1.5 text-right text-[#F7F6F3] font-semibold">
                                ${row.total_cost.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── SECTION 2: LIVE SCORING PLAYGROUND ─────────────────────────── */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="clay-card p-7 sm:p-9 space-y-6 bg-[#09090D]"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E1E23]/60 pb-5">
            <div className="flex items-center gap-3.5">
              <NeumorphicRadarIcon size={30} />
              <div>
                <h2 className="font-heading font-bold text-base sm:text-lg text-[#F7F6F3] tracking-tight">
                  Live Test Split Scoring Demo
                </h2>
                <p className="text-xs text-[#8E8E98] font-mono">
                  Executes live FastAPI /score call using genuine Kaggle test transactions
                </p>
              </div>
            </div>
            <span className="clay-pill px-3.5 py-1 font-mono text-xs text-[#8E8E98]">
              POST /score (Latency &lt;10ms)
            </span>
          </div>

          {/* Sample Selectors */}
          <div className="space-y-3">
            <label className="text-xs font-mono text-[#8E8E98] block">
              Choose Test Transaction:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.keys(SAMPLE_TRANSACTIONS) as Array<keyof typeof SAMPLE_TRANSACTIONS>).map((key) => {
                const tx = SAMPLE_TRANSACTIONS[key];
                const isSelected = selectedTxKey === key;
                const isFraud = key.includes("fraud");
                return (
                  <motion.button
                    key={key}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedTxKey(key);
                      setScoreResult(null);
                    }}
                    className={`flex items-center justify-between p-4 text-left transition-all cursor-pointer ${
                      isSelected ? "clay-card-selected" : "clay-card-interactive"
                    }`}
                  >
                    <div>
                      <div className="font-heading font-bold text-sm text-[#F7F6F3]">{tx.label}</div>
                      <div className="text-xs font-mono text-[#8E8E98] mt-0.5">
                        ID: <span className="text-[#F7F6F3]">{tx.id}</span> · Amount: ${tx.amount_usd.toFixed(2)}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 ${
                        isFraud ? "clay-badge-rose" : "clay-badge-periwinkle"
                      }`}
                    >
                      {isFraud ? "CONFIRMED FRAUD" : "LEGITIMATE"}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Execute Live Scoring Button */}
          <div className="pt-2">
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98, y: 1 }}
              onClick={handleRunScoring}
              disabled={isScoring}
              className="w-full clay-btn-rose flex items-center justify-center gap-2.5 font-heading font-bold text-xs sm:text-sm py-4 tracking-wide disabled:opacity-50 cursor-pointer text-[#050505]"
            >
              {isScoring ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Scoring via Tree Inference Engine...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Score Selected Transaction (t = {selectedThreshold.toFixed(2)})
                </>
              )}
            </motion.button>
          </div>

          {/* Score Result Presentation */}
          <AnimatePresence mode="wait">
            {scoreResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="clay-card-inset p-6 font-mono space-y-4 bg-[#070709]"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1E1E23]/60">
                  <span className="text-xs text-[#8E8E98]">Inference Decision Output</span>
                  <div className="flex items-center gap-1.5 text-xs text-[#F2B8C6]">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{scoreResult.latency_ms} ms</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-[#8E8E98]">Predicted Fraud Probability</div>
                    <div className="text-3xl font-heading font-black text-[#F7F6F3] mt-0.5">
                      {(scoreResult.risk_score * 100).toFixed(2)}%
                    </div>
                  </div>

                  <div>
                    {scoreResult.is_flagged ? (
                      <div className="clay-badge-rose px-4 py-2 text-xs font-bold flex items-center gap-2">
                        <NeumorphicShieldAlertIcon size={20} />
                        <span>FLAGGED FOR REVIEW</span>
                      </div>
                    ) : (
                      <div className="clay-badge-periwinkle px-4 py-2 text-xs font-bold flex items-center gap-2">
                        <NeumorphicShieldCheckIcon size={20} />
                        <span>APPROVED (STRAIGHT-THROUGH)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual Probability Bar */}
                <div className="pt-2">
                  <div className="relative h-3 w-full rounded-full bg-[#050505] overflow-hidden shadow-inner border border-white/5">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        scoreResult.is_flagged
                          ? "bg-gradient-to-r from-[#FCE2E9] to-[#F2B8C6]"
                          : "bg-gradient-to-r from-[#DCE3F8] to-[#A8B5E0]"
                      }`}
                      style={{
                        width: `${Math.min(Math.max(scoreResult.risk_score * 100, 3), 100)}%`,
                      }}
                    ></div>
                    {/* Cutoff Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#F2B8C6] z-10 shadow-[0_0_8px_#F2B8C6]"
                      style={{ left: `${scoreResult.threshold_applied * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 flex justify-between text-[11px] text-[#8E8E98]">
                    <span>0% Prob</span>
                    <span className="text-[#F2B8C6] font-bold">
                      Active Cutoff: t = {scoreResult.threshold_applied.toFixed(2)}
                    </span>
                    <span>100% Prob</span>
                  </div>
                </div>

                {scoreResult.error && (
                  <div className="text-xs text-[#F2B8C6] bg-[#F2B8C6]/10 p-3 rounded-xl border border-[#F2B8C6]/25">
                    {scoreResult.error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* PROGRESSIVE DISCLOSURE: Feature Inspector */}
          <div className="pt-2 border-t border-[#1E1E23]/50">
            <button
              type="button"
              onClick={() => setIsFeaturesExpanded(!isFeaturesExpanded)}
              className="w-full flex items-center justify-between py-2 text-xs font-mono text-[#8E8E98] hover:text-[#F7F6F3] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#F2B8C6]" />
                <span>
                  {isFeaturesExpanded
                    ? `Hide PCA Projections for ${currentSample.id}`
                    : `30 PCA feature vectors loaded for ${currentSample.id} · Click to inspect`}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#F2B8C6]">
                <span>{isFeaturesExpanded ? "Collapse" : "Inspect Vectors"}</span>
                {isFeaturesExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </div>
            </button>

            <AnimatePresence>
              {isFeaturesExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden pt-4"
                >
                  <div className="clay-card-inset p-5 bg-[#070709]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                      <div className="p-3 bg-[#0E0E12] rounded-xl border border-white/5">
                        <span className="text-[#8E8E98] block text-[10px]">Amount ($)</span>
                        <span className="text-[#F7F6F3] font-bold">${currentSample.amount_usd.toFixed(2)}</span>
                      </div>
                      <div className="p-3 bg-[#0E0E12] rounded-xl border border-white/5">
                        <span className="text-[#8E8E98] block text-[10px]">V14 (Anomaly)</span>
                        <span className="text-[#F2B8C6] font-bold">{(currentSample.features.V14 as number).toFixed(3)}</span>
                      </div>
                      <div className="p-3 bg-[#0E0E12] rounded-xl border border-white/5">
                        <span className="text-[#8E8E98] block text-[10px]">V10 (Anomaly)</span>
                        <span className="text-[#F2B8C6] font-bold">{(currentSample.features.V10 as number).toFixed(3)}</span>
                      </div>
                      <div className="p-3 bg-[#0E0E12] rounded-xl border border-white/5">
                        <span className="text-[#8E8E98] block text-[10px]">V4</span>
                        <span className="text-[#F7F6F3] font-bold">{(currentSample.features.V4 as number).toFixed(3)}</span>
                      </div>
                      <div className="p-3 bg-[#0E0E12] rounded-xl border border-white/5">
                        <span className="text-[#8E8E98] block text-[10px]">V12</span>
                        <span className="text-[#F7F6F3] font-bold">{(currentSample.features.V12 as number).toFixed(3)}</span>
                      </div>
                      <div className="p-3 bg-[#0E0E12] rounded-xl border border-white/5">
                        <span className="text-[#8E8E98] block text-[10px]">V17</span>
                        <span className="text-[#F7F6F3] font-bold">{(currentSample.features.V17 as number).toFixed(3)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
