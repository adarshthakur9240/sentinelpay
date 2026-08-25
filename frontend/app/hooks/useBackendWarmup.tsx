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
  elapsedSeconds: number;
  retryCount: number;
  apiHealthData: BackendHealthResponse | null;
  checkHealthNow: () => Promise<void>;
  dismissWarmup: () => void;
  showWarmup: () => void;
}

const getBaseUrl = (): string => API_BASE_URL;

// Timing constants
const INITIAL_GRACE_PERIOD_MS = 2000; // 2.0s timeout before declaring "waking-up"
const RETRY_INTERVAL_MS = 1500; // 1.5s active retry loop while waking up
const IDLE_BACKGROUND_POLL_MS = 25000; // 25s periodic background health check
const MAX_WARMUP_TIMEOUT_SECONDS = 60; // Strict hard timeout constraint: 60s max wait
const MAX_CONSECUTIVE_ERRORS = 25; // Stop retrying if backend is completely down

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
  const errorCountRef = useRef<number>(0);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundPollRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync statusRef
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Clean helper to cancel all active timers
  const clearAllTimers = useCallback(() => {
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

  // Gracefully degrade and hide HUD
  const handleGracefulDegrade = useCallback(() => {
    clearAllTimers();
    setStatus("ready");
    setIsDismissed(true);
  }, [clearAllTimers]);

  const dismissWarmup = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const showWarmup = useCallback(() => {
    setIsDismissed(false);
  }, []);

  // Start elapsed timer with strict 60s hard timeout constraint
  const startElapsedTimer = useCallback(() => {
    if (elapsedIntervalRef.current) return;

    elapsedIntervalRef.current = setInterval(() => {
      if (!isMountedRef.current) return;

      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      // Hard Timeout Constraint: If elapsed reaches 60s, force stop and gracefully degrade
      if (elapsed >= MAX_WARMUP_TIMEOUT_SECONDS) {
        handleGracefulDegrade();
      }
    }, 1000);
  }, [handleGracefulDegrade]);

  const pingHealth = useCallback(
    async (isPeriodic = false) => {
      if (!isMountedRef.current) return;

      // If hard timeout has passed, do not initiate further pings
      const currentElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      if (currentElapsed >= MAX_WARMUP_TIMEOUT_SECONDS) {
        handleGracefulDegrade();
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const baseUrl = getBaseUrl();

      try {
        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          signal: controller.signal,
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        });

        clearTimeout(timeoutId);

        if (response.ok && isMountedRef.current) {
          errorCountRef.current = 0;
          let data: BackendHealthResponse = { status: "ok" };
          try {
            data = await response.json();
          } catch {
            // Non-json 200 is still healthy
          }

          setApiHealthData(data);
          setStatus("ready");
          clearAllTimers();

          // Schedule next idle background poll
          if (backgroundPollRef.current) clearTimeout(backgroundPollRef.current);
          backgroundPollRef.current = setTimeout(() => {
            if (isMountedRef.current) pingHealth(true);
          }, IDLE_BACKGROUND_POLL_MS);

          return;
        } else {
          // Server returned 500 or error status
          errorCountRef.current += 1;
        }
      } catch {
        // Robust Catch Block: Backend is offline (ERR_CONNECTION_REFUSED), cold, or unreachable
        clearTimeout(timeoutId);
        errorCountRef.current += 1;
      }

      if (!isMountedRef.current) return;

      // Check if maximum consecutive errors exceeded -> Graceful degradation
      if (errorCountRef.current >= MAX_CONSECUTIVE_ERRORS) {
        handleGracefulDegrade();
        return;
      }

      // If periodic poll failed while was ready, backend has spun down
      if (isPeriodic || statusRef.current === "ready") {
        startTimeRef.current = Date.now();
        setElapsedSeconds(0);
        setRetryCount(0);
        setIsDismissed(false);
        setStatus("waking-up");
        startElapsedTimer();
      }

      // Schedule active retry poll while not ready
      if (statusRef.current !== "ready" && isMountedRef.current) {
        setRetryCount((prev) => prev + 1);
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = setTimeout(() => pingHealth(false), RETRY_INTERVAL_MS);
      }
    },
    [clearAllTimers, handleGracefulDegrade, startElapsedTimer]
  );

  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    // 1. Grace Period: If not resolved within 2.0s, transition to "waking-up"
    graceTimerRef.current = setTimeout(() => {
      if (statusRef.current !== "ready" && isMountedRef.current) {
        setStatus("waking-up");
        startElapsedTimer();
      }
    }, INITIAL_GRACE_PERIOD_MS);

    // 2. Immediate ping on mount
    pingHealth(false);

    // 3. Listen for global API success events across app
    const onApiSuccess = () => {
      setStatus("ready");
      clearAllTimers();
    };
    window.addEventListener("sentinelpay:backend-success", onApiSuccess);

    // 4. Window focus / visibility listener (judges returning to tab after 15+ mins idle)
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        pingHealth(true);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onVisibilityChange);

    // 5. Mount Check & Cleanup: Clear all intervals, timeouts, and listeners
    return () => {
      isMountedRef.current = false;
      clearAllTimers();
      if (backgroundPollRef.current) {
        clearTimeout(backgroundPollRef.current);
        backgroundPollRef.current = null;
      }
      window.removeEventListener("sentinelpay:backend-success", onApiSuccess);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }, [clearAllTimers, pingHealth, startElapsedTimer]);

  const isWarmingUp = status === "waking-up" && !isDismissed && elapsedSeconds < MAX_WARMUP_TIMEOUT_SECONDS;
  const isReady = status === "ready" || elapsedSeconds >= MAX_WARMUP_TIMEOUT_SECONDS;

  const value: BackendWarmupContextType = {
    status: isReady ? "ready" : status,
    isWarmingUp,
    isReady,
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
    // Fallback if rendered outside provider
    return {
      status: "ready",
      isWarmingUp: false,
      isReady: true,
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
