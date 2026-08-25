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

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.replace(/\/$/, "");
  }
  return "http://localhost:8000";
};

const INITIAL_GRACE_PERIOD_MS = 2000; // 2.0s timeout before declaring "waking-up"
const RETRY_INTERVAL_MS = 1500; // 1.5s active retry loop while waking up
const IDLE_BACKGROUND_POLL_MS = 25000; // 25s periodic background health check

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
  const hasEverShownHudRef = useRef<boolean>(false);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const backgroundPollRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync statusRef
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const dismissWarmup = useCallback(() => {
    setIsDismissed(true);
  }, []);

  const showWarmup = useCallback(() => {
    setIsDismissed(false);
  }, []);

  const pingHealth = useCallback(async (isPeriodic = false) => {
    if (!isMountedRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
        let data: BackendHealthResponse = { status: "ok" };
        try {
          data = await response.json();
        } catch {
          // Non-json 200 is still healthy
        }

        setApiHealthData(data);
        setStatus("ready");

        // Cancel grace timer
        if (graceTimerRef.current) {
          clearTimeout(graceTimerRef.current);
          graceTimerRef.current = null;
        }

        // Stop elapsed timer
        if (elapsedIntervalRef.current) {
          clearInterval(elapsedIntervalRef.current);
          elapsedIntervalRef.current = null;
        }

        // Clear active polling loop
        if (pollTimeoutRef.current) {
          clearTimeout(pollTimeoutRef.current);
          pollTimeoutRef.current = null;
        }

        // Schedule next idle background poll
        if (backgroundPollRef.current) clearTimeout(backgroundPollRef.current);
        backgroundPollRef.current = setTimeout(() => {
          if (isMountedRef.current) pingHealth(true);
        }, IDLE_BACKGROUND_POLL_MS);

        return;
      }
    } catch {
      // Backend is offline, cold, or waking up
    }

    if (!isMountedRef.current) return;

    // If periodic poll failed while was ready, backend has spun down
    if (isPeriodic || statusRef.current === "ready") {
      startTimeRef.current = Date.now();
      setElapsedSeconds(0);
      setRetryCount(0);
      setIsDismissed(false);
      setStatus("waking-up");
      hasEverShownHudRef.current = true;

      // Start elapsed timer
      if (!elapsedIntervalRef.current) {
        elapsedIntervalRef.current = setInterval(() => {
          if (isMountedRef.current) {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsedSeconds(elapsed);
          }
        }, 1000);
      }
    }

    // Schedule active retry poll while not ready
    if (statusRef.current !== "ready") {
      setRetryCount((prev) => prev + 1);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = setTimeout(() => pingHealth(false), RETRY_INTERVAL_MS);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    // 1. Grace Period: If not resolved within 2.0s, transition to "waking-up"
    graceTimerRef.current = setTimeout(() => {
      if (statusRef.current !== "ready" && isMountedRef.current) {
        hasEverShownHudRef.current = true;
        setStatus("waking-up");

        // Start elapsed timer
        if (!elapsedIntervalRef.current) {
          elapsedIntervalRef.current = setInterval(() => {
            if (isMountedRef.current && statusRef.current !== "ready") {
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setElapsedSeconds(elapsed);
            }
          }, 1000);
        }
      }
    }, INITIAL_GRACE_PERIOD_MS);

    // 2. Immediate ping on mount
    pingHealth(false);

    // 3. Listen for global API success events across app
    const onApiSuccess = () => {
      setStatus("ready");
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
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

    return () => {
      isMountedRef.current = false;
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      if (backgroundPollRef.current) clearTimeout(backgroundPollRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      window.removeEventListener("sentinelpay:backend-success", onApiSuccess);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onVisibilityChange);
    };
  }, [pingHealth]);

  const isWarmingUp = status === "waking-up" && !isDismissed;
  const isReady = status === "ready";

  const value: BackendWarmupContextType = {
    status,
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
      status: "not-yet-checked",
      isWarmingUp: false,
      isReady: false,
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
