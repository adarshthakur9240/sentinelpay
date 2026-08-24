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
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const INITIAL_GRACE_PERIOD_MS = 2500; // 2.5s before surfacing warmup overlay
const RETRY_INTERVAL_MS = 3000; // 3s polling intervals

export function useBackendWarmup(): UseBackendWarmupReturn {
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [apiHealthData, setApiHealthData] = useState<BackendHealthResponse | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const isMountedRef = useRef<boolean>(true);
  const isReadyRef = useRef<boolean>(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const pingHealth = useCallback(async () => {
    if (isReadyRef.current || !isMountedRef.current) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

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
        const data: BackendHealthResponse = await response.json();
        setApiHealthData(data);
        setIsReady(true);
        isReadyRef.current = true;

        // If overlay was already shown, let it show success briefly before dismissal
        setTimeout(() => {
          if (isMountedRef.current) {
            setIsWarmingUp(false);
          }
        }, 2200);
        return;
      }
    } catch (err) {
      // Endpoint still waking up or unreachable
    }

    if (isMountedRef.current && !isReadyRef.current) {
      setRetryCount((prev) => prev + 1);
      pollTimeoutRef.current = setTimeout(pingHealth, RETRY_INTERVAL_MS);
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startTimeRef.current = Date.now();

    // 1. Grace period: If backend responds under 2.5s, user never sees warmup HUD
    graceTimerRef.current = setTimeout(() => {
      if (!isReadyRef.current && isMountedRef.current) {
        setIsWarmingUp(true);
      }
    }, INITIAL_GRACE_PERIOD_MS);

    // 2. Ticking timer for elapsed seconds
    elapsedIntervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(elapsed);
      }
    }, 1000);

    // 3. Initiate first health check
    pingHealth();

    return () => {
      isMountedRef.current = false;
      if (graceTimerRef.current) clearTimeout(graceTimerRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, [pingHealth]);

  return {
    isWarmingUp,
    isReady,
    elapsedSeconds,
    retryCount,
    apiHealthData,
    checkHealthNow: pingHealth,
  };
}
