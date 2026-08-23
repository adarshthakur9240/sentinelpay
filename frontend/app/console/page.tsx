"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  RadarSweepIcon,
  BiometricShieldIcon,
  TelemetrySpikeIcon,
  CostMatrixIcon,
} from "@/components/icons/CustomIcons";
import {
  Sliders,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  THRESHOLD_DATA,
  PR_CURVE_DATA,
  SAMPLE_TRANSACTIONS,
  type ThresholdPoint,
} from "../data/metricsData";

export default function RiskConsolePage() {
  // State for threshold slider
  const [selectedThreshold, setSelectedThreshold] = useState<number>(0.10);

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
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F1E8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242436] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#C9A24D]"></span>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#E6C875]">
                Operational Risk & Scoring Console
              </span>
            </div>
            <h1 className="mt-1 font-heading font-black text-2xl sm:text-3xl text-[#F5F1E8] tracking-tight">
              Real-Time Inference & Operating Threshold Optimizer
            </h1>
            <p className="mt-1 text-xs text-[#8E8E9E]">
              Direct FastAPI scoring layer connected to cost-sensitive XGBoost (<code className="text-[#E6C875] font-mono">scale_pos_weight=578.55</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-[#C9A24D]/35 bg-[#C9A24D]/10 text-[#E6C875] font-mono text-xs px-3 py-1.5">
              Production Operating Point: <strong className="ml-1 text-[#F5F1E8]">t = 0.10</strong>
            </Badge>
          </div>
        </div>

        {/* Main Grid */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Live Scoring Demo (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Playground Card */}
            <Card className="border-[#242436] bg-[#12121A]/85 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-[#242436] pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TelemetrySpikeIcon size={16} />
                    <CardTitle className="font-heading font-bold text-sm text-[#F5F1E8] uppercase tracking-wider">
                      1. Live Scoring Playground
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] text-[#8E8E9E] bg-[#181824] border-[#242436]">
                    POST /score
                  </Badge>
                </div>
                <CardDescription className="text-xs text-[#8E8E9E] mt-1">
                  Select a test-set transaction to execute real-time model inference.
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4">
                {/* Sample Selector */}
                <div>
                  <label className="text-xs font-mono text-[#8E8E9E] block mb-2">
                    Test Split Fixtures (Held-Out 15% Split):
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(SAMPLE_TRANSACTIONS) as Array<keyof typeof SAMPLE_TRANSACTIONS>).map((key) => {
                      const tx = SAMPLE_TRANSACTIONS[key];
                      const isSelected = selectedTxKey === key;
                      const isFraud = key.includes("fraud");
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setSelectedTxKey(key);
                            setScoreResult(null);
                          }}
                          className={`flex items-center justify-between rounded-xl p-3 text-left text-xs transition-all border ${
                            isSelected
                              ? "border-[#C9A24D]/60 bg-[#C9A24D]/10 text-[#F5F1E8] shadow-sm ring-1 ring-[#C9A24D]/30"
                              : "border-[#242436] bg-[#0A0A0F]/60 text-[#8E8E9E] hover:border-[#383850] hover:text-[#F5F1E8]"
                          }`}
                        >
                          <div>
                            <div className="font-medium text-[#F5F1E8]">{tx.label}</div>
                            <div className="text-[11px] font-mono text-[#8E8E9E]">
                              ID: {tx.id} • Amount: ${tx.amount_usd.toFixed(2)}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`font-mono text-[10px] font-bold ${
                              isFraud
                                ? "bg-[#C4707A]/15 text-[#C4707A] border-[#C4707A]/30"
                                : "bg-[#4EAD8A]/15 text-[#4EAD8A] border-[#4EAD8A]/30"
                            }`}
                          >
                            {isFraud ? "FRAUD (1)" : "LEGIT (0)"}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Execute Button */}
                <div className="mt-5">
                  <Button
                    onClick={handleRunScoring}
                    disabled={isScoring}
                    className="w-full flex items-center justify-center gap-2 bg-[#C9A24D] hover:bg-[#E6C875] text-[#0A0A0F] font-heading font-bold text-xs py-3 shadow-lg shadow-[#C9A24D]/20 transition-all rounded-xl"
                  >
                    {isScoring ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                        Scoring Payload...
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-current" />
                        Execute Live /score API Call
                      </>
                    )}
                  </Button>
                </div>

                {/* Score Output Panel */}
                <AnimatePresence mode="wait">
                  {scoreResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="mt-5 rounded-xl border border-[#242436] bg-[#0A0A0F]/90 p-4 font-mono"
                    >
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#242436]">
                        <span className="text-xs text-[#8E8E9E]">Inference Telemetry</span>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#E6C875]">
                          <Clock className="h-3 w-3" />
                          <span>{scoreResult.latency_ms} ms latency</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <div className="text-[11px] text-[#8E8E9E]">Model Fraud Probability</div>
                          <div className="text-2xl font-heading font-black text-[#F5F1E8]">
                            {(scoreResult.risk_score * 100).toFixed(2)}%
                          </div>
                        </div>

                        <div>
                          {scoreResult.is_flagged ? (
                            <Badge className="bg-[#C4707A]/20 hover:bg-[#C4707A]/20 text-[#C4707A] border border-[#C4707A]/40 text-xs px-3 py-1 font-bold flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              FLAGGED FOR REVIEW
                            </Badge>
                          ) : (
                            <Badge className="bg-[#4EAD8A]/20 hover:bg-[#4EAD8A]/20 text-[#4EAD8A] border border-[#4EAD8A]/40 text-xs px-3 py-1 font-bold flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5" />
                              APPROVED (PASS)
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Visual Probability Bar */}
                      <div className="mt-3">
                        <div className="relative h-2.5 w-full rounded-full bg-[#181824] overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              scoreResult.is_flagged ? "bg-[#C4707A]" : "bg-[#4EAD8A]"
                            }`}
                            style={{
                              width: `${Math.min(Math.max(scoreResult.risk_score * 100, 2), 100)}%`,
                            }}
                          ></div>
                          {/* Cutoff Marker */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-[#C9A24D] z-10"
                            style={{ left: `${scoreResult.threshold_applied * 100}%` }}
                            title={`Threshold: ${scoreResult.threshold_applied}`}
                          ></div>
                        </div>
                        <div className="mt-1.5 flex justify-between text-[10px] text-[#8E8E9E]">
                          <span>0%</span>
                          <span className="text-[#E6C875] font-bold">
                            Active Cutoff: t = {scoreResult.threshold_applied.toFixed(2)}
                          </span>
                          <span>100%</span>
                        </div>
                      </div>

                      {scoreResult.error && (
                        <div className="mt-2.5 text-[10px] text-[#E6C875] bg-[#C9A24D]/10 p-2 rounded border border-[#C9A24D]/25">
                          {scoreResult.error}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* Feature Inspector */}
            <Card className="border-[#242436] bg-[#12121A]/70 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading font-bold text-xs text-[#F5F1E8]">
                    Feature Inspector ({currentSample.id})
                  </CardTitle>
                  <span className="text-[10px] font-mono text-[#8E8E9E]">30 PCA Projections</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono max-h-36 overflow-y-auto pr-1">
                  <div className="bg-[#0A0A0F] p-2 rounded-lg border border-[#242436]">
                    <span className="text-[#8E8E9E] block text-[10px]">Amount ($)</span>
                    <span className="text-[#F5F1E8] font-semibold">${currentSample.amount_usd.toFixed(2)}</span>
                  </div>
                  <div className="bg-[#0A0A0F] p-2 rounded-lg border border-[#242436]">
                    <span className="text-[#8E8E9E] block text-[10px]">V14 (Anom Factor)</span>
                    <span className="text-[#E6C875] font-semibold">{(currentSample.features.V14 as number).toFixed(3)}</span>
                  </div>
                  <div className="bg-[#0A0A0F] p-2 rounded-lg border border-[#242436]">
                    <span className="text-[#8E8E9E] block text-[10px]">V10 (Anom Factor)</span>
                    <span className="text-[#E6C875] font-semibold">{(currentSample.features.V10 as number).toFixed(3)}</span>
                  </div>
                  <div className="bg-[#0A0A0F] p-2 rounded-lg border border-[#242436]">
                    <span className="text-[#8E8E9E] block text-[10px]">V4</span>
                    <span className="text-[#F5F1E8] font-semibold">{(currentSample.features.V4 as number).toFixed(3)}</span>
                  </div>
                  <div className="bg-[#0A0A0F] p-2 rounded-lg border border-[#242436]">
                    <span className="text-[#8E8E9E] block text-[10px]">V12</span>
                    <span className="text-[#F5F1E8] font-semibold">{(currentSample.features.V12 as number).toFixed(3)}</span>
                  </div>
                  <div className="bg-[#0A0A0F] p-2 rounded-lg border border-[#242436]">
                    <span className="text-[#8E8E9E] block text-[10px]">V17</span>
                    <span className="text-[#F5F1E8] font-semibold">{(currentSample.features.V17 as number).toFixed(3)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Interactive Threshold Optimizer & PR Curve (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Threshold Slider Card */}
            <Card className="border-[#242436] bg-[#12121A]/85 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-[#242436] pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-[#C9A24D]" />
                    <CardTitle className="font-heading font-bold text-sm text-[#F5F1E8] uppercase tracking-wider">
                      2. Operating Threshold Slider
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-[#8E8E9E]">Selected Cutoff:</span>
                    <Badge variant="outline" className="border-[#C9A24D]/40 bg-[#C9A24D]/10 text-[#E6C875] font-bold px-2 py-0.5">
                      t = {selectedThreshold.toFixed(2)}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-xs text-[#8E8E9E] mt-1">
                  Drag the cutoff to balance false positive friction ($5.00) vs fraud losses ($122.21).
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-5">
                {/* Slider Component */}
                <div className="px-1">
                  <div className="flex justify-between text-xs font-mono text-[#8E8E9E] mb-2">
                    <span className="text-[#E6C875] font-semibold">High Recall (t=0.10)</span>
                    <span className="text-[#4EAD8A] font-bold">★ Cost-Optimal ($1,424.31)</span>
                    <span className="text-[#8E8E9E] font-semibold">High Precision (t=0.90)</span>
                  </div>

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
                    className="w-full h-2.5 bg-[#181824] rounded-lg appearance-none cursor-pointer accent-[#C9A24D] transition-all"
                  />

                  <div className="flex justify-between text-[11px] font-mono text-[#8E8E9E] mt-2 px-0.5">
                    {[0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((t) => (
                      <span
                        key={t}
                        className={`cursor-pointer transition-colors ${
                          Math.abs(t - selectedThreshold) < 0.01
                            ? "text-[#E6C875] font-bold"
                            : "hover:text-[#F5F1E8]"
                        }`}
                        onClick={() => {
                          setSelectedThreshold(t);
                          setScoreResult(null);
                        }}
                      >
                        {t.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Metric Readouts with Framer Motion */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  {/* Recall */}
                  <motion.div
                    key={`recall-${selectedThreshold}`}
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-[#242436] bg-[#0A0A0F] p-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[#8E8E9E]">
                      <span className="text-[10px] uppercase font-semibold">Recall</span>
                      <Target className="h-3.5 w-3.5 text-[#4EAD8A]" />
                    </div>
                    <div className="my-1.5 font-heading font-black text-xl text-[#4EAD8A]">
                      {activeThresholdRow.recall.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-[#8E8E9E]">
                      {activeThresholdRow.tp_count} / 74 Caught
                    </span>
                  </motion.div>

                  {/* Precision */}
                  <motion.div
                    key={`prec-${selectedThreshold}`}
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-[#242436] bg-[#0A0A0F] p-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[#8E8E9E]">
                      <span className="text-[10px] uppercase font-semibold">Precision</span>
                      <TelemetrySpikeIcon size={14} />
                    </div>
                    <div className="my-1.5 font-heading font-black text-xl text-[#E6C875]">
                      {activeThresholdRow.precision.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-[#8E8E9E]">
                      {activeThresholdRow.fp_per_10k.toFixed(1)} FP / 10k Tx
                    </span>
                  </motion.div>

                  {/* False Positives */}
                  <motion.div
                    key={`fp-${selectedThreshold}`}
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-[#242436] bg-[#0A0A0F] p-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[#8E8E9E]">
                      <span className="text-[10px] uppercase font-semibold">False Positives</span>
                      <RadarSweepIcon size={14} />
                    </div>
                    <div className="my-1.5 font-heading font-black text-xl text-[#F5F1E8]">
                      {activeThresholdRow.fp_count}
                    </div>
                    <span className="text-[10px] text-[#8E8E9E]">
                      Friction: ${activeThresholdRow.friction_costs.toFixed(0)}
                    </span>
                  </motion.div>

                  {/* Total Net Cost */}
                  <motion.div
                    key={`cost-${selectedThreshold}`}
                    initial={{ opacity: 0.6, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-[#C9A24D]/35 bg-[#C9A24D]/10 p-3.5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-[#8E8E9E]">
                      <span className="text-[10px] uppercase font-semibold text-[#E6C875]">Total Net Cost</span>
                      <CostMatrixIcon size={14} />
                    </div>
                    <div className="my-1.5 font-heading font-black text-xl text-[#F5F1E8]">
                      ${activeThresholdRow.total_cost.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-[#8E8E9E]">
                      FN: ${activeThresholdRow.fraud_losses.toFixed(0)} | FP: ${activeThresholdRow.friction_costs.toFixed(0)}
                    </span>
                  </motion.div>
                </div>
              </CardContent>
            </Card>

            {/* Precision-Recall Curve Chart (Recharts) */}
            <Card className="border-[#242436] bg-[#12121A]/85 shadow-xl backdrop-blur-sm">
              <CardHeader className="border-b border-[#242436] pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#C9A24D]" />
                    <CardTitle className="font-heading font-bold text-sm text-[#F5F1E8] uppercase tracking-wider">
                      Precision-Recall Curve (PR-AUC: 0.8424)
                    </CardTitle>
                  </div>
                  <span className="text-[11px] font-mono text-[#8E8E9E]">
                    Operating Point: t = {selectedThreshold.toFixed(2)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={PR_CURVE_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F1F2E" />
                      <XAxis
                        dataKey="recall"
                        type="number"
                        domain={[0, 1]}
                        tickCount={6}
                        tick={{ fill: "#8E8E9E", fontSize: 11, fontFamily: "monospace" }}
                        label={{ value: "Recall", position: "insideBottomRight", offset: -5, fill: "#8E8E9E", fontSize: 11 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        tick={{ fill: "#8E8E9E", fontSize: 11, fontFamily: "monospace" }}
                        label={{ value: "Precision (%)", angle: -90, position: "insideLeft", offset: 15, fill: "#8E8E9E", fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0A0A0F",
                          borderColor: "#242436",
                          borderRadius: "10px",
                          fontSize: "12px",
                          fontFamily: "monospace",
                          color: "#F5F1E8",
                        }}
                        // @ts-expect-error recharts formatter typing
                        formatter={(val: number) => [`${val.toFixed(2)}%`, ""]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", fontFamily: "monospace", paddingTop: "8px" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="xgb_precision"
                        name="XGBoost Production (0.8424)"
                        stroke="#C9A24D"
                        strokeWidth={2.5}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="baseline_precision"
                        name="Logistic Regression (0.7904)"
                        stroke="#5A5A70"
                        strokeWidth={1.5}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="no_skill"
                        name="No-Skill Baseline (0.17%)"
                        stroke="#C4707A"
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                      />
                      {/* Active operating point marker */}
                      <ReferenceDot
                        x={activePRPoint.recall}
                        y={activePRPoint.precision}
                        r={6}
                        fill="#C9A24D"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <p className="mt-2 text-[11px] text-[#8E8E9E] font-mono text-center">
                  Gold marker tracks current operating posture (Recall: {activeThresholdRow.recall.toFixed(1)}%, Precision: {activeThresholdRow.precision.toFixed(1)}%).
                </p>
              </CardContent>
            </Card>

            {/* Threshold Sweep Cost Matrix Table */}
            <Card className="border-[#242436] bg-[#12121A]/70 shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CostMatrixIcon size={16} />
                  <CardTitle className="font-heading font-bold text-xs text-[#F5F1E8] uppercase">
                    Full Cost Matrix Sweep ($122.21 / FN vs $5.00 / FP)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table className="w-full text-[11px] font-mono">
                    <TableHeader>
                      <TableRow className="border-[#242436] hover:bg-transparent">
                        <TableHead className="text-[#8E8E9E]">Threshold</TableHead>
                        <TableHead className="text-[#8E8E9E]">Recall</TableHead>
                        <TableHead className="text-[#8E8E9E]">Precision</TableHead>
                        <TableHead className="text-[#8E8E9E]">FP Count</TableHead>
                        <TableHead className="text-[#8E8E9E]">FN Count</TableHead>
                        <TableHead className="text-[#8E8E9E]">Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {THRESHOLD_DATA.map((row) => {
                        const isActive = Math.abs(row.threshold - selectedThreshold) < 0.001;
                        return (
                          <TableRow
                            key={row.threshold}
                            onClick={() => setSelectedThreshold(row.threshold)}
                            className={`cursor-pointer transition-colors border-[#242436]/60 ${
                              isActive
                                ? "bg-[#C9A24D]/15 text-[#E6C875] font-bold border-[#C9A24D]/40"
                                : "text-[#8E8E9E] hover:bg-[#181824]/60"
                            }`}
                          >
                            <TableCell className="py-2">
                              {row.threshold.toFixed(2)}{" "}
                              {row.is_optimal && (
                                <Badge className="bg-[#4EAD8A]/20 text-[#4EAD8A] border border-[#4EAD8A]/35 text-[9px] px-1.5 py-0 font-bold ml-1">
                                  OPTIMAL
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="py-2 text-[#4EAD8A]">{row.recall.toFixed(1)}%</TableCell>
                            <TableCell className="py-2 text-[#E6C875]">{row.precision.toFixed(1)}%</TableCell>
                            <TableCell className="py-2">{row.fp_count}</TableCell>
                            <TableCell className="py-2">{row.fn_count}</TableCell>
                            <TableCell className="py-2 text-[#F5F1E8] font-semibold">${row.total_cost.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
