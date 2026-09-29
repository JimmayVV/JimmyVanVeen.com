/**
 * GoatCounter Analytics Provider
 *
 * Implements privacy-first analytics using GoatCounter's API.
 * GoatCounter is a lightweight, open-source analytics platform that focuses
 * on page views without complex event tracking.
 *
 * API Documentation: https://www.goatcounter.com/api
 */
import type { AnalyticsEvent, AnalyticsProvider, PageViewData, ServerContext } from "../types";
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
  ref?: string | undefined;
  /** Screen size (width,height) */
  size?: string | undefined;
  /** Query string; GoatCounter reads utm_source/ref from it as the campaign */
  query?: string | undefined;
  /** Visitor's User-Agent, for browser/system stats and unique visitors */
  user_agent?: string | undefined;
  /** Visitor's IP, for location and unique visitors (not stored by GoatCounter) */
  ip?: string | undefined;
}

/**
 * GoatCounter API request payload
 */
interface GoatCounterPayload {
  hits: GoatCounterHit[];
  /**
   * Required when a hit carries neither a session nor browser+IP; without it
   * GoatCounter rejects the whole request with a 400.
   */
  no_sessions?: boolean;
}

export class GoatCounterProvider extends BaseProvider implements AnalyticsProvider {
  readonly name = "goatcounter";

  private siteCode: string | null = null;
  private apiToken: string | null = null;

  override async initialize(config: {
    credentials: Record<string, string>;
    debug?: boolean;
  }): Promise<void> {
    await super.initialize(config);

    this.siteCode = config.credentials["GOATCOUNTER_SITE_CODE"] || null;
    this.apiToken = config.credentials["GOATCOUNTER_API_TOKEN"] || null;

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
      this.debug("GoatCounter provider initialized but missing credentials - tracking disabled");
    }
  }

  override isConfigured(): boolean {
    return !!(this.siteCode && this.apiToken);
  }

  async trackPageView(data: PageViewData, context?: ServerContext): Promise<void> {
    if (!this.isConfigured()) {
      this.debug("Skipping page view - provider not configured");
      return;
    }

    // Server-side hits come from the function's own IP and user agent, so the
    // visitor's must be forwarded or GoatCounter can't tell visitors apart.
    const userAgent = context?.userAgent || undefined;
    const ip = context?.clientIp && context.clientIp !== "unknown" ? context.clientIp : undefined;

    const hit: GoatCounterHit = {
      path: data.path,
      title: data.title,
      ref: data.referrer || undefined,
      query: extractQuery(data.url),
      user_agent: userAgent,
      ip,
    };

    const payload: GoatCounterPayload = {
      hits: [hit],
      ...(userAgent && ip ? {} : { no_sessions: true }),
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

  async trackEvent(event: AnalyticsEvent, context?: ServerContext): Promise<void> {
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
    const asString = (value: unknown): string | undefined =>
      typeof value === "string" ? value : undefined;

    const pageViewData: PageViewData = {
      path: asString(event.properties["page_path"]) || "/",
      url: asString(event.properties["page_location"]) || "",
      title: asString(event.properties["page_title"]) || "",
      referrer: asString(event.properties["page_referrer"]),
      timestamp: asString(event.properties["timestamp"]) || new Date().toISOString(),
    };

    await this.trackPageView(pageViewData, context);
  }
}

/**
 * Return the "?…" part of a page URL, or undefined when there is none or the URL
 * doesn't parse. GoatCounter reads campaign parameters (utm_source, ref) from it.
 */
function extractQuery(pageUrl: string): string | undefined {
  try {
    return new URL(pageUrl).search || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Factory function for creating GoatCounter provider instances
 */
export function createGoatCounterProvider(): AnalyticsProvider {
  return new GoatCounterProvider();
}
