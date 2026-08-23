"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiometricShieldIcon, RadarSweepIcon, TreeAttributionIcon, TelemetrySpikeIcon } from "@/components/icons/CustomIcons";
import { ExternalLink, Terminal } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  const navItems = [
    { name: "Executive Summary", href: "/", icon: TelemetrySpikeIcon },
    { name: "Risk Console", href: "/console", icon: RadarSweepIcon },
    { name: "Evidence Dossier", href: "/evidence", icon: TreeAttributionIcon },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        isHome
          ? "border-[#242436]/40 bg-[#0A0A0F]/60 backdrop-blur-lg"
          : "border-[#242436] bg-[#0A0A0F]/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C9A24D]/10 border border-[#C9A24D]/30 text-[#C9A24D] group-hover:border-[#C9A24D] transition-colors">
              <BiometricShieldIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-base tracking-tight text-[#F5F1E8]">
                  SentinelPay
                </span>
                <span className="rounded-full bg-[#C9A24D]/15 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#E6C875] border border-[#C9A24D]/30">
                  Track 02
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E9E] font-mono">
                Real-Time Fraud Intelligence Engine
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 ml-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#181824] text-[#F5F1E8] shadow-sm border border-[#2B2B40]"
                      : "text-[#8E8E9E] hover:bg-[#14141E] hover:text-[#F5F1E8]"
                  }`}
                >
                  <Icon size={14} className={isActive ? "opacity-100" : "opacity-60"} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#4EAD8A]/30 bg-[#4EAD8A]/10 px-2.5 py-1 text-[11px] font-mono text-[#4EAD8A]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4EAD8A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4EAD8A]"></span>
            </span>
            <span>API Online :8000</span>
          </div>

          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-[#242436] bg-[#12121A] px-2.5 py-1.5 text-xs font-mono text-[#8E8E9E] hover:bg-[#181824] hover:text-[#F5F1E8] transition-colors"
          >
            <Terminal className="h-3.5 w-3.5 text-[#8E8E9E]" />
            <span className="hidden sm:inline">OpenAPI Docs</span>
            <ExternalLink className="h-3 w-3 text-[#5A5A70]" />
          </a>
        </div>
      </div>
    </header>
  );
}
