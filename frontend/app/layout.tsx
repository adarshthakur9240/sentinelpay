import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import LenisProvider from "./providers/LenisProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  weight: ["700", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SentinelPay | Real-Time Fraud Intelligence Engine",
  description:
    "Cost-sensitive XGBoost fraud detection, live threshold optimizer, and SHAP chargeback auto-responder evidence engine. Razorpay Buildathon Track 02.",
  openGraph: {
    title: "SentinelPay — Fraud Detection That Survives Class Imbalance",
    description:
      "PR-AUC 0.8424, 85.14% recall, 98.22% FP reduction. Built on XGBoost + SHAP for Razorpay Buildathon 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#0A0A0F] text-[#F5F1E8] flex flex-col font-sans selection:bg-[#C9A24D]/30 selection:text-[#E6C875]">
        <LenisProvider>
          {/* Navbar sits on top with backdrop-blur */}
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#1F1F2E] bg-[#0A0A0F]/80 backdrop-blur-md py-5 text-center text-xs text-[#8A8A9E] font-mono relative z-20">
            <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[#9E9EB0]">
                SentinelPay Engine · XGBoost <code className="text-[#C9A24D]">scale_pos_weight=578.55</code> · SHAP TreeExplainer
              </span>
              <span className="text-[#C9A24D]">
                Held-Out PR-AUC 0.8424 · Operating Threshold: 0.10 · Razorpay Buildathon 2026
              </span>
            </div>
          </footer>
        </LenisProvider>
      </body>
    </html>
  );
}
