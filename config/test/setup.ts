// Vitest global setup file
import { beforeEach, vi } from "vitest";

// Mock environment variables for testing
beforeEach(() => {
  // Mock process.env for server-side tests
  process.env.GA4_MEASUREMENT_ID = "G-TEST123456";
  process.env.GA4_API_SECRET = "test_api_secret_key_123456";
  process.env.GA4_DEBUG = "false";

  // Mock import.meta.env for client-side tests
  vi.stubGlobal("import.meta", {
    env: {
      MODE: "test",
      PROD: false,
      DEV: true,
      SSR: false,
      JVV_ANALYTICS_ENABLED: "true",
      JVV_ANALYTICS_DEBUG: "false",
    },
  });
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      const value = store[key];
      return value !== undefined ? value : null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock sessionStorage (same implementation as localStorage for tests)
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      const value = store[key];
      return value !== undefined ? value : null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = String(value);
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
  writable: true,
});

// Mock navigator
Object.defineProperty(window, "navigator", {
  value: {
    doNotTrack: null,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  writable: true,
});
