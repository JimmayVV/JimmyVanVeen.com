// Client-side analytics service with vendor-agnostic interface

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): Promise<void>;
  page(page?: string, properties?: Record<string, unknown>): Promise<void>;
  identify(userId: string, traits?: Record<string, unknown>): Promise<void>;
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
    if (!this.isEnabled) {
      console.log("Analytics disabled, skipping event:", event);
      return;
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

      await this.sendToServer(payload);
    } catch (_error) {
      console.error("Analytics tracking error:", _error);
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

  async identify(
    userId: string,
    traits: Record<string, unknown> = {},
  ): Promise<void> {
    await this.track("user_identify", {
      user_id: userId,
      ...traits,
    });
  }

  private async sendToServer(payload: AnalyticsEvent): Promise<void> {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  private getOrCreateClientId(): string {
    const key = "analytics_client_id";
    let clientId: string | null = null;

    // Try localStorage first
    try {
      clientId = localStorage.getItem(key);
    } catch (_error) {
      console.warn("localStorage not available, trying sessionStorage");

      // Fallback to sessionStorage
      try {
        clientId = sessionStorage.getItem(key);
      } catch (_sessionError) {
        console.warn("sessionStorage not available, using in-memory client ID");
      }
    }

    if (!clientId) {
      clientId = `${Date.now()}.${Math.random().toString(36).substring(2)}`;

      // Try to store the new client ID
      try {
        localStorage.setItem(key, clientId);
      } catch (_error) {
        try {
          sessionStorage.setItem(key, clientId);
        } catch (_sessionError) {
          // Both storage methods failed, continue with in-memory only
          console.warn(
            "Unable to persist client ID, using session-only tracking",
          );
        }
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
    try {
      if (localStorage.getItem("analytics_opt_out") === "true") {
        return false;
      }
    } catch (_error) {
      try {
        if (sessionStorage.getItem("analytics_opt_out") === "true") {
          return false;
        }
      } catch (_sessionError) {
        // Storage not available, continue with other checks
      }
    }

    // Check environment
    if (import.meta.env.JVV_ANALYTICS_ENABLED === "false") {
      return false;
    }

    return true;
  }

  // Utility methods for common events
  async trackClick(
    element: string,
    properties: Record<string, unknown> = {},
  ): Promise<void> {
    await this.track("click", {
      element,
      ...properties,
    });
  }

  async trackError(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<void> {
    await this.track("error", {
      error_message: error.message,
      error_stack: error.stack || "No stack trace available",
      ...context,
    });
  }

  async trackTiming(
    name: string,
    duration: number,
    properties: Record<string, unknown> = {},
  ): Promise<void> {
    await this.track("timing", {
      timing_name: name,
      timing_duration: duration,
      ...properties,
    });
  }

  // Privacy methods
  optOut(): void {
    try {
      localStorage.setItem("analytics_opt_out", "true");
    } catch (_error) {
      try {
        sessionStorage.setItem("analytics_opt_out", "true");
      } catch (_sessionError) {
        console.warn("Unable to persist opt-out preference");
      }
    }
    console.log("Analytics opt-out enabled");
  }

  optIn(): void {
    try {
      localStorage.removeItem("analytics_opt_out");
    } catch (_error) {
      try {
        sessionStorage.removeItem("analytics_opt_out");
      } catch (_sessionError) {
        console.warn("Unable to persist opt-in preference");
      }
    }
    console.log("Analytics opt-out disabled");
  }

  isOptedOut(): boolean {
    try {
      return localStorage.getItem("analytics_opt_out") === "true";
    } catch (_error) {
      try {
        return sessionStorage.getItem("analytics_opt_out") === "true";
      } catch (_sessionError) {
        return false; // Default to enabled if storage not available
      }
    }
  }
}

// Global analytics instance
export const analytics = new ClientAnalytics();

// React hook for analytics
export function useAnalytics() {
  return {
    track: analytics.track.bind(analytics),
    page: analytics.page.bind(analytics),
    identify: analytics.identify.bind(analytics),
    trackClick: analytics.trackClick.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackTiming: analytics.trackTiming.bind(analytics),
    optOut: analytics.optOut.bind(analytics),
    optIn: analytics.optIn.bind(analytics),
    isOptedOut: analytics.isOptedOut.bind(analytics),
  };
}
