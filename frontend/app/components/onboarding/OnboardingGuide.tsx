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
  ShieldCheck,
} from "lucide-react";

interface StepConfig {
  id: number;
  route: string;
  title: string;
  message: string;
  pointerDirection?: "down" | "right" | "up" | "none";
  mood: "happy" | "analyzing" | "pointing";
  ctaText?: string;
  targetRoute?: string;
}

const ONBOARDING_STEPS: StepConfig[] = [
  {
    id: 1,
    route: "/",
    title: "Dataset & Class Imbalance",
    message:
      "We train on 284,807 real transactions from Kaggle's ULB dataset, where only 492 (0.17%) are fraud. Accuracy is meaningless here (a naive model gets 99.83% by catching zero fraud), so we optimize strictly for Precision-Recall AUC.",
    pointerDirection: "down",
    mood: "happy",
    ctaText: "Next: Baseline",
  },
  {
    id: 2,
    route: "/",
    title: "Disciplined Baseline Benchmark",
    message:
      "Before building complex models, we established a Logistic Regression baseline first. It achieved only 6.73% precision with 901 false positives, proving the necessity of cost-weighted tree ensembles.",
    pointerDirection: "right",
    mood: "pointing",
    ctaText: "Open Risk Console →",
    targetRoute: "/console",
  },
  {
    id: 3,
    route: "/console",
    title: "XGBoost with Tuned Class Weighting",
    message:
      "Our XGBoost model sets scale_pos_weight directly to the real class ratio (578.55), reaching 79.75% precision and 85.14% recall — delivering a 98% reduction in false positives compared to the baseline.",
    pointerDirection: "down",
    mood: "analyzing",
    ctaText: "Next: Cost Reasoning",
  },
  {
    id: 4,
    route: "/console",
    title: "Parametric Cost Optimization",
    message:
      "We deploy at threshold 0.10 specifically because it minimizes total financial cost ($1,424.31 on the test set) under asymmetric business costs ($5 user friction vs $122.21 fraud loss), not as an arbitrary default.",
    pointerDirection: "up",
    mood: "pointing",
    ctaText: "Open Evidence Dossier →",
    targetRoute: "/evidence",
  },
  {
    id: 5,
    route: "/evidence",
    title: "Exact SHAP Mathematical Honesty",
    message:
      "Our dossier computes exact Shapley values via shap.TreeExplainer. We deliberately avoid inventing fake business meanings for anonymized PCA components (V1–V28), reporting pure statistical attribution with complete transparency.",
    pointerDirection: "right",
    mood: "analyzing",
    ctaText: "Next: Defense Scope",
  },
  {
    id: 6,
    route: "/evidence",
    title: "Strictly Defense-Only Scope",
    message:
      "SentinelPay is engineered exclusively as a defensive intelligence layer — scoring risk and generating audit evidence with zero autonomous account or transaction actions, strictly fulfilling track compliance.",
    pointerDirection: "none",
    mood: "happy",
    ctaText: "Finish Tour ✓",
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
          className="clay-card-interactive flex h-11 w-11 items-center justify-center rounded-2xl text-[#F2B8C6] shadow-xl border border-white/10 cursor-pointer group bg-[#0C0C10]"
          title="Restart Guided Architecture Tour"
        >
          <HelpCircle className="h-5 w-5 group-hover:text-[#F7F6F3] transition-colors" />
        </motion.button>
      </div>

      {/* ── FLOATING ONBOARDING OVERLAY WIDGET (Non-Blocking) ─────────────── */}
      <AnimatePresence>
        {isVisible && (
          <div className="fixed bottom-20 right-6 sm:bottom-22 sm:right-8 z-50 pointer-events-none max-w-sm w-[92vw] sm:w-[380px]">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto clay-card p-5 sm:p-6 relative shadow-2xl border border-white/10 bg-[#0C0C10]/95 backdrop-blur-2xl"
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-[#1E1E23]/60">
                <div className="flex items-center gap-2.5">
                  <ShieldMascot size={32} mood={currentStep.mood} />
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#F2B8C6] tracking-wider block">
                      Architecture Tour · Step {currentStep.id} of {ONBOARDING_STEPS.length}
                    </span>
                    <h4 className="font-heading font-bold text-xs text-[#F7F6F3]">
                      {currentStep.title}
                    </h4>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-[#8E8E98] hover:text-[#F7F6F3] hover:bg-white/5 transition-colors cursor-pointer"
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

                  {/* Animated Pointer Indicator in Soft Periwinkle */}
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-mono text-[#A8B5E0]">
                    {currentStep.pointerDirection === "down" && (
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex items-center gap-1"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span>Interactive component below</span>
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
                    {currentStep.pointerDirection === "none" && (
                      <div className="flex items-center gap-1 text-[#F2B8C6]">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Defense-only compliance verified</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Action Buttons Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1E1E23]/60 text-xs">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-[#8E8E98] hover:text-[#F7F6F3] font-mono transition-colors cursor-pointer text-[11px]"
                >
                  Skip Tour
                </button>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    className="clay-btn-rose px-4 py-2 font-heading font-bold text-xs flex items-center gap-1.5 cursor-pointer text-[#050505]"
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
