"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { API_BASE_URL } from "@/lib/config";

export type WarmupStatus = "not-yet-checked" | "waking-up" | "ready";

export interface BackendHealthResponse {
  status: string;
  uptime_seconds?: number;
  model_loaded?: boolean;
  tree_explainer_loaded?: boolean;
  active_threshold?: number;
  environment?: string;
}

export interface BackendWarmupContextType {
  status: WarmupStatus;
  isWarmingUp: boolean;
  isReady: boolean;
  isAwake: boolean;
  elapsedSeconds: number;
  retryCount: number;
  apiHealthData: BackendHealthResponse | null;
  checkHealthNow: () => Promise<void>;
  dismissWarmup: () => void;
  showWarmup: () => void;
}

// Timing constants
const INITIAL_GRACE_PERIOD_MS = 1500; // 1.5s initial grace period before showing waking HUD
const ACTIVE_POLL_INTERVAL_MS = 1500; // Poll every 1.5s while waking up
const REQUEST_TIMEOUT_MS = 3000; // 3.0s timeout per health check request
const IDLE_BACKGROUND_POLL_MS = 30000; // 30s background keep-alive poll once awake

const BackendWarmupContext = createContext<BackendWarmupContextType | null>(null);

export function BackendWarmupProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WarmupStatus>("not-yet-checked");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [apiHealthData, setApiHealthData] = useState<BackendHealthResponse | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  const startTimeRef = useRef<number>(Date.now());
  const isMountedRef = useRef<boolean>(true);
  const statusRef = useRef<WarmupStatus>("not-yet-checked");

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundPollRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep statusRef synchronized
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Clean helper to cancel all active in-flight requests and timers
  const clearActiveTimers = useCallback(() => {
    if (graceTimerRef.current) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const dismissWarmup = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const showWarmup = useCallback(() => {
    setIsDismissed(false);
  }, []);

  // Start cosmetic elapsed seconds counter ticking alongside real health polling
  const startElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) return;

    elapsedIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      if (statusRef.current === "ready") {
        if (elapsedIntervalRef.current) {
          clearInterval(elapsedIntervalRef.current);
          elapsedIntervalRef.current = null;
        }
        return;
      }
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  }, []);

  // Real backend health check poll driven purely by response state
  const pingHealth = useCallback(
    async (isPeriodicBackgroundCheck = false) => {
      if (!isMountedRef.current) return;

      // Abort any existing in-flight request to avoid overlapping network calls
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok && isMountedRef.current) {
          let data: BackendHealthResponse = { status: "ok" };
          try {
            data = await response.json();
          } catch {
            // Non-json 200 OK is still considered alive
          }

          // Backend is definitively Awake & Ready
          setApiHealthData(data);
          setStatus("ready");
          setIsDismissed(false);
          clearActiveTimers();

          // Schedule periodic background check to detect if free-tier sleeps later
          if (backgroundPollRef.current) clearTimeout(backgroundPollRef.current);
          backgroundPollRef.current = setTimeout(() => {
            if (isMountedRef.current) pingHealth(true);
          }, IDLE_BACKGROUND_POLL_MS);

          return;
        }
      } catch {
        // Request timed out, connection refused, or backend still cold/waking up
        clearTimeout(timeoutId);
      }

      if (!isMountedRef.current) return;

      // If background check failed on a previously ready server, it has spun down
      if (isPeriodicBackgroundCheck || statusRef.current === "ready") {
        startTimeRef.current = Date.now();
        setElapsedSeconds(0);
        setRetryCount(0);
        setIsDismissed(false);
        setStatus("waking-up");
        startElapsedTimer();
      }

      // If still not ready, schedule next active poll
      if (statusRef.current !== "ready" && isMountedRef.current) {
        setRetryCount((prev) => prev + 1);
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current && statusRef.current !== "ready") {
            pingHealth(false);
          }
        }, ACTIVE_POLL_INTERVAL_MS);
      }
    },
    [clearActiveTimers, startElapsedTimer]
  );

  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    // 1. Initial Grace Period: If backend doesn't answer within 1.5s, declare "waking-up"
    graceTimerRef.current = setTimeout(() => {
      if (statusRef.current !== "ready" && isMountedRef.current) {
        setStatus("waking-up");
        startElapsedTimer();
      }
    }, INITIAL_GRACE_PERIOD_MS);

    // 2. Immediate real health ping on mount
    pingHealth(false);

    // 3. Global app-wide API success listener
    const onApiSuccess = () => {
      if (isMountedRef.current) {
        setStatus("ready");
        clearActiveTimers();
      }
    };
    window.addEventListener("sentinelpay:backend-success", onApiSuccess);

    // 4. Tab visibility listener (re-check when returning to idle tab)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && isMountedRef.current) {
        pingHealth(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);

    // 5. Mount cleanup: Cleanly abort in-flight fetch and clear all active intervals
    return () => {
      isMountedRef.current = false;
      clearActiveTimers();
      if (backgroundPollRef.current) {
        clearTimeout(backgroundPollRef.current);
        backgroundPollRef.current = null;
      }
      window.removeEventListener("sentinelpay:backend-success", onApiSuccess);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }, [clearActiveTimers, pingHealth, startElapsedTimer]);

  // State-driven: HUD visible IF AND ONLY IF health check has not succeeded and not user-dismissed
  const isAwake = status === "ready";
  const isReady = isAwake;
  const isWarmingUp = !isAwake && status === "waking-up" && !isDismissed;

  const value: BackendWarmupContextType = {
    status,
    isWarmingUp,
    isReady,
    isAwake,
    elapsedSeconds,
    retryCount,
    apiHealthData,
    checkHealthNow: () => pingHealth(false),
    dismissWarmup,
    showWarmup,
  };

  return (
    <BackendWarmupContext.Provider value={value}>
      {children}
    </BackendWarmupContext.Provider>
  );
}

export function useBackendWarmup(): BackendWarmupContextType {
  const context = useContext(BackendWarmupContext);
  if (!context) {
    return {
      status: "ready",
      isWarmingUp: false,
      isReady: true,
      isAwake: true,
      elapsedSeconds: 0,
      retryCount: 0,
      apiHealthData: null,
      checkHealthNow: async () => {},
      dismissWarmup: () => {},
      showWarmup: () => {},
    };
  }
  return context;
}
