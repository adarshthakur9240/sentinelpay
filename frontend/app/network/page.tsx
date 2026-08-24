"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Network,
  Cpu,
  Globe,
  Users,
  AlertTriangle,
  Layers,
  ChevronRight,
  Info,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Search,
} from "lucide-react";
import Navbar from "@/app/components/Navbar";

// Dynamically import ForceGraph2D to prevent SSR canvas issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[560px] text-[#8E8E98] font-mono text-xs gap-3">
      <RefreshCw className="w-6 h-6 animate-spin text-[#F2B8C6]" />
      <span>Loading interactive entity graph canvas...</span>
    </div>
  ),
});

// Fallback Graph Data if API is unreachable
const FALLBACK_RINGS = [
  {
    ring_id: "RING-001",
    name: "Device Farm Syndicate",
    cluster_size: 5,
    fraud_count: 4,
    flagged_count: 4,
    linkage_mechanisms: ["shared_device", "shared_ip"],
    average_ring_risk: 0.8101,
    members: [
      { account_id: "ACC-100809", device_id: "DEV-FARM-9901", ip_subnet: "198.51.100.0/24", xgb_score: 1.0, is_xgb_flagged: true, ring_risk_score: 0.945, true_class: 1 },
      { account_id: "ACC-100805", device_id: "DEV-FARM-9901", ip_subnet: "198.51.100.0/24", xgb_score: 1.0, is_xgb_flagged: true, ring_risk_score: 0.945, true_class: 1 },
      { account_id: "ACC-100404", device_id: "DEV-FARM-9901", ip_subnet: "198.51.100.0/24", xgb_score: 0.9998, is_xgb_flagged: true, ring_risk_score: 0.945, true_class: 1 },
      { account_id: "ACC-101210", device_id: "DEV-FARM-9901", ip_subnet: "198.51.100.0/24", xgb_score: 0.5411, is_xgb_flagged: true, ring_risk_score: 0.733, true_class: 1 },
      { account_id: "ACC-100000", device_id: "DEV-FARM-9901", ip_subnet: "198.51.100.0/24", xgb_score: 0.0, is_xgb_flagged: false, ring_risk_score: 0.483, true_class: 0 },
    ],
  },
  {
    ring_id: "RING-002",
    name: "Distributed Proxy Cluster",
    cluster_size: 4,
    fraud_count: 3,
    flagged_count: 2,
    linkage_mechanisms: ["shared_device", "shared_ip"],
    average_ring_risk: 0.646,
    members: [
      { account_id: "ACC-101866", device_id: "DEV-PROXY-4412", ip_subnet: "203.0.113.0/24", xgb_score: 0.9994, is_xgb_flagged: true, ring_risk_score: 0.854, true_class: 1 },
      { account_id: "ACC-103751", device_id: "DEV-PROXY-4413", ip_subnet: "203.0.113.0/24", xgb_score: 0.8848, is_xgb_flagged: true, ring_risk_score: 0.842, true_class: 1 },
      { account_id: "ACC-103115", device_id: "DEV-PROXY-4412", ip_subnet: "203.0.113.0/24", xgb_score: 0.0, is_xgb_flagged: false, ring_risk_score: 0.444, true_class: 1 },
      { account_id: "ACC-100001", device_id: "DEV-PROXY-4413", ip_subnet: "203.0.113.0/24", xgb_score: 0.0, is_xgb_flagged: false, ring_risk_score: 0.444, true_class: 0 },
    ],
  },
  {
    ring_id: "RING-003",
    name: "Multi-Account Emulator Ring",
    cluster_size: 5,
    fraud_count: 3,
    flagged_count: 3,
    linkage_mechanisms: ["shared_device", "shared_ip"],
    average_ring_risk: 0.735,
    members: [
      { account_id: "ACC-106114", device_id: "DEV-EMULATOR-8830", ip_subnet: "198.18.0.0/24", xgb_score: 1.0, is_xgb_flagged: true, ring_risk_score: 0.923, true_class: 1 },
      { account_id: "ACC-106936", device_id: "DEV-EMULATOR-8830", ip_subnet: "198.18.0.0/24", xgb_score: 0.9998, is_xgb_flagged: true, ring_risk_score: 0.923, true_class: 1 },
      { account_id: "ACC-107416", device_id: "DEV-EMULATOR-8830", ip_subnet: "198.18.0.0/24", xgb_score: 0.958, is_xgb_flagged: true, ring_risk_score: 0.904, true_class: 1 },
      { account_id: "ACC-100003", device_id: "DEV-EMULATOR-8830", ip_subnet: "198.18.0.0/24", xgb_score: 0.0, is_xgb_flagged: false, ring_risk_score: 0.461, true_class: 0 },
      { account_id: "ACC-100002", device_id: "DEV-EMULATOR-8830", ip_subnet: "198.18.0.0/24", xgb_score: 0.0, is_xgb_flagged: false, ring_risk_score: 0.461, true_class: 0 },
    ],
  },
  {
    ring_id: "RING-004",
    name: "Automated Botnet Syndicate",
    cluster_size: 4,
    fraud_count: 4,
    flagged_count: 4,
    linkage_mechanisms: ["shared_device", "shared_ip"],
    average_ring_risk: 1.0,
    members: [
      { account_id: "ACC-105904", device_id: "DEV-BOTNET-7721", ip_subnet: "192.0.2.0/24", xgb_score: 1.0, is_xgb_flagged: true, ring_risk_score: 1.0, true_class: 1 },
      { account_id: "ACC-105078", device_id: "DEV-BOTNET-7721", ip_subnet: "192.0.2.0/24", xgb_score: 1.0, is_xgb_flagged: true, ring_risk_score: 1.0, true_class: 1 },
      { account_id: "ACC-105890", device_id: "DEV-BOTNET-7721", ip_subnet: "192.0.2.0/24", xgb_score: 1.0, is_xgb_flagged: true, ring_risk_score: 1.0, true_class: 1 },
      { account_id: "ACC-105649", device_id: "DEV-BOTNET-7721", ip_subnet: "192.0.2.0/24", xgb_score: 0.9997, is_xgb_flagged: true, ring_risk_score: 1.0, true_class: 1 },
    ],
  },
];

interface NodeObject {
  id: string;
  label: string;
  role: string;
  xgb_score: number;
  ring_risk: number;
  device_id: string;
  ip_subnet: string;
  is_flagged: boolean;
  true_class: number;
  ring_id?: string;
  color: string;
  val: number;
  x?: number;
  y?: number;
}

interface LinkObject {
  source: string | NodeObject;
  target: string | NodeObject;
  link_type: string;
  color: string;
  width: number;
}

export default function RingNetworkPage() {
  const fgRef = useRef<any>(null);
  const [rings, setRings] = useState<any[]>(FALLBACK_RINGS);
  const [graphData, setGraphData] = useState<{ nodes: NodeObject[]; links: LinkObject[] }>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<NodeObject | null>(null);
  const [activeRingId, setActiveRingId] = useState<string>("RING-001");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch live network and rings from FastAPI
  useEffect(() => {
    async function fetchGraphData() {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
        const [ringsRes, netRes] = await Promise.all([
          fetch(`${baseUrl}/graph/rings`).catch(() => null),
          fetch(`${baseUrl}/graph/network`).catch(() => null),
        ]);

        if (ringsRes && ringsRes.ok) {
          const rData = await ringsRes.json();
          if (rData.rings && rData.rings.length > 0) {
            setRings(rData.rings);
          }
        }

        if (netRes && netRes.ok) {
          const nData = await netRes.json();
          if (nData.nodes && nData.nodes.length > 0) {
            setGraphData({ nodes: nData.nodes, links: nData.links });
            // Select first node by default
            setSelectedNode(nData.nodes[0]);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Backend graph endpoints offline, using verified fallback data:", err);
      }

      // Fallback builder
      const nodes: NodeObject[] = [];
      const links: LinkObject[] = [];

      FALLBACK_RINGS.forEach((r) => {
        r.members.forEach((m) => {
          const isFlagged = m.xgb_score >= 0.10 || m.true_class === 1;
          nodes.push({
            id: m.account_id,
            label: m.account_id,
            role: isFlagged ? "Flagged Fraud Attack" : "Graph-Elevated Accomplice",
            xgb_score: m.xgb_score,
            ring_risk: m.ring_risk_score,
            device_id: m.device_id,
            ip_subnet: m.ip_subnet,
            is_flagged: isFlagged,
            true_class: m.true_class,
            ring_id: r.ring_id,
            color: isFlagged ? "#F2B8C6" : "#A8B5E0",
            val: isFlagged ? 14 : 10,
          });
        });

        // Add intra-ring links
        for (let i = 0; i < r.members.length; i++) {
          for (let j = i + 1; j < r.members.length; j++) {
            const u = r.members[i];
            const v = r.members[j];
            const isSharedDevice = u.device_id === v.device_id;
            links.push({
              source: u.account_id,
              target: v.account_id,
              link_type: isSharedDevice ? "Shared Device & IP" : "Shared IP Subnet",
              color: isSharedDevice ? "#F2B8C6" : "#A8B5E0",
              width: isSharedDevice ? 2.5 : 1.8,
            });
          }
        }
      });

      setGraphData({ nodes, links });
      if (nodes.length > 0) setSelectedNode(nodes[0]);
      setIsLoading(false);
    }

    fetchGraphData();
  }, []);

  // Filtered nodes based on search
  const filteredNodes = useMemo(() => {
    if (!filterQuery) return graphData.nodes;
    const q = filterQuery.toLowerCase();
    return graphData.nodes.filter(
      (n) =>
        n.id.toLowerCase().includes(q) ||
        n.device_id.toLowerCase().includes(q) ||
        n.ip_subnet.toLowerCase().includes(q) ||
        (n.ring_id && n.ring_id.toLowerCase().includes(q))
    );
  }, [graphData.nodes, filterQuery]);

  // Focus on specific ring
  const handleSelectRing = (ringId: string) => {
    setActiveRingId(ringId);
    const ringMembers = graphData.nodes.filter((n) => n.ring_id === ringId);
    if (ringMembers.length > 0) {
      setSelectedNode(ringMembers[0]);
      if (fgRef.current && ringMembers[0].x !== undefined && ringMembers[0].y !== undefined) {
        fgRef.current.centerAt(ringMembers[0].x, ringMembers[0].y, 600);
        fgRef.current.zoom(3.2, 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F7F6F3] selection:bg-[#F2B8C6]/20 selection:text-[#F2B8C6]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20 space-y-6">
        {/* Header Section */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="clay-badge-rose px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider">
                  Network Intelligence
                </span>
                <span className="text-[11px] font-mono text-[#8E8E98]">
                  Personalized PageRank & Entity Linkage
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight text-[#F7F6F3]">
                Coordinated Fraud Ring Network
              </h1>
            </div>

            {/* Live Stats Capsule */}
            <div className="flex items-center gap-2 bg-[#0A0A0D] border border-white/10 rounded-2xl px-3.5 py-2">
              <div className="flex items-center gap-2 pr-3 border-r border-white/10">
                <Users className="w-4 h-4 text-[#F2B8C6]" />
                <span className="text-xs font-mono font-bold text-[#F7F6F3]">
                  {rings.length} Rings Detected
                </span>
              </div>
              <div className="flex items-center gap-2 pl-1">
                <Network className="w-4 h-4 text-[#A8B5E0]" />
                <span className="text-xs font-mono text-[#8E8E98]">
                  {graphData.nodes.length} Linked Nodes
                </span>
              </div>
            </div>
          </div>

          {/* Prominent & Explicit Simulation Disclaimer (MANDATORY REQUIREMENT) */}
          <div className="clay-card rounded-2xl p-3.5 sm:p-4 border border-[#A8B5E0]/30 bg-[#0E0E14] flex items-start gap-3 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
            <div className="p-1.5 rounded-xl bg-[#A8B5E0]/15 text-[#A8B5E0] shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs text-[#8E8E98]">
              <p className="font-bold text-[#F7F6F3] tracking-tight">
                Engineering Honesty & Dataset Authenticity Notice:
              </p>
              <p className="leading-relaxed">
                Account and device linkage is <strong className="text-[#A8B5E0]">simulated for this demonstration</strong>. The underlying Kaggle ULB dataset is strictly anonymized PCA components (V1–V28) and contains no real account or IP telemetry. This interface showcases how SentinelPay’s tree classifier seamlessly couples with network graph propagation when hardware fingerprints and IP subnets are available in production payment gateways.
              </p>
            </div>
          </div>
        </header>

        {/* Ring Quick Selector Pills */}
        <section aria-label="Detected Fraud Rings" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {rings.map((ring) => {
            const isSelected = activeRingId === ring.ring_id;
            return (
              <button
                key={ring.ring_id}
                onClick={() => handleSelectRing(ring.ring_id)}
                className={`clay-card text-left p-3 rounded-2xl border transition-all duration-200 ${
                  isSelected
                    ? "border-[#F2B8C6] bg-[#141014] shadow-[0_8px_24px_rgba(242,184,198,0.15)]"
                    : "border-white/10 bg-[#0A0A0D] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-[#F2B8C6]">
                    {ring.ring_id}
                  </span>
                  <span className="text-[10px] font-mono text-[#8E8E98]">
                    {ring.cluster_size} Accounts
                  </span>
                </div>
                <div className="text-xs font-semibold text-[#F7F6F3] truncate">
                  {ring.name || ring.ring_id}
                </div>
                <div className="mt-1 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#8E8E98]">Avg Ring Risk:</span>
                  <span className="font-bold text-[#F2B8C6]">
                    {(ring.average_ring_risk * 100).toFixed(1)}%
                  </span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Main Graph Canvas & Account Detail Inspector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Graph Canvas Container (8 Cols) */}
          <div className="lg:col-span-8 clay-card rounded-3xl border border-white/10 bg-[#070709] p-4 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#F7F6F3] flex items-center gap-2">
                  <Network className="w-4 h-4 text-[#F2B8C6]" />
                  Entity Graph Canvas
                </span>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8E8E98]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#F2B8C6]"></span> Flagged Fraud
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#A8B5E0]"></span> Graph-Elevated Accomplice
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (fgRef.current) {
                    fgRef.current.zoomToFit(400, 30);
                  }
                }}
                className="text-[10px] font-mono text-[#8E8E98] hover:text-[#F7F6F3] px-2 py-1 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                Reset View
              </button>
            </div>

            {/* Interactive 2D Force Graph Canvas */}
            <div className="h-[520px] rounded-2xl bg-[#050505] border border-white/5 relative overflow-hidden">
              <ForceGraph2D
                ref={fgRef}
                graphData={graphData}
                nodeId="id"
                nodeLabel={(n: any) => `${n.id} (${n.role}) - Ring Risk: ${(n.ring_risk * 100).toFixed(1)}%`}
                nodeColor={(n: any) => n.color}
                nodeRelSize={6}
                linkColor={(l: any) => l.color || "#A8B5E0"}
                linkWidth={(l: any) => l.width || 1.5}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={0.005}
                linkDirectionalParticleWidth={1.5}
                linkDirectionalParticleColor={(l: any) => l.color || "#F2B8C6"}
                backgroundColor="#050505"
                onNodeClick={(node: any) => {
                  setSelectedNode(node);
                  if (fgRef.current && node.x !== undefined && node.y !== undefined) {
                    fgRef.current.centerAt(node.x, node.y, 400);
                  }
                }}
                nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
                  const label = node.id;
                  const fontSize = 11 / globalScale;
                  ctx.font = `${fontSize}px JetBrains Mono, monospace`;
                  
                  // Outer subtle pulse ring for flagged nodes
                  if (node.is_flagged || node.true_class === 1) {
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.val + 2, 0, 2 * Math.PI, false);
                    ctx.fillStyle = "rgba(242, 184, 198, 0.15)";
                    ctx.fill();
                  }

                  // Node Circle
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
                  ctx.fillStyle = node.color || "#F2B8C6";
                  ctx.fill();
                  ctx.lineWidth = 1.5 / globalScale;
                  ctx.strokeStyle = node.id === selectedNode?.id ? "#FFFFFF" : "rgba(255, 255, 255, 0.4)";
                  ctx.stroke();

                  // Text Label
                  ctx.textAlign = "center";
                  ctx.textBaseline = "middle";
                  ctx.fillStyle = node.id === selectedNode?.id ? "#FFFFFF" : "#8E8E98";
                  ctx.fillText(label, node.x, node.y + node.val + fontSize + 2);
                }}
              />
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#8E8E98] flex items-center justify-between px-1">
              <span>Scroll to zoom · Drag to pan · Click node to inspect risk propagation</span>
              <span>Force Layout: Barnes-Hut</span>
            </div>
          </div>

          {/* Account Detail & Propagated Risk Inspector (4 Cols) */}
          <aside aria-label="Account Risk Inspector" className="lg:col-span-4 space-y-4">
            <div className="clay-card rounded-3xl border border-white/10 bg-[#0A0A0D] p-5 space-y-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase text-[#8E8E98]">
                    Account Telemetry
                  </span>
                  <h3 className="font-heading font-black text-lg text-[#F7F6F3] flex items-center gap-2">
                    {selectedNode?.id || "Select Node"}
                  </h3>
                </div>
                {selectedNode && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      selectedNode.is_flagged || selectedNode.true_class === 1
                        ? "bg-[#F2B8C6]/15 text-[#F2B8C6] border border-[#F2B8C6]/30"
                        : "bg-[#A8B5E0]/15 text-[#A8B5E0] border border-[#A8B5E0]/30"
                    }`}
                  >
                    {selectedNode.role}
                  </span>
                )}
              </div>

              {selectedNode ? (
                <div className="space-y-4">
                  {/* Risk Metric Comparison: Isolated XGBoost vs Graph Propagated */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-[#050505] border border-white/10 space-y-1">
                      <span className="text-[10px] font-mono text-[#8E8E98]">
                        Isolated Tree Score
                      </span>
                      <div className="text-xl font-heading font-black text-[#F7F6F3]">
                        {(selectedNode.xgb_score * 100).toFixed(1)}%
                      </div>
                      <span className="text-[9px] font-mono text-[#8E8E98] block">
                        XGBoost ($t=0.10$)
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#141014] border border-[#F2B8C6]/40 space-y-1 shadow-[0_0_20px_rgba(242,184,198,0.1)]">
                      <span className="text-[10px] font-mono text-[#F2B8C6]">
                        Propagated Ring Risk
                      </span>
                      <div className="text-xl font-heading font-black text-[#F2B8C6]">
                        {(selectedNode.ring_risk * 100).toFixed(1)}%
                      </div>
                      <span className="text-[9px] font-mono text-[#F2B8C6]/80 block">
                        Network Blended
                      </span>
                    </div>
                  </div>

                  {/* Core Insight Callout for Accomplice Elevation */}
                  {selectedNode.xgb_score < 0.10 && selectedNode.ring_risk >= 0.25 && (
                    <div className="p-3 rounded-2xl bg-[#A8B5E0]/10 border border-[#A8B5E0]/30 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#A8B5E0]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Graph Risk Elevation Insight</span>
                      </div>
                      <p className="text-[11px] text-[#8E8E98] leading-relaxed">
                        This account scored <strong className="text-[#F7F6F3]">{(selectedNode.xgb_score * 100).toFixed(2)}%</strong> on isolated transaction features (would have been approved), but is closely tied to confirmed fraud attacks sharing the same device. Network propagation elevated its risk to <strong className="text-[#F2B8C6]">{(selectedNode.ring_risk * 100).toFixed(1)}%</strong>.
                      </p>
                    </div>
                  )}

                  {/* Entity Metadata Specs */}
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[#8E8E98] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#F2B8C6]" /> Device ID
                      </span>
                      <span className="text-[#F7F6F3] font-bold">{selectedNode.device_id}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[#8E8E98] flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#A8B5E0]" /> IP Subnet
                      </span>
                      <span className="text-[#F7F6F3] font-bold">{selectedNode.ip_subnet}</span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-[#8E8E98] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#8E8E98]" /> Associated Ring
                      </span>
                      <span className="text-[#F2B8C6] font-bold">
                        {selectedNode.ring_id || "Unassociated"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-xs font-mono text-[#8E8E98]">
                  Click on any node in the graph to inspect entity linkage and risk propagation.
                </div>
              )}
            </div>

            {/* Methodology Pill Card */}
            <div className="clay-card rounded-2xl p-4 border border-white/10 bg-[#070709] space-y-2 text-xs text-[#8E8E98]">
              <div className="font-bold text-[#F7F6F3] flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#F2B8C6]" />
                <span>PageRank Risk Diffusion Formula</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Risk score is computed via Personalized PageRank with teleportation vector proportional to isolated XGBoost fraud probability, blended with local neighborhood contamination:
              </p>
              <div className="p-2 rounded-xl bg-black border border-white/10 font-mono text-[10px] text-[#F2B8C6]">
                Risk = 0.50 · P_XGB + 0.50 · (0.7 · Max_Nbr + 0.3 · Avg_Nbr)
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
