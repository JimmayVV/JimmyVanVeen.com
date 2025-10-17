/**
 * GoatCounter Analytics Provider
 *
 * Implements privacy-first analytics using GoatCounter's API.
 * GoatCounter is a lightweight, open-source analytics platform that focuses
 * on page views without complex event tracking.
 *
 * API Documentation: https://www.goatcounter.com/api
 */
import type {
  AnalyticsEvent,
  AnalyticsProvider,
  PageViewData,
  ServerContext,
} from "../types";
import { BaseProvider } from "./base";

/**
 * GoatCounter hit payload structure
 * Reference: https://www.goatcounter.com/api#post-count
 */
interface GoatCounterHit {
  /** URL path being tracked */
  path: string;
  /** Page title */
  title?: string;
  /** Event marker (true for custom events, omit for pageviews) */
  event?: boolean;
  /** Referrer URL */
  ref?: string;
  /** Screen size (width,height) */
  size?: string;
  /** Session identifier for unique visitor tracking */
  session?: string;
}

/**
 * GoatCounter API request payload
 */
interface GoatCounterPayload {
  hits: GoatCounterHit[];
}

export class GoatCounterProvider
  extends BaseProvider
  implements AnalyticsProvider
{
  readonly name = "goatcounter";

  private siteCode: string | null = null;
  private apiToken: string | null = null;

  async initialize(config: {
    credentials: Record<string, string>;
    debug?: boolean;
  }): Promise<void> {
    await super.initialize(config);

    this.siteCode = config.credentials.GOATCOUNTER_SITE_CODE || null;
    this.apiToken = config.credentials.GOATCOUNTER_API_TOKEN || null;

    // Validate site code format (alphanumeric, hyphens, underscores)
    if (this.siteCode && !/^[a-zA-Z0-9_-]+$/.test(this.siteCode)) {
      this.error(`Invalid GOATCOUNTER_SITE_CODE format: ${this.siteCode}`);
      this.siteCode = null;
    }

    // Validate API token exists and is non-empty
    if (this.apiToken && this.apiToken.length < 10) {
      this.error("Invalid GOATCOUNTER_API_TOKEN - token too short");
      this.apiToken = null;
    }

    if (this.siteCode && this.apiToken) {
      this.debug("GoatCounter provider initialized successfully");
    } else {
      this.debug(
        "GoatCounter provider initialized but missing credentials - tracking disabled",
      );
    }
  }

  isConfigured(): boolean {
    return !!(this.siteCode && this.apiToken);
  }

  async trackPageView(
    data: PageViewData,
    _context?: ServerContext,
  ): Promise<void> {
    if (!this.isConfigured()) {
      this.debug("Skipping page view - provider not configured");
      return;
    }

    const hit: GoatCounterHit = {
      path: data.path,
      title: data.title,
      ref: data.referrer,
      // Use client_id as session identifier for unique visitor tracking
      // GoatCounter uses this to distinguish unique visitors
      session: this.extractSessionId(data),
    };

    const payload: GoatCounterPayload = {
      hits: [hit],
    };

    const url = `https://${this.siteCode}.goatcounter.com/api/v0/count`;

    await this.executeRequest(async () => {
      if (this.config?.debug) {
        this.debug("Sending to GoatCounter", JSON.stringify(payload, null, 2));
      }

      return fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiToken}`,
        },
        body: JSON.stringify(payload),
      });
    });
  }

  async trackEvent(
    event: AnalyticsEvent,
    context?: ServerContext,
  ): Promise<void> {
    if (!this.isConfigured()) {
      this.debug(`Skipping event '${event.event}' - provider not configured`);
      return;
    }

    // GoatCounter only supports pageviews
    // Filter to only process page_view events
    if (event.event !== "page_view") {
      this.debug(
        `Skipping non-pageview event '${event.event}' - GoatCounter only supports pageviews`,
      );
      return;
    }

    // Extract pageview data from event properties
    const pageViewData: PageViewData = {
      path: (event.properties.page_path as string) || "/",
      url: (event.properties.page_location as string) || "",
      title: (event.properties.page_title as string) || "",
      referrer: event.properties.page_referrer as string | undefined,
      timestamp:
        (event.properties.timestamp as string) || new Date().toISOString(),
    };

    await this.trackPageView(pageViewData, context);
  }

  /**
   * Extract session identifier from page view data
   * Uses client_id from properties if available
   */
  private extractSessionId(_data: PageViewData): string | undefined {
    // GoatCounter uses session IDs to track unique visitors
    // We can use the client_id from our analytics system
    // The session ID should be passed through the data object
    // For now, return undefined and let GoatCounter generate its own
    return undefined;
  }
}

/**
 * Factory function for creating GoatCounter provider instances
 */
export function createGoatCounterProvider(): AnalyticsProvider {
  return new GoatCounterProvider();
}
