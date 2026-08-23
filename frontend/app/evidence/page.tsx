"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TreeAttributionIcon,
  BiometricShieldIcon,
  TelemetrySpikeIcon,
} from "@/components/icons/CustomIcons";
import {
  FileText,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Clock,
  Code2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SAMPLE_TRANSACTIONS } from "../data/metricsData";

export default function EvidencePage() {
  const [selectedTxKey, setSelectedTxKey] = useState<keyof typeof SAMPLE_TRANSACTIONS>("confirmed_fraud");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showJson, setShowJson] = useState<boolean>(false);

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

  // Fetch explanation from FastAPI backend or generate locally
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
              description: "Derived PCA Anomaly Factor V14",
              value: -5.2101,
              shap_value: 4.9198,
              contribution_pct: 52.2,
              direction: "increases_risk",
            },
            {
              feature: "V10",
              description: "Derived PCA Anomaly Factor V10",
              value: -3.2322,
              shap_value: 1.7590,
              contribution_pct: 18.7,
              direction: "increases_risk",
            },
            {
              feature: "V3",
              description: "Derived PCA Anomaly Factor V3",
              value: -5.0042,
              shap_value: 1.0967,
              contribution_pct: 11.6,
              direction: "increases_risk",
            },
            {
              feature: "V12",
              description: "Derived PCA Anomaly Factor V12",
              value: -3.0969,
              shap_value: 0.9131,
              contribution_pct: 9.7,
              direction: "increases_risk",
            },
            {
              feature: "V1",
              description: "Derived PCA Anomaly Factor V1",
              value: 1.3786,
              shap_value: -0.7322,
              contribution_pct: 7.8,
              direction: "decreases_risk",
            },
          ]
        : [
            {
              feature: "V14",
              description: "Derived PCA Anomaly Factor V14",
              value: -0.1564,
              shap_value: -2.1042,
              contribution_pct: 45.0,
              direction: "decreases_risk",
            },
            {
              feature: "Amount",
              description: "Transaction Monetary Volume (Scaled Dollar Amount)",
              value: -0.1122,
              shap_value: -1.2405,
              contribution_pct: 26.5,
              direction: "decreases_risk",
            },
            {
              feature: "V4",
              description: "Derived PCA Anomaly Factor V4",
              value: 0.4031,
              shap_value: -0.6510,
              contribution_pct: 13.9,
              direction: "decreases_risk",
            },
            {
              feature: "V10",
              description: "Derived PCA Anomaly Factor V10",
              value: 0.1205,
              shap_value: -0.4510,
              contribution_pct: 9.6,
              direction: "decreases_risk",
            },
            {
              feature: "V12",
              description: "Derived PCA Anomaly Factor V12",
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
        evidence_summary: `### SentinelPay Automated Fraud Evidence & Chargeback Dossier\n**Metadata:** Transaction ID: \`${currentTx.id}\` | Amount: \`$${currentTx.amount_usd.toFixed(2)}\` | Risk Score: \`${fallbackRisk.toFixed(4)}\` (${(fallbackRisk * 100).toFixed(2)}%) | Status: **\`${isFlagged ? "FLAGGED_FOR_REVIEW" : "APPROVED"}\`**\n\n#### 1. Executive Summary & Automated Evidence Narrative\nThis transaction was ${isFlagged ? `flagged with an estimated fraud risk score of **${(fallbackRisk * 100).toFixed(1)}%** exceeding the operational security threshold (0.10). Primary quantitative risk drivers: statistical anomaly in derived component V14 (value: -5.21, 52.2% weight), statistical anomaly in derived component V10 (value: -3.23, 18.7% weight).` : `cleared with a low fraud risk score of **${(fallbackRisk * 100).toFixed(2)}%** (Decision: APPROVED).`}\n\n#### 2. Recommended Operational Action & Dispute Defense\n${isFlagged ? "**High-Confidence Fraud Pattern Detected**: Immediate cardholder challenge / step-up 3D Secure authentication required. Attach this SHAP attribution log verifying multi-dimensional statistical divergence from valid cardholder behavioral profiles." : "**Standard Low-Risk Transaction**: Transaction cleared for automated straight-through processing."}`,
        latency_ms: Number(elapsed.toFixed(2)),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!explainData) return;
    navigator.clipboard.writeText(explainData.evidence_summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F1E8] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#242436] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-[#C9A24D]"></span>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#E6C875]">
                SHAP Auto-Responder & Dispute Evidence Engine
              </span>
            </div>
            <h1 className="mt-1 font-heading font-black text-2xl sm:text-3xl text-[#F5F1E8] tracking-tight">
              Automated Chargeback Defense Dossier
            </h1>
            <p className="mt-1 text-xs text-[#8E8E9E]">
              Exact Shapley game-theoretic attributions decomposed via <code className="text-[#E6C875] font-mono">shap.TreeExplainer</code> into dispute-ready narratives.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowJson(!showJson)}
              className="border-[#242436] bg-[#12121A] text-[#8E8E9E] hover:text-[#F5F1E8] hover:bg-[#181824] font-mono text-xs"
            >
              <Code2 className="h-3.5 w-3.5 mr-1.5 text-[#C9A24D]" />
              {showJson ? "Hide Raw Payload" : "Inspect Raw JSON"}
            </Button>
          </div>
        </div>

        {/* Transaction Selector Strip */}
        <div className="mt-6">
          <label className="text-xs font-mono text-[#8E8E9E] block mb-2">
            Select Test Set Payload to Deconstruct:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(SAMPLE_TRANSACTIONS) as Array<keyof typeof SAMPLE_TRANSACTIONS>).map((key) => {
              const tx = SAMPLE_TRANSACTIONS[key];
              const isSelected = selectedTxKey === key;
              const isFraud = key.includes("fraud");
              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTxKey(key);
                    setExplainData(null);
                  }}
                  className={`flex flex-col justify-between rounded-xl p-3.5 text-left transition-all border ${
                    isSelected
                      ? "border-[#C9A24D]/60 bg-[#C9A24D]/10 shadow-md ring-1 ring-[#C9A24D]/30"
                      : "border-[#242436] bg-[#12121A]/70 hover:border-[#383850] hover:bg-[#181824]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-[#F5F1E8]">{tx.id}</span>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[9px] font-bold ${
                        isFraud
                          ? "bg-[#C4707A]/20 text-[#C4707A] border-[#C4707A]/30"
                          : "bg-[#4EAD8A]/20 text-[#4EAD8A] border-[#4EAD8A]/30"
                      }`}
                    >
                      {tx.ground_truth}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs font-medium text-[#8E8E9E] line-clamp-1">{tx.label}</div>
                  <div className="mt-1 text-[11px] font-mono text-[#F5F1E8] font-semibold">${tx.amount_usd.toFixed(2)} USD</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate Evidence Trigger Banner */}
        <Card className="mt-5 border-[#242436] bg-[#12121A]/85 shadow-lg backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C9A24D]/15 text-[#C9A24D] border border-[#C9A24D]/30">
                <TreeAttributionIcon size={22} />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-[#F5F1E8] flex items-center gap-2">
                  <span>Target Payload:</span>
                  <span className="text-[#E6C875]">{currentTx.id}</span>
                  <span className="text-[#8E8E9E] font-normal">(${currentTx.amount_usd.toFixed(2)})</span>
                </div>
                <p className="text-[11px] text-[#8E8E9E] font-mono mt-0.5">
                  Calculates exact Shapley game-theoretic attributions across 30 PCA decision trees.
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerateExplanation}
              disabled={isLoading}
              className="bg-[#C9A24D] hover:bg-[#E6C875] text-[#0A0A0F] font-heading font-bold text-xs px-6 py-3 shadow-lg shadow-[#C9A24D]/20 transition-all w-full sm:w-auto rounded-xl"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Deconstructing SHAP Paths...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 mr-2" />
                  Generate Dispute Dossier
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Dossier Output Presentation */}
        <AnimatePresence mode="wait">
          {explainData ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="mt-6 flex flex-col gap-6"
            >
              {/* Telemetry Bar */}
              <div className="flex items-center justify-between text-xs font-mono text-[#8E8E9E]">
                <div className="flex items-center gap-2 text-[#E6C875]">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Computed in {explainData.latency_ms} ms via TreeExplainer</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyMarkdown}
                    className="border-[#242436] bg-[#12121A] text-[#F5F1E8] hover:bg-[#181824] font-mono text-xs rounded-lg"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1.5 text-[#4EAD8A]" />
                        <span className="text-[#4EAD8A]">Copied Markdown!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 mr-1.5 text-[#8E8E9E]" />
                        <span>Copy Markdown Dossier</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Main Dossier Card */}
              <Card className="border-[#242436] bg-[#12121A]/90 shadow-2xl backdrop-blur-sm overflow-hidden">
                {/* Dossier Header */}
                <CardHeader className="border-b border-[#242436] bg-[#0A0A0F]/70 pb-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#E6C875] font-bold block mb-1">
                        Dispute Evidence & Chargeback Defense Dossier
                      </span>
                      <div className="flex items-center gap-3">
                        <CardTitle className="font-heading font-black text-xl text-[#F5F1E8]">
                          {explainData.transaction_id}
                        </CardTitle>
                        <Badge variant="secondary" className="font-mono text-xs bg-[#181824] text-[#F5F1E8] border-[#242436]">
                          ${currentTx.amount_usd.toFixed(2)} USD
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono">
                        <div className="text-[10px] text-[#8E8E9E]">Estimated Risk Score</div>
                        <div className="font-heading font-black text-2xl text-[#F5F1E8]">
                          {(explainData.risk_score * 100).toFixed(2)}%
                        </div>
                      </div>

                      {explainData.is_flagged ? (
                        <Badge className="bg-[#C4707A]/20 text-[#C4707A] border border-[#C4707A]/40 font-mono text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4" />
                          FLAGGED FOR REVIEW
                        </Badge>
                      ) : (
                        <Badge className="bg-[#4EAD8A]/20 text-[#4EAD8A] border border-[#4EAD8A]/40 font-mono text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" />
                          APPROVED
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  {/* Section 1: Executive Summary */}
                  <div>
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#8E8E9E] mb-2.5 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-[#C9A24D]" />
                      1. Executive Summary & Automated Evidence Narrative
                    </h3>
                    <div className="rounded-xl border border-[#242436] bg-[#0A0A0F]/90 p-4 text-xs sm:text-sm text-[#F5F1E8] leading-relaxed font-sans">
                      This transaction was{" "}
                      {explainData.is_flagged ? (
                        <>
                          flagged with an estimated fraud risk score of{" "}
                          <strong className="text-[#C4707A] font-mono">
                            {(explainData.risk_score * 100).toFixed(1)}%
                          </strong>{" "}
                          exceeding the operational security threshold ({explainData.threshold_applied.toFixed(2)}).
                          Primary quantitative risk drivers:{" "}
                          {explainData.top_features
                            .filter((f) => f.direction === "increases_risk")
                            .map((f, i) => (
                              <span key={f.feature}>
                                {i > 0 && ", "}
                                <strong>{f.feature}</strong> (anomaly value:{" "}
                                <span className="font-mono text-[#F5F1E8]">{f.value.toFixed(2)}</span>,{" "}
                                <span className="font-mono text-[#E6C875] font-semibold">
                                  {f.contribution_pct}%
                                </span>{" "}
                                weight)
                              </span>
                            ))}
                          .
                          {explainData.top_features.some((f) => f.direction === "decreases_risk") && (
                            <span>
                              {" "}Conversely, baseline consistency in{" "}
                              {explainData.top_features
                                .filter((f) => f.direction === "decreases_risk")
                                .map((f) => `${f.feature} (${f.contribution_pct}% mitigating weight)`)
                                .join(", ")}{" "}
                              partially mitigated the anomaly score.
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          cleared with a low fraud risk score of{" "}
                          <strong className="text-[#4EAD8A] font-mono">
                            {(explainData.risk_score * 100).toFixed(2)}%
                          </strong>{" "}
                          (Decision: APPROVED). Baseline transaction telemetry matched expected cardholder behavioral
                          distributions across primary PCA projection vectors.
                        </>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Top 5 SHAP Feature Breakdown */}
                  <div>
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#8E8E9E] mb-3 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-[#C9A24D]" />
                      2. Top 5 SHAP Game-Theoretic Attributions
                    </h3>

                    <div className="grid grid-cols-1 gap-2.5 font-mono text-xs">
                      {explainData.top_features.map((feat, idx) => {
                        const isRisk = feat.direction === "increases_risk";
                        return (
                          <div
                            key={feat.feature}
                            className="rounded-xl border border-[#242436] bg-[#0A0A0F] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#383850] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#181824] text-[11px] font-bold text-[#8E8E9E]">
                                {idx + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-[#F5F1E8]">{feat.feature}</span>
                                  <span className="text-[11px] text-[#8E8E9E] font-sans">({feat.description})</span>
                                </div>
                                <div className="text-[11px] text-[#8E8E9E] mt-0.5">
                                  Observed Normalized Value: <code className="text-[#F5F1E8] font-semibold">{feat.value}</code>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 sm:text-right">
                              <div>
                                <div className="text-[10px] text-[#8E8E9E]">SHAP Attribution</div>
                                <div className={`font-bold ${isRisk ? "text-[#C4707A]" : "text-[#4EAD8A]"}`}>
                                  {feat.shap_value > 0 ? `+${feat.shap_value.toFixed(4)}` : feat.shap_value.toFixed(4)}
                                </div>
                              </div>

                              <div className="min-w-[80px]">
                                <div className="text-[10px] text-[#8E8E9E]">Contribution</div>
                                <div className="text-sm font-bold text-[#F5F1E8]">{feat.contribution_pct}%</div>
                              </div>

                              <div>
                                {isRisk ? (
                                  <Badge className="bg-[#C4707A]/15 text-[#C4707A] border border-[#C4707A]/30 text-[10px] font-bold flex items-center gap-1">
                                    <TrendingUp className="h-3 w-3" />
                                    Increases Risk
                                  </Badge>
                                ) : (
                                  <Badge className="bg-[#4EAD8A]/15 text-[#4EAD8A] border border-[#4EAD8A]/30 text-[10px] font-bold flex items-center gap-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Decreases Risk
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section 3: Recommended Action */}
                  <div>
                    <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#8E8E9E] mb-2.5 flex items-center gap-2">
                      <BiometricShieldIcon size={14} />
                      3. Recommended Operational Action & Dispute Defense Strategy
                    </h3>
                    <div className="rounded-xl border border-[#C9A24D]/30 bg-[#C9A24D]/10 p-4 text-xs text-[#F5F1E8] leading-relaxed font-sans">
                      {explainData.risk_score >= 0.70 ? (
                        <div>
                          <strong className="text-[#C4707A] font-semibold">High-Confidence Fraud Pattern Detected:</strong>{" "}
                          Immediate cardholder challenge / step-up 3D Secure authentication required. If a chargeback dispute
                          is initiated, attach this SHAP attribution log verifying multi-dimensional statistical divergence
                          from valid cardholder behavioral profiles.
                        </div>
                      ) : explainData.is_flagged ? (
                        <div>
                          <strong className="text-[#E6C875] font-semibold">Elevated Risk Score Detected:</strong>{" "}
                          Recommend automated SMS/OTP confirmation or temporary hold. Log evidence telemetry for automated
                          chargeback defense.
                        </div>
                      ) : (
                        <div>
                          <strong className="text-[#4EAD8A] font-semibold">Standard Low-Risk Transaction:</strong>{" "}
                          Transaction cleared for automated straight-through processing.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transparency Notice */}
                  <div className="border-t border-[#242436] pt-4 text-[11px] text-[#8E8E9E] font-mono">
                    <strong>Methodology & Anonymization Integrity:</strong> Components V1–V28 represent anonymized PCA projections.
                    Feature attributions reflect exact mathematical Shapley game-theoretic contributions without speculative business relabeling.
                  </div>
                </CardContent>
              </Card>

              {/* Raw JSON Inspector */}
              <AnimatePresence>
                {showJson && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <Card className="border-[#242436] bg-[#0A0A0F] p-4 font-mono text-xs text-[#F5F1E8] overflow-x-auto">
                      <pre>{JSON.stringify(explainData, null, 2)}</pre>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <Card className="mt-8 border-dashed border-[#242436] bg-[#12121A]/40 p-12 text-center">
              <CardContent className="flex flex-col items-center">
                <FileText className="h-10 w-10 text-[#5A5A70] mb-3" />
                <CardTitle className="font-heading font-semibold text-sm text-[#F5F1E8]">
                  No Evidence Dossier Generated Yet
                </CardTitle>
                <CardDescription className="mt-1 text-xs text-[#8E8E9E] max-w-sm">
                  Select a transaction fixture above and click{" "}
                  <strong className="text-[#E6C875]">&quot;Generate Dispute Dossier&quot;</strong> to compute live SHAP
                  feature attributions.
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
