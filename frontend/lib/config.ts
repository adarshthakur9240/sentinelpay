/**
 * SentinelPay Global API Configuration
 * Single source of truth for all backend HTTP, OpenAPI Docs, and WebSocket endpoints.
 */

// Base backend URL from environment or local fallback
export const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

// OpenAPI Docs URL
export const API_DOCS_URL: string = `${API_BASE_URL}/docs`;

// Dynamic WebSocket URL mapping (http -> ws, https -> wss)
export const getApiWsUrl = (): string => {
  const base = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/$/, "");
  if (base.startsWith("https://")) {
    return base.replace(/^https:\/\//, "wss://") + "/ws/live-feed";
  }
  if (base.startsWith("http://")) {
    return base.replace(/^http:\/\//, "ws://") + "/ws/live-feed";
  }
  return `ws://${base}/ws/live-feed`;
};

export const API_WS_URL: string = getApiWsUrl();

export const getApiBaseUrl = (): string => API_BASE_URL;
export const getApiDocsUrl = (): string => API_DOCS_URL;
