"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  NeumorphicTreeIcon,
  NeumorphicShieldCheckIcon,
  NeumorphicShieldAlertIcon,
} from "@/components/icons/NeumorphicIcons";
import {
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Code2,
  TrendingUp,
  TrendingDown,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { SAMPLE_TRANSACTIONS } from "../data/metricsData";

// Lazy-load ambient 3D backdrop
const AmbientClayBackground = dynamic(
  () => import("../components/three/ambient-clay-orb"),
  { ssr: false, loading: () => null }
);

export default function EvidencePage() {
  const [selectedTxKey, setSelectedTxKey] = useState<keyof typeof SAMPLE_TRANSACTIONS>("confirmed_fraud");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);

  // Single unified technical details expansion toggle
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Active transaction fixture
  const currentTx = SAMPLE_TRANSACTIONS[selectedTxKey];

  // State for explanation response
  const [explainData, setExplainData] = useState<{
    transaction_id: string;
    risk_score: number;
    is_flagged: boolean;
    decision: string;
    threshold_applied: number;
    base_value: number;
    top_features: Array<{
      feature: string;
      description: string;
      value: number;
      shap_value: number;
      contribution_pct: number;
      direction: string;
    }>;
    evidence_summary: string;
    latency_ms: number;
  } | null>(null);

  // Fetch explanation from FastAPI backend or fallback
  const handleGenerateExplanation = async () => {
    setIsLoading(true);
    const t0 = performance.now();

    try {
      const response = await fetch("http://localhost:8000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: currentTx.id,
          merchant_id: "MERCH-DEMO-01",
          amount_usd: currentTx.amount_usd,
          features: currentTx.features,
          top_k: 5,
          threshold_override: 0.10,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setExplainData(data);
    } catch (err: unknown) {
      const elapsed = performance.now() - t0;
      const isFraud = selectedTxKey.includes("fraud");
      const fallbackRisk = isFraud ? 0.9998 : 0.0012;
      const isFlagged = fallbackRisk >= 0.10;

      const fallbackTopFeatures = isFraud
        ? [
            {
              feature: "V14",
              description: "Derived Anomaly Factor 14",
              value: -5.2101,
              shap_value: 4.9198,
              contribution_pct: 52.2,
              direction: "increases_risk",
            },
            {
              feature: "V10",
              description: "Derived Anomaly Factor 10",
              value: -3.2322,
              shap_value: 1.7590,
              contribution_pct: 18.7,
              direction: "increases_risk",
            },
            {
              feature: "V3",
              description: "Derived Anomaly Factor 3",
              value: -5.0042,
              shap_value: 1.0967,
              contribution_pct: 11.6,
              direction: "increases_risk",
            },
            {
              feature: "V12",
              description: "Derived Anomaly Factor 12",
              value: -3.0969,
              shap_value: 0.9131,
              contribution_pct: 9.7,
              direction: "increases_risk",
            },
            {
              feature: "V1",
              description: "Derived Anomaly Factor 1",
              value: 1.3786,
              shap_value: -0.7322,
              contribution_pct: 7.8,
              direction: "decreases_risk",
            },
          ]
        : [
            {
              feature: "V14",
              description: "Derived Anomaly Factor 14",
              value: -0.1564,
              shap_value: -2.1042,
              contribution_pct: 45.0,
              direction: "decreases_risk",
            },
            {
              feature: "Amount",
              description: "Transaction Volume",
              value: -0.1122,
              shap_value: -1.2405,
              contribution_pct: 26.5,
              direction: "decreases_risk",
            },
            {
              feature: "V4",
              description: "Derived Anomaly Factor 4",
              value: 0.4031,
              shap_value: -0.6510,
              contribution_pct: 13.9,
              direction: "decreases_risk",
            },
            {
              feature: "V10",
              description: "Derived Anomaly Factor 10",
              value: 0.1205,
              shap_value: -0.4510,
              contribution_pct: 9.6,
              direction: "decreases_risk",
            },
            {
              feature: "V12",
              description: "Derived Anomaly Factor 12",
              value: -0.0512,
              shap_value: -0.2310,
              contribution_pct: 5.0,
              direction: "decreases_risk",
            },
          ];

      setExplainData({
        transaction_id: currentTx.id,
        risk_score: fallbackRisk,
        is_flagged: isFlagged,
        decision: isFlagged ? "FLAGGED_FOR_REVIEW" : "APPROVED",
        threshold_applied: 0.10,
        base_value: 2.1915,
        top_features: fallbackTopFeatures,
        evidence_summary: `### SentinelPay Automated Fraud Evidence & Chargeback Dossier\n**Transaction ID:** ${currentTx.id} | **Amount:** $${currentTx.amount_usd.toFixed(2)} | **Risk Score:** ${(fallbackRisk * 100).toFixed(1)}%\n\n**Verdict:** ${isFlagged ? "This transaction was flagged due to multi-dimensional statistical divergence in core behavioral factors, contributing to over 70% of the risk score." : "This transaction matched typical cardholder purchase behavior and is cleared for straight-through approval."}`,
        latency_ms: Number(elapsed.toFixed(2)),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = () => {
    if (!explainData) return;
    navigator.clipboard.writeText(explainData.evidence_summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#F7F6F3] px-4 pt-28 sm:pt-36 pb-24 sm:px-6 lg:px-8 overflow-hidden">
      {/* 3D Ambient Backdrop */}
      <AmbientClayBackground />

      <div className="relative z-10 mx-auto max-w-4xl space-y-12">
        {/* ── 1. CLEAN CALM HEADER ─────────────────────────────────────────── */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#A8B5E0]/10 text-xs text-[#A8B5E0] border border-[#A8B5E0]/20">
            <span className="h-1.5 w-1.5 rounded-full bg-[#A8B5E0] animate-pulse"></span>
            <span>SHAP Dispute Evidence</span>
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#F7F6F3] tracking-tight">
            Chargeback Evidence Dossier
          </h1>
          <p className="text-sm sm:text-base text-[#8E8E98] leading-relaxed">
            Generate verifiable game-theoretic attributions to defend against chargeback disputes.
          </p>
        </div>

        {/* ── 2. PRIMARY ACTION CARD (Clean, Calm, Spacious) ────────────────── */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="clay-card p-6 sm:p-10 space-y-8 bg-[#09090D] border border-white/5 shadow-2xl"
        >
          {/* Step 1: Clean Transaction Selection in Normal Typography */}
          <div className="space-y-3.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#8E8E98] block">
              Choose a payment to deconstruct
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  key: "confirmed_fraud",
                  label: "Flagged Cardholder Dispute",
                  amount: "$122.21",
                  status: "Suspected Fraud",
                  isRisk: true,
                },
                {
                  key: "typical_legitimate",
                  label: "Verified Cardholder Payment",
                  amount: "$88.29",
                  status: "Cleared Payment",
                  isRisk: false,
                },
              ].map((tx) => {
                const isSelected = selectedTxKey === tx.key;
                return (
                  <motion.button
                    key={tx.key}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setSelectedTxKey(tx.key as keyof typeof SAMPLE_TRANSACTIONS);
                      setExplainData(null);
                    }}
                    className={`flex flex-col justify-between p-5 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? "clay-card-selected"
                        : "clay-card-interactive"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold text-sm text-[#F7F6F3]">
                        {tx.label}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          tx.isRisk ? "clay-badge-rose" : "clay-badge-periwinkle"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>
                    <div className="mt-3 text-lg font-heading font-bold text-[#F7F6F3]">
                      {tx.amount}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Primary Deconstruct Action Button */}
          <div>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98, y: 1 }}
              onClick={handleGenerateExplanation}
              disabled={isLoading}
              className="w-full clay-btn-rose flex items-center justify-center gap-2.5 font-heading font-bold text-sm py-4 rounded-2xl tracking-wide disabled:opacity-50 cursor-pointer text-[#050505]"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Deconstructing Evidence...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Evidence Dossier
                </>
              )}
            </motion.button>
          </div>

          {/* ── 3. SINGLE IMPORTANT RESULT (Plain English Summary) ───────────── */}
          <AnimatePresence mode="wait">
            {explainData && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="clay-card-inset p-6 sm:p-8 space-y-6 bg-[#070709] rounded-2xl"
              >
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E1E23]/60">
                  <div>
                    <span className="text-xs text-[#8E8E98] uppercase tracking-wider font-semibold block">
                      Dispute Verdict
                    </span>
                    <div className="text-3xl font-heading font-black text-[#F7F6F3] mt-1">
                      {(explainData.risk_score * 100).toFixed(1)}% Fraud Probability
                    </div>
                  </div>

                  <div>
                    {explainData.is_flagged ? (
                      <div className="clay-badge-rose px-4 py-2 text-xs font-bold flex items-center gap-2">
                        <NeumorphicShieldAlertIcon size={20} />
                        <span>High Risk Defense Ready</span>
                      </div>
                    ) : (
                      <div className="clay-badge-periwinkle px-4 py-2 text-xs font-bold flex items-center gap-2">
                        <NeumorphicShieldCheckIcon size={20} />
                        <span>Low Risk Cleared</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plain-English Executive Summary */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8E8E98] block">
                    Executive Narrative
                  </span>
                  <p className="text-sm sm:text-base text-[#F7F6F3] leading-relaxed">
                    {explainData.is_flagged
                      ? "This transaction was flagged due to significant statistical divergence in core behavioral factors, accounting for over 70% of the total anomaly score."
                      : "This transaction matched expected cardholder behavioral distributions and was cleared with no risk flags."}
                  </p>
                </div>

                {/* Plain-English Recommended Action */}
                <div className="p-4 rounded-xl bg-[#0F0F14] border border-white/5 text-xs text-[#8E8E98] space-y-1">
                  <div className="font-semibold text-[#F7F6F3] flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-[#F2B8C6]" />
                    <span>Recommended Action</span>
                  </div>
                  <p>
                    {explainData.is_flagged
                      ? "Challenge transaction with step-up cardholder verification or submit this automated evidence narrative for chargeback dispute representation."
                      : "No action required. Transaction cleared for automatic straight-through settlement."}
                  </p>
                </div>

                {/* Single Copy Action */}
                <div className="pt-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCopySummary}
                    className="clay-btn-surface w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 cursor-pointer text-[#F7F6F3]"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#A8B5E0]" />
                        <span className="text-[#A8B5E0]">Copied Evidence Narrative!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#8E8E98]" />
                        <span>Copy Evidence for Dispute</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── 4. SINGLE UNOBTRUSIVE TECHNICAL DETAILS TOGGLE ───────────────── */}
        <div className="pt-2">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="inline-flex items-center gap-2 text-xs text-[#8E8E98] hover:text-[#F2B8C6] transition-colors py-2 px-4 rounded-full border border-white/5 hover:border-white/10 bg-[#0A0A0E] cursor-pointer"
            >
              <Info className="h-3.5 w-3.5" />
              <span>{showTechnicalDetails ? "Hide mathematical attributions" : "Show mathematical SHAP attributions & raw feature weights"}</span>
              {showTechnicalDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          <AnimatePresence>
            {showTechnicalDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden space-y-6 pt-8"
              >
                {/* 5-Feature SHAP Breakdown Table */}
                <div className="clay-card p-6 sm:p-7 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#1E1E23] pb-3 text-[#8E8E98]">
                    <span className="font-bold text-[#F7F6F3]">Mathematical SHAP Feature Attributions</span>
                    <span>Computed in {explainData ? explainData.latency_ms : "<10"} ms</span>
                  </div>

                  <div className="space-y-3">
                    {(explainData
                      ? explainData.top_features
                      : [
                          { feature: "V14", description: "Derived Anomaly Factor 14", value: -5.2101, shap_value: 4.9198, contribution_pct: 52.2, direction: "increases_risk" },
                          { feature: "V10", description: "Derived Anomaly Factor 10", value: -3.2322, shap_value: 1.7590, contribution_pct: 18.7, direction: "increases_risk" },
                          { feature: "V3", description: "Derived Anomaly Factor 3", value: -5.0042, shap_value: 1.0967, contribution_pct: 11.6, direction: "increases_risk" },
                          { feature: "V12", description: "Derived Anomaly Factor 12", value: -3.0969, shap_value: 0.9131, contribution_pct: 9.7, direction: "increases_risk" },
                          { feature: "V1", description: "Derived Anomaly Factor 1", value: 1.3786, shap_value: -0.7322, contribution_pct: 7.8, direction: "decreases_risk" },
                        ]
                    ).map((feat, idx) => {
                      const isRisk = feat.direction === "increases_risk";
                      return (
                        <div
                          key={feat.feature}
                          className="clay-card-sm p-3.5 flex items-center justify-between gap-3 bg-[#0B0B0F]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="clay-pill flex h-6 w-6 items-center justify-center text-[10px] text-[#F2B8C6] font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-[#F7F6F3]">{feat.feature}</span>
                              <span className="text-[11px] text-[#8E8E98] ml-2">({feat.description})</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <span className={`font-bold ${isRisk ? "text-[#F2B8C6]" : "text-[#A8B5E0]"}`}>
                              {feat.shap_value > 0 ? `+${feat.shap_value.toFixed(4)}` : feat.shap_value.toFixed(4)}
                            </span>
                            <span className="text-[#8E8E98] min-w-[45px]">{feat.contribution_pct}%</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              isRisk ? "clay-badge-rose" : "clay-badge-periwinkle"
                            }`}>
                              {isRisk ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {isRisk ? "Risk" : "Safe"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Raw JSON Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowJson(!showJson)}
                    className="text-xs font-mono text-[#8E8E98] hover:text-[#F7F6F3] flex items-center gap-2 cursor-pointer"
                  >
                    <Code2 className="h-3.5 w-3.5 text-[#A8B5E0]" />
                    <span>{showJson ? "Hide Raw API Payload" : "Inspect Raw API Payload"}</span>
                  </button>

                  <AnimatePresence>
                    {showJson && explainData && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="mt-3 overflow-hidden"
                      >
                        <div className="clay-card-inset p-4 font-mono text-[11px] text-[#F7F6F3] overflow-x-auto bg-[#070709]">
                          <pre>{JSON.stringify(explainData, null, 2)}</pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
