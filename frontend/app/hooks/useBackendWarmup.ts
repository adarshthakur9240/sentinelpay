"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface BackendHealthResponse {
  status: string;
  uptime_seconds?: number;
  model_loaded?: boolean;
  tree_explainer_loaded?: boolean;
  active_threshold?: number;
  environment?: string;
}

export interface UseBackendWarmupReturn {
  isWarmingUp: boolean;
  isReady: boolean;
  elapsedSeconds: number;
  retryCount: number;
  apiHealthData: BackendHealthResponse | null;
  checkHealthNow: () => Promise<void>;
  dismissWarmup: () => void;
}

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.replace(/\/$/, "");
  }
  return "http://localhost:8000";
};

const INITIAL_GRACE_PERIOD_MS = 2000; // Exact 2.0s inactivity threshold before HUD appears
const RETRY_INTERVAL_MS = 1500; // 1.5s polling loop to quickly detect when backend comes online

export function useBackendWarmup(): UseBackendWarmupReturn {
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [apiHealthData, setApiHealthData] = useState<BackendHealthResponse | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const isMountedRef = useRef<boolean>(true);
  const isResolvedRef = useRef<boolean>(false);
  const hasEverShownHudRef = useRef<boolean>(false);

  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const dismissWarmup = useCallback(() => {
    setIsWarmingUp(false);
  }, []);

  const pingHealth = useCallback(async () => {
    if (isResolvedRef.current || !isMountedRef.current) return;

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

      if (response.ok && isMountedRef.current && !isResolvedRef.current) {
        let data: BackendHealthResponse = { status: "ok" };
        try {
          data = await response.json();
        } catch {
          // Non-json 200 is still healthy
        }

        isResolvedRef.current = true;
        setApiHealthData(data);
        setIsReady(true);

        // Cancel grace period immediately so HUD never opens if response was fast (<2s)
        if (graceTimerRef.current) {
          clearTimeout(graceTimerRef.current);
          graceTimerRef.current = null;
        }

        if (hasEverShownHudRef.current) {
          // If HUD was already visible due to >2s inactivity, show quick ready state then auto-disappear
          setTimeout(() => {
            if (isMountedRef.current) {
              setIsWarmingUp(false);
            }
          }, 700);
        } else {
          // Fast response (<2s): HUD stays completely hidden
          setIsWarmingUp(false);
        }

        // Stop elapsed timer
        if (elapsedIntervalRef.current) {
          clearInterval(elapsedIntervalRef.current);
          elapsedIntervalRef.current = null;
        }
        return;
      }
    } catch {
      // Backend is cold, inactive, or still waking
    }

    // Schedule next poll if still unresolved
    if (isMountedRef.current && !isResolvedRef.current) {
      setRetryCount((prev) => prev + 1);
      pollTimeoutRef.current = setTimeout(pingHealth, RETRY_INTERVAL_MS);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    isResolvedRef.current = false;
    hasEverShownHudRef.current = false;
    startTimeRef.current = Date.now();

    // 1. Grace Period: Only show HUD if backend has NOT completed within 2.0s
    graceTimerRef.current = setTimeout(() => {
      if (!isResolvedRef.current && isMountedRef.current) {
        hasEverShownHudRef.current = true;
        setIsWarmingUp(true);
      }
    }, INITIAL_GRACE_PERIOD_MS);

    // 2. Elapsed seconds timer
    elapsedIntervalRef.current = setInterval(() => {
      if (isMountedRef.current && !isResolvedRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);

    // 3. Kick off immediate health ping
    pingHealth();

    // 4. Global fallback listener: if any other component successfully talks to backend
    const onApiSuccess = () => {
      if (!isResolvedRef.current) {
        isResolvedRef.current = true;
        setIsReady(true);
        if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
        if (hasEverShownHudRef.current) {
          setTimeout(() => {
            if (isMountedRef.current) setIsWarmingUp(false);
          }, 700);
        } else {
          setIsWarmingUp(false);
        }
      }
    };
    window.addEventListener("sentinelpay:backend-success", onApiSuccess);

    return () => {
      isMountedRef.current = false;
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      window.removeEventListener("sentinelpay:backend-success", onApiSuccess);
    };
  }, [pingHealth]);

  return {
    isWarmingUp,
    isReady,
    elapsedSeconds,
    retryCount,
    apiHealthData,
    checkHealthNow: pingHealth,
    dismissWarmup,
  };
}
