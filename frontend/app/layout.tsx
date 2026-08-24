import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import LenisProvider from "./providers/LenisProvider";
import OnboardingGuide from "./components/onboarding/OnboardingGuide";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  weight: ["700", "800"],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
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
    "Cost-sensitive XGBoost fraud detection, live threshold optimizer, and SHAP chargeback auto-responder evidence engine.",
  openGraph: {
    title: "SentinelPay — Fraud Detection That Survives Class Imbalance",
    description:
      "PR-AUC 0.8424, 85.14% recall, 98.22% FP reduction. Built with cost-sensitive XGBoost and SHAP explainability.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${poppins.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#050505] text-[#F7F6F3] flex flex-col font-sans selection:bg-[#F2B8C6]/25 selection:text-[#FCE2E9]">
        <LenisProvider>
          {/* Navbar sits on top with backdrop-blur */}
          <Navbar />
          <main className="flex-1">{children}</main>
          {/* First-time visitor onboarding guided walkthrough overlay */}
          <OnboardingGuide />
        </LenisProvider>
      </body>
    </html>
  );
}
