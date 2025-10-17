// Client-side analytics service with vendor-agnostic interface
import { generateClientId } from "./client-id";
import { analyticsLogger } from "./logger.client";
import {
  getStorageItem,
  removeStorageItem,
  setStorageItem,
} from "./storage.client";

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsService {
  /**
   * Track a page view
   * @param page - Optional page path (defaults to current URL)
   * @param properties - Optional page properties
   */
  page(page?: string, properties?: Record<string, unknown>): Promise<void>;
}

class ClientAnalytics implements AnalyticsService {
  private clientId: string;
  private isEnabled: boolean;

  constructor() {
    this.clientId = this.getOrCreateClientId();
    this.isEnabled = this.checkIfEnabled();
  }

  async track(
    event: string,
    properties: Record<string, unknown> = {},
  ): Promise<void> {
    analyticsLogger.debug(
      {
        event,
        isEnabled: this.isEnabled,
        clientId: this.clientId?.substring(0, 8) + "...", // Only show first 8 chars
      },
      "track() called",
    );

    // Check if tracking is currently enabled (re-check opt-out status on each call)
    if (!this.checkIfEnabled()) {
      const disabledReasons = {
        DNT: navigator.doNotTrack,
        optOut: this.isOptedOut(),
        envDisabled: import.meta.env.JVV_ANALYTICS_ENABLED === "false",
      };
      analyticsLogger.debug(
        { event, disabledReasons },
        "Analytics disabled, skipping event",
      );
      return;
    }

    // Ensure client ID is persisted (handles cases where localStorage was cleared)
    const storedClientId = getStorageItem("analytics_client_id");
    if (!storedClientId) {
      setStorageItem("analytics_client_id", this.clientId);
    }

    try {
      const payload: AnalyticsEvent = {
        event,
        properties: {
          ...properties,
          client_id: this.clientId,
          page_url: window.location.href,
          page_title: document.title,
          page_referrer: document.referrer,
          timestamp: new Date().toISOString(),
        },
      };

      analyticsLogger.debug(
        {
          event: payload.event,
          propertiesCount: Object.keys(payload.properties || {}).length,
          // Don't log full payload in production for privacy
          hasClientId: !!(
            payload.properties && "client_id" in payload.properties
          ),
        },
        "Sending payload to server",
      );
      await this.sendToServer(payload);
      analyticsLogger.debug({ event }, "Successfully sent to server");
    } catch (error) {
      analyticsLogger.error({ event, error }, "Analytics tracking error");
    }
  }

  async page(
    page?: string,
    properties: Record<string, unknown> = {},
  ): Promise<void> {
    const pagePath = page || window.location.pathname;

    await this.track("page_view", {
      ...properties,
      page_path: pagePath,
      page_location: window.location.href,
    });
  }

  private async sendToServer(payload: AnalyticsEvent): Promise<void> {
    analyticsLogger.debug("Making POST request to /api/events");

    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    analyticsLogger.debug(
      { status: response.status },
      "Server response received",
    );

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  private getOrCreateClientId(): string {
    const key = "analytics_client_id";
    let clientId = getStorageItem(key);

    if (!clientId) {
      clientId = generateClientId();

      // Try to store the new client ID
      const success = setStorageItem(key, clientId);
      if (!success) {
        analyticsLogger.warn(
          "Unable to persist client ID, using session-only tracking",
        );
      }
    }

    return clientId;
  }

  private checkIfEnabled(): boolean {
    // Check for DNT header
    if (navigator.doNotTrack === "1") {
      return false;
    }

    // Check for local opt-out
    if (getStorageItem("analytics_opt_out") === "true") {
      return false;
    }

    // Check environment - only disable if explicitly set to false
    if (import.meta.env.JVV_ANALYTICS_ENABLED === "false") {
      return false;
    }

    return true;
  }

  // Privacy methods
  /**
   * Opt out of analytics tracking
   * Sets a persistent flag to disable analytics
   */
  optOut(): void {
    const success = setStorageItem("analytics_opt_out", "true");
    if (!success) {
      analyticsLogger.warn("Unable to persist opt-out preference");
    }
    analyticsLogger.debug("Analytics opt-out enabled");
  }

  /**
   * Opt back in to analytics tracking
   * Removes the opt-out flag to re-enable analytics
   */
  optIn(): void {
    const success = removeStorageItem("analytics_opt_out");
    if (!success) {
      analyticsLogger.warn("Unable to persist opt-in preference");
    }
    analyticsLogger.debug("Analytics opt-out disabled");
  }

  /**
   * Check if user has opted out of analytics
   * @returns True if user has opted out
   */
  isOptedOut(): boolean {
    return getStorageItem("analytics_opt_out") === "true";
  }
}

// Global analytics instance
export const analytics = new ClientAnalytics();

/**
 * React hook for accessing analytics functionality
 * Provides bound methods from the global analytics instance
 * @returns Object with all analytics methods properly bound
 */
export function useAnalytics() {
  return {
    page: analytics.page.bind(analytics),
    optOut: analytics.optOut.bind(analytics),
    optIn: analytics.optIn.bind(analytics),
    isOptedOut: analytics.isOptedOut.bind(analytics),
  };
}
