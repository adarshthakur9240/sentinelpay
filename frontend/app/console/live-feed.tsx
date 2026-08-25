"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers,
  Clock,
  DollarSign,
  CreditCard,
  Flame,
  CheckCircle2,
  AlertTriangle,
  SlidersHorizontal,
} from "lucide-react";
import { getApiWsUrl } from "@/lib/config";

export interface StreamEvent {
  transaction_id: string;
  card_id: string;
  timestamp: string;
  time_offset_seconds: number;
  amount_usd: number;
  velocity_5min: number;
  amount_sum_5min: number;
  velocity_risk_flag: boolean;
  raw_model_risk_score: number;
  combined_risk_score: number;
  is_flagged: boolean;
  decision: "FLAGGED_FOR_REVIEW" | "APPROVED";
  ground_truth_class?: number;
  latency_ms: number;
}

// 25-Transaction Curated Demo Burst (guaranteed self-contained & pitch-ready)
const PRESET_BURST_EVENTS: StreamEvent[] = [
  {
    transaction_id: "TXN-STRM-000101",
    card_id: "CARD-BURST-1002",
    timestamp: "2026-08-25T02:15:10Z",
    time_offset_seconds: 10.0,
    amount_usd: 4.50,
    velocity_5min: 1,
    amount_sum_5min: 4.50,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.012,
    combined_risk_score: 0.012,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.2,
  },
  {
    transaction_id: "TXN-STRM-000102",
    card_id: "CARD-UNIQ-104921",
    timestamp: "2026-08-25T02:15:14Z",
    time_offset_seconds: 14.0,
    amount_usd: 89.20,
    velocity_5min: 1,
    amount_sum_5min: 89.20,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.003,
    combined_risk_score: 0.003,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.8,
  },
  {
    transaction_id: "TXN-STRM-000103",
    card_id: "CARD-BURST-1002",
    timestamp: "2026-08-25T02:15:32Z",
    time_offset_seconds: 32.0,
    amount_usd: 3.00,
    velocity_5min: 2,
    amount_sum_5min: 7.50,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.045,
    combined_risk_score: 0.045,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.0,
  },
  {
    transaction_id: "TXN-STRM-000104",
    card_id: "CARD-BURST-1002",
    timestamp: "2026-08-25T02:15:58Z",
    time_offset_seconds: 58.0,
    amount_usd: 6.20,
    velocity_5min: 3,
    amount_sum_5min: 13.70,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.078,
    combined_risk_score: 0.078,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.4,
  },
  {
    transaction_id: "TXN-STRM-000105",
    card_id: "CARD-BURST-1002",
    timestamp: "2026-08-25T02:16:15Z",
    time_offset_seconds: 75.0,
    amount_usd: 12.00,
    velocity_5min: 4,
    amount_sum_5min: 25.70,
    velocity_risk_flag: true, // ⚡ Velocity threshold triggered!
    raw_model_risk_score: 0.092,
    combined_risk_score: 0.1058, // Boosted above t=0.10 threshold!
    is_flagged: true,
    decision: "FLAGGED_FOR_REVIEW",
    latency_ms: 4.1,
  },
  {
    transaction_id: "TXN-STRM-000106",
    card_id: "CARD-UNIQ-108221",
    timestamp: "2026-08-25T02:16:22Z",
    time_offset_seconds: 82.0,
    amount_usd: 245.00,
    velocity_5min: 1,
    amount_sum_5min: 245.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.005,
    combined_risk_score: 0.005,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.7,
  },
  {
    transaction_id: "TXN-STRM-000107",
    card_id: "CARD-ATTACK-9901",
    timestamp: "2026-08-25T02:16:40Z",
    time_offset_seconds: 100.0,
    amount_usd: 1420.00,
    velocity_5min: 1,
    amount_sum_5min: 1420.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.9994,
    combined_risk_score: 0.9994,
    is_flagged: true,
    decision: "FLAGGED_FOR_REVIEW",
    latency_ms: 3.9,
  },
  {
    transaction_id: "TXN-STRM-000108",
    card_id: "CARD-BURST-1002",
    timestamp: "2026-08-25T02:16:55Z",
    time_offset_seconds: 115.0,
    amount_usd: 85.00,
    velocity_5min: 5,
    amount_sum_5min: 110.70,
    velocity_risk_flag: true,
    raw_model_risk_score: 0.285,
    combined_risk_score: 0.3278,
    is_flagged: true,
    decision: "FLAGGED_FOR_REVIEW",
    latency_ms: 3.5,
  },
  {
    transaction_id: "TXN-STRM-000109",
    card_id: "CARD-UNIQ-109012",
    timestamp: "2026-08-25T02:17:05Z",
    time_offset_seconds: 125.0,
    amount_usd: 34.10,
    velocity_5min: 1,
    amount_sum_5min: 34.10,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.002,
    combined_risk_score: 0.002,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.6,
  },
  {
    transaction_id: "TXN-STRM-000110",
    card_id: "CARD-UNIQ-109013",
    timestamp: "2026-08-25T02:17:15Z",
    time_offset_seconds: 135.0,
    amount_usd: 520.00,
    velocity_5min: 1,
    amount_sum_5min: 520.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.015,
    combined_risk_score: 0.015,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.9,
  },
  {
    transaction_id: "TXN-STRM-000111",
    card_id: "CARD-BURST-4412",
    timestamp: "2026-08-25T02:17:30Z",
    time_offset_seconds: 150.0,
    amount_usd: 1.00,
    velocity_5min: 1,
    amount_sum_5min: 1.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.020,
    combined_risk_score: 0.020,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.8,
  },
  {
    transaction_id: "TXN-STRM-000112",
    card_id: "CARD-BURST-4412",
    timestamp: "2026-08-25T02:17:42Z",
    time_offset_seconds: 162.0,
    amount_usd: 2.50,
    velocity_5min: 2,
    amount_sum_5min: 3.50,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.035,
    combined_risk_score: 0.035,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.1,
  },
  {
    transaction_id: "TXN-STRM-000113",
    card_id: "CARD-BURST-4412",
    timestamp: "2026-08-25T02:17:55Z",
    time_offset_seconds: 175.0,
    amount_usd: 5.00,
    velocity_5min: 3,
    amount_sum_5min: 8.50,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.081,
    combined_risk_score: 0.081,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.0,
  },
  {
    transaction_id: "TXN-STRM-000114",
    card_id: "CARD-BURST-4412",
    timestamp: "2026-08-25T02:18:10Z",
    time_offset_seconds: 190.0,
    amount_usd: 15.00,
    velocity_5min: 4,
    amount_sum_5min: 23.50,
    velocity_risk_flag: true,
    raw_model_risk_score: 0.089,
    combined_risk_score: 0.1024,
    is_flagged: true,
    decision: "FLAGGED_FOR_REVIEW",
    latency_ms: 3.6,
  },
  {
    transaction_id: "TXN-STRM-000115",
    card_id: "CARD-UNIQ-110022",
    timestamp: "2026-08-25T02:18:25Z",
    time_offset_seconds: 205.0,
    amount_usd: 18.90,
    velocity_5min: 1,
    amount_sum_5min: 18.90,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.001,
    combined_risk_score: 0.001,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.7,
  },
  {
    transaction_id: "TXN-STRM-000116",
    card_id: "CARD-UNIQ-110023",
    timestamp: "2026-08-25T02:18:38Z",
    time_offset_seconds: 218.0,
    amount_usd: 77.40,
    velocity_5min: 1,
    amount_sum_5min: 77.40,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.004,
    combined_risk_score: 0.004,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.8,
  },
  {
    transaction_id: "TXN-STRM-000117",
    card_id: "CARD-ATTACK-7721",
    timestamp: "2026-08-25T02:18:50Z",
    time_offset_seconds: 230.0,
    amount_usd: 950.00,
    velocity_5min: 1,
    amount_sum_5min: 950.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.9998,
    combined_risk_score: 0.9998,
    is_flagged: true,
    decision: "FLAGGED_FOR_REVIEW",
    latency_ms: 4.2,
  },
  {
    transaction_id: "TXN-STRM-000118",
    card_id: "CARD-UNIQ-110024",
    timestamp: "2026-08-25T02:19:05Z",
    time_offset_seconds: 245.0,
    amount_usd: 12.50,
    velocity_5min: 1,
    amount_sum_5min: 12.50,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.002,
    combined_risk_score: 0.002,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.5,
  },
  {
    transaction_id: "TXN-STRM-000119",
    card_id: "CARD-UNIQ-110025",
    timestamp: "2026-08-25T02:19:18Z",
    time_offset_seconds: 258.0,
    amount_usd: 110.00,
    velocity_5min: 1,
    amount_sum_5min: 110.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.006,
    combined_risk_score: 0.006,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.9,
  },
  {
    transaction_id: "TXN-STRM-000120",
    card_id: "CARD-BURST-1002",
    timestamp: "2026-08-25T02:19:30Z",
    time_offset_seconds: 270.0,
    amount_usd: 350.00,
    velocity_5min: 6,
    amount_sum_5min: 460.70,
    velocity_risk_flag: true,
    raw_model_risk_score: 0.884,
    combined_risk_score: 1.000,
    is_flagged: true,
    decision: "FLAGGED_FOR_REVIEW",
    latency_ms: 3.8,
  },
  {
    transaction_id: "TXN-STRM-000121",
    card_id: "CARD-UNIQ-110026",
    timestamp: "2026-08-25T02:19:42Z",
    time_offset_seconds: 282.0,
    amount_usd: 45.00,
    velocity_5min: 1,
    amount_sum_5min: 45.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.003,
    combined_risk_score: 0.003,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.8,
  },
  {
    transaction_id: "TXN-STRM-000122",
    card_id: "CARD-UNIQ-110027",
    timestamp: "2026-08-25T02:19:55Z",
    time_offset_seconds: 295.0,
    amount_usd: 230.00,
    velocity_5min: 1,
    amount_sum_5min: 230.00,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.008,
    combined_risk_score: 0.008,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.7,
  },
  {
    transaction_id: "TXN-STRM-000123",
    card_id: "CARD-BURST-8830",
    timestamp: "2026-08-25T02:20:05Z",
    time_offset_seconds: 305.0,
    amount_usd: 9.99,
    velocity_5min: 1,
    amount_sum_5min: 9.99,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.015,
    combined_risk_score: 0.015,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 2.9,
  },
  {
    transaction_id: "TXN-STRM-000124",
    card_id: "CARD-BURST-8830",
    timestamp: "2026-08-25T02:20:18Z",
    time_offset_seconds: 318.0,
    amount_usd: 19.99,
    velocity_5min: 2,
    amount_sum_5min: 29.98,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.042,
    combined_risk_score: 0.042,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.1,
  },
  {
    transaction_id: "TXN-STRM-000125",
    card_id: "CARD-BURST-8830",
    timestamp: "2026-08-25T02:20:30Z",
    time_offset_seconds: 330.0,
    amount_usd: 49.99,
    velocity_5min: 3,
    amount_sum_5min: 79.97,
    velocity_risk_flag: false,
    raw_model_risk_score: 0.075,
    combined_risk_score: 0.075,
    is_flagged: false,
    decision: "APPROVED",
    latency_ms: 3.0,
  },
];

export default function LiveFeedView() {
  const [events, setEvents] = useState<StreamEvent[]>(PRESET_BURST_EVENTS.slice(0, 10));
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<"all" | "flagged" | "velocity">("all");
  const [wsStatus, setWsStatus] = useState<"connected" | "disconnected" | "simulated">("simulated");
  const wsRef = useRef<WebSocket | null>(null);
  const burstIntervalRef = useRef<any>(null);
  const burstIndexRef = useRef<number>(10);

  // Connect to WebSocket on mount
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getApiWsUrl());

      ws.onopen = () => {
        setWsStatus("connected");
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data.transaction_id && data.combined_risk_score !== undefined) {
            setEvents((prev) => [data, ...prev.slice(0, 49)]);
          }
        } catch (e) {
          // ignore non-json pings
        }
      };

      ws.onerror = () => {
        setWsStatus("simulated");
      };

      ws.onclose = () => {
        setWsStatus("simulated");
      };

      wsRef.current = ws;
    } catch (err) {
      setWsStatus("simulated");
    }

    return () => {
      if (ws) ws.close();
      if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    };
  }, []);

  // Simulate on-demand 25-transaction burst
  const handleSimulateBurst = () => {
    if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    setIsStreaming(true);
    burstIndexRef.current = 0;

    burstIntervalRef.current = setInterval(() => {
      if (burstIndexRef.current < PRESET_BURST_EVENTS.length) {
        const nextEv = PRESET_BURST_EVENTS[burstIndexRef.current];
        setEvents((prev) => [nextEv, ...prev.slice(0, 49)]);
        burstIndexRef.current += 1;
      } else {
        clearInterval(burstIntervalRef.current);
        setIsStreaming(false);
      }
    }, 180); // 180ms intervals between simulated stream events
  };

  // Toggle Stream
  const toggleStreaming = () => {
    if (isStreaming) {
      if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
      setIsStreaming(false);
    } else {
      handleSimulateBurst();
    }
  };

  // Clear Feed
  const handleClearFeed = () => {
    if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    setIsStreaming(false);
    setEvents([]);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterMode === "flagged") {
      return events.filter((e) => e.is_flagged || e.decision === "FLAGGED_FOR_REVIEW");
    }
    if (filterMode === "velocity") {
      return events.filter((e) => e.velocity_risk_flag || e.velocity_5min > 3);
    }
    return events;
  }, [events, filterMode]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const total = events.length;
    const flagged = events.filter((e) => e.is_flagged || e.decision === "FLAGGED_FOR_REVIEW").length;
    const velocityAlerts = events.filter((e) => e.velocity_risk_flag || e.velocity_5min > 3).length;
    const avgLatency =
      total > 0 ? (events.reduce((acc, cur) => acc + (cur.latency_ms || 3.0), 0) / total).toFixed(1) : "0.0";

    return { total, flagged, velocityAlerts, avgLatency };
  }, [events]);

  return (
    <div className="space-y-6">
      {/* Streaming Control Deck & Live Telemetry KPIs */}
      <div className="clay-card rounded-3xl border border-white/10 bg-[#070709] p-5 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-[#141014] border border-[#F2B8C6]/30 text-[#F2B8C6]">
              <Radio className={`w-5 h-5 ${isStreaming ? "animate-pulse" : ""}`} />
              {isStreaming && (
                <span className="absolute inset-0 rounded-2xl bg-[#F2B8C6]/20 animate-ping opacity-30"></span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-lg text-[#F7F6F3]">
                  Real-Time WebSocket Stream Feed
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    wsStatus === "connected"
                      ? "bg-[#A8B5E0]/15 text-[#A8B5E0] border border-[#A8B5E0]/30"
                      : "bg-[#F2B8C6]/15 text-[#F2B8C6] border border-[#F2B8C6]/30"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      wsStatus === "connected" ? "bg-[#A8B5E0] animate-pulse" : "bg-[#F2B8C6]"
                    }`}
                  ></span>
                  {wsStatus === "connected" ? "WS: LIVE STREAM" : "LOCAL REPLAY MODE"}
                </span>
              </div>
              <p className="text-xs font-mono text-[#8E8E98]">
                In-memory 5-minute sliding window per card_id · Rolling velocity & XGBoost ensemble
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSimulateBurst}
              className="clay-badge-rose px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulate 25-Tx Burst</span>
            </button>

            <button
              onClick={toggleStreaming}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                isStreaming
                  ? "bg-[#F2B8C6]/20 border-[#F2B8C6] text-[#F2B8C6]"
                  : "bg-white/5 border-white/15 text-[#F7F6F3] hover:bg-white/10"
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play Stream</span>
                </>
              )}
            </button>

            <button
              onClick={handleClearFeed}
              title="Clear Feed"
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#8E8E98] hover:text-[#F7F6F3] hover:border-white/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Stream KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-[#050505] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-[#8E8E98] flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#8E8E98]" /> Stream Events
            </span>
            <div className="text-xl font-heading font-black text-[#F7F6F3]">
              {stats.total}
            </div>
            <span className="text-[9px] font-mono text-[#8E8E98]">In Memory Buffer</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#141014] border border-[#F2B8C6]/30 space-y-1 shadow-[0_0_15px_rgba(242,184,198,0.08)]">
            <span className="text-[10px] font-mono text-[#F2B8C6] flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3 text-[#F2B8C6]" /> Flagged for Review
            </span>
            <div className="text-xl font-heading font-black text-[#F2B8C6]">
              {stats.flagged}
            </div>
            <span className="text-[9px] font-mono text-[#F2B8C6]/70">
              {stats.total > 0 ? ((stats.flagged / stats.total) * 100).toFixed(1) : 0}% Rate
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#0F111A] border border-[#A8B5E0]/30 space-y-1 shadow-[0_0_15px_rgba(168,181,224,0.08)]">
            <span className="text-[10px] font-mono text-[#A8B5E0] flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-[#A8B5E0]" /> Velocity Bursts (&gt;3)
            </span>
            <div className="text-xl font-heading font-black text-[#A8B5E0]">
              {stats.velocityAlerts}
            </div>
            <span className="text-[9px] font-mono text-[#A8B5E0]/70">
              Ensemble Boost Applied
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#050505] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono text-[#8E8E98] flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[#8E8E98]" /> Avg Score Latency
            </span>
            <div className="text-xl font-heading font-black text-[#F7F6F3]">
              {stats.avgLatency}ms
            </div>
            <span className="text-[9px] font-mono text-[#8E8E98]">Sub-10ms Inference</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#8E8E98] flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter Feed:
          </span>
          <div className="flex items-center gap-1 bg-[#0A0A0D] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                filterMode === "all"
                  ? "bg-white/15 text-[#F7F6F3]"
                  : "text-[#8E8E98] hover:text-[#F7F6F3]"
              }`}
            >
              All ({events.length})
            </button>
            <button
              onClick={() => setFilterMode("flagged")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                filterMode === "flagged"
                  ? "bg-[#F2B8C6]/20 text-[#F2B8C6]"
                  : "text-[#8E8E98] hover:text-[#F2B8C6]"
              }`}
            >
              Flagged ({stats.flagged})
            </button>
            <button
              onClick={() => setFilterMode("velocity")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-colors ${
                filterMode === "velocity"
                  ? "bg-[#A8B5E0]/20 text-[#A8B5E0]"
                  : "text-[#8E8E98] hover:text-[#A8B5E0]"
              }`}
            >
              Velocity Alerts ({stats.velocityAlerts})
            </button>
          </div>
        </div>

        <span className="text-[11px] font-mono text-[#8E8E98] hidden sm:inline-block">
          Showing {filteredEvents.length} events
        </span>
      </div>

      {/* Live Stream Table Feed */}
      <div className="clay-card rounded-3xl border border-white/10 bg-[#070709] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#0A0A0E] text-[10px] text-[#8E8E98] uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Cardholder ID</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">5-Min Velocity</th>
                <th className="py-3 px-4">XGBoost Score</th>
                <th className="py-3 px-4">Combined Risk</th>
                <th className="py-3 px-4 text-right">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence initial={false}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((ev) => {
                    const isFlagged = ev.is_flagged || ev.decision === "FLAGGED_FOR_REVIEW";
                    return (
                      <motion.tr
                        key={ev.transaction_id}
                        initial={{ opacity: 0, y: -12, backgroundColor: "rgba(242, 184, 198, 0.15)" }}
                        animate={{ opacity: 1, y: 0, backgroundColor: "rgba(0, 0, 0, 0)" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className={`hover:bg-white/[0.02] transition-colors ${
                          ev.velocity_risk_flag ? "bg-[#A8B5E0]/[0.03]" : ""
                        }`}
                      >
                        {/* Transaction ID with Signature Impact Ripple */}
                        <td className="py-3 px-4 relative">
                          {/* Brief Pastel Impact Ripple Animation */}
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                            <motion.span
                              initial={{ scale: 0.2, opacity: 0.9 }}
                              animate={{ scale: 3.2, opacity: 0 }}
                              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                              className={`absolute w-3.5 h-3.5 rounded-full border ${
                                isFlagged
                                  ? "border-[#F2B8C6] bg-[#F2B8C6]/20"
                                  : "border-[#A8B5E0] bg-[#A8B5E0]/20"
                              }`}
                            />
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isFlagged ? "bg-[#F2B8C6]" : "bg-[#A8B5E0]"
                              }`}
                            />
                          </div>

                          <div className="pl-4">
                            <div className="font-bold text-[#F7F6F3]">{ev.transaction_id}</div>
                            <div className="text-[10px] text-[#8E8E98] flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {ev.time_offset_seconds ? `t+${ev.time_offset_seconds.toFixed(0)}s` : "live"}
                            </div>
                          </div>
                        </td>

                        {/* Cardholder ID */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              ev.card_id.includes("BURST") || ev.card_id.includes("ATTACK")
                                ? "bg-[#F2B8C6]/10 border-[#F2B8C6]/30 text-[#F2B8C6]"
                                : "bg-white/5 border-white/10 text-[#8E8E98]"
                            }`}
                          >
                            {ev.card_id}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 font-bold text-[#F7F6F3]">
                          ${ev.amount_usd ? ev.amount_usd.toFixed(2) : "0.00"}
                        </td>

                        {/* 5-Min Rolling Velocity */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                ev.velocity_risk_flag
                                  ? "bg-[#A8B5E0]/20 text-[#A8B5E0] border border-[#A8B5E0]/40 animate-pulse"
                                  : "bg-white/5 text-[#8E8E98]"
                              }`}
                            >
                              ⚡ {ev.velocity_5min} tx / 5m
                            </span>
                            {ev.velocity_risk_flag && (
                              <span className="text-[9px] text-[#A8B5E0] font-bold">
                                (Burst Alert)
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-[#8E8E98] block mt-0.5">
                            Vol: ${ev.amount_sum_5min ? ev.amount_sum_5min.toFixed(2) : "0.00"}
                          </span>
                        </td>

                        {/* Isolated XGBoost Score */}
                        <td className="py-3 px-4 text-[#8E8E98]">
                          {(ev.raw_model_risk_score * 100).toFixed(1)}%
                        </td>

                        {/* Combined Risk Score */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isFlagged ? "bg-[#F2B8C6]" : "bg-[#A8B5E0]"
                                }`}
                                style={{ width: `${Math.min(100, ev.combined_risk_score * 100)}%` }}
                              />
                            </div>
                            <span
                              className={`font-bold ${
                                isFlagged ? "text-[#F2B8C6]" : "text-[#A8B5E0]"
                              }`}
                            >
                              {(ev.combined_risk_score * 100).toFixed(1)}%
                            </span>
                          </div>
                          {ev.velocity_risk_flag && (
                            <span className="text-[9px] text-[#A8B5E0] font-mono block mt-0.5">
                              +15% velocity boost
                            </span>
                          )}
                        </td>

                        {/* Decision Badge */}
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              isFlagged
                                ? "bg-[#F2B8C6]/15 text-[#F2B8C6] border border-[#F2B8C6]/30"
                                : "bg-[#A8B5E0]/15 text-[#A8B5E0] border border-[#A8B5E0]/30"
                            }`}
                          >
                            {isFlagged ? (
                              <>
                                <ShieldAlert className="w-3 h-3" />
                                FLAGGED
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3 h-3" />
                                APPROVED
                              </>
                            )}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs font-mono text-[#8E8E98]">
                      No streaming events in buffer. Click &quot;Simulate 25-Tx Burst&quot; or start Kafka stream.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
