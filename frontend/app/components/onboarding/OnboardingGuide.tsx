"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ShieldMascot from "./ShieldMascot";
import {
  HelpCircle,
  X,
  ChevronRight,
  ArrowDown,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface StepConfig {
  id: number;
  route: string;
  title: string;
  message: string;
  pointerDirection?: "down" | "right" | "up";
  mood: "happy" | "analyzing" | "pointing";
  ctaText?: string;
  targetRoute?: string;
}

const ONBOARDING_STEPS: StepConfig[] = [
  {
    id: 1,
    route: "/",
    title: "Welcome to SentinelPay",
    message: "This is SentinelPay — scroll down to see how it works ↓",
    pointerDirection: "down",
    mood: "happy",
    ctaText: "Next Step",
  },
  {
    id: 2,
    route: "/",
    title: "Real-Time Risk Console",
    message: "Ready to see it in action? Click here to open the Risk Console →",
    pointerDirection: "right",
    mood: "pointing",
    ctaText: "Open Risk Console →",
    targetRoute: "/console",
  },
  {
    id: 3,
    route: "/console",
    title: "Execute Live Scoring",
    message: "Pick a transaction below, then hit 'Score Selected Transaction' to see a real fraud score",
    pointerDirection: "down",
    mood: "analyzing",
    ctaText: "Next: Threshold Sweep",
  },
  {
    id: 4,
    route: "/console",
    title: "Optimize Operating Cutoff",
    message: "Try dragging this slider — watch how catching more fraud trades off against false alarms",
    pointerDirection: "up",
    mood: "pointing",
    ctaText: "Next: Evidence Dossier",
    targetRoute: "/evidence",
  },
  {
    id: 5,
    route: "/evidence",
    title: "SHAP Dispute Dossier",
    message: "Curious why a transaction was flagged? Check the Evidence Dossier to see exact game-theoretic attributions →",
    pointerDirection: "right",
    mood: "happy",
    ctaText: "Finish Tour",
  },
];

export default function OnboardingGuide() {
  const pathname = usePathname();
  const router = useRouter();

  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [hasCheckedStorage, setHasCheckedStorage] = useState<boolean>(false);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const onboarded = localStorage.getItem("sentinelpay_onboarded");
      if (!onboarded) {
        // Show after a gentle 1.2s delay on initial visit
        const timer = setTimeout(() => {
          setIsVisible(true);
          setCurrentStepIndex(0);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setHasCheckedStorage(true);
    }
  }, []);

  // Synchronize step index with current pathname if the user navigates directly
  useEffect(() => {
    if (!isVisible) return;
    const currentStep = ONBOARDING_STEPS[currentStepIndex];
    if (currentStep && currentStep.route !== pathname) {
      const matchingStepIndex = ONBOARDING_STEPS.findIndex((s) => s.route === pathname);
      if (matchingStepIndex !== -1) {
        setCurrentStepIndex(matchingStepIndex);
      }
    }
  }, [pathname, isVisible, currentStepIndex]);

  const currentStep = ONBOARDING_STEPS[currentStepIndex] || ONBOARDING_STEPS[0];

  const handleNext = () => {
    if (currentStep.targetRoute && pathname !== currentStep.targetRoute) {
      router.push(currentStep.targetRoute);
      if (currentStepIndex + 1 < ONBOARDING_STEPS.length) {
        setCurrentStepIndex(currentStepIndex + 1);
      } else {
        handleDismiss();
      }
      return;
    }

    if (currentStepIndex + 1 < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[currentStepIndex + 1];
      if (nextStep.route !== pathname) {
        router.push(nextStep.route);
      }
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem("sentinelpay_onboarded", "true");
    } catch {
      // Ignore storage errors
    }
  };

  const handleRestartTour = () => {
    setCurrentStepIndex(0);
    setIsVisible(true);
    if (pathname !== "/") {
      router.push("/");
    }
  };

  if (!hasCheckedStorage) return null;

  return (
    <>
      {/* ── PERSISTENT '?' HELP BUTTON (Always Visible, Bottom Right) ────── */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.94 }}
          onClick={handleRestartTour}
          className="clay-card-interactive flex h-11 w-11 items-center justify-center rounded-2xl text-[#F2B8C6] shadow-xl border border-white/10 cursor-pointer group"
          title="Restart Guided Onboarding Tour"
        >
          <HelpCircle className="h-5 w-5 group-hover:text-[#F7F6F3] transition-colors" />
        </motion.button>
      </div>

      {/* ── FLOATING ONBOARDING OVERLAY WIDGET (Non-Blocking) ─────────────── */}
      <AnimatePresence>
        {isVisible && (
          <div className="fixed bottom-20 right-6 sm:bottom-22 sm:right-8 z-50 pointer-events-none max-w-sm w-[90vw] sm:w-[360px]">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto clay-card p-5 sm:p-6 relative shadow-2xl border border-white/10"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#26262B]/60">
                <div className="flex items-center gap-2.5">
                  <ShieldMascot size={32} mood={currentStep.mood} />
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#F2B8C6] tracking-wider block">
                      Guide · Step {currentStep.id} of {ONBOARDING_STEPS.length}
                    </span>
                    <h4 className="font-heading font-bold text-xs text-[#F7F6F3]">
                      {currentStep.title}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-[#9A9AA4] hover:text-[#F7F6F3] hover:bg-white/5 transition-colors cursor-pointer"
                  title="Close Guide"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Speech Bubble Message Content with Slide/Fade */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }}
                  className="py-3.5"
                >
                  <p className="text-xs text-[#F7F6F3] font-sans leading-relaxed">
                    {currentStep.message}
                  </p>

                  {/* Animated Pointer Indicator */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-[#B5D8C5]">
                    {currentStep.pointerDirection === "down" && (
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center gap-1"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span>Interactive action below</span>
                      </motion.div>
                    )}
                    {currentStep.pointerDirection === "right" && (
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center gap-1"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span>Follow prompt</span>
                      </motion.div>
                    )}
                    {currentStep.pointerDirection === "up" && (
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center gap-1"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Adjust threshold slider above</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#26262B]/60 text-xs">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[#9A9AA4] hover:text-[#F7F6F3] font-mono transition-colors cursor-pointer text-[11px]"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="clay-btn-rose px-4 py-2 font-heading font-bold text-xs flex items-center gap-1.5 cursor-pointer text-[#0A0A0A]"
                  >
                    <span>{currentStep.ctaText || "Next"}</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
