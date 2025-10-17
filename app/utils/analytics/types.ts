/**
 * Analytics Provider Types
 *
 * This module defines the core types and interfaces for the analytics provider abstraction.
 * The provider pattern allows easy swapping between analytics services (GA4, GoatCounter, etc.)
 * without changing application code.
 */

/**
 * Configuration for initializing an analytics provider
 */
export interface ProviderConfig {
  /** Provider-specific configuration (API keys, endpoints, etc.) */
  credentials: Record<string, string>;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Standard page view event data
 */
export interface PageViewData {
  /** URL path (e.g., "/blog/my-post") */
  path: string;
  /** Full URL including domain */
  url: string;
  /** Page title from document.title */
  title: string;
  /** Referrer URL if available */
  referrer?: string;
  /** ISO 8601 timestamp */
  timestamp: string;
}

/**
 * Generic analytics event
 */
export interface AnalyticsEvent {
  /** Event name (e.g., "page_view", "click", "error") */
  event: string;
  /** Event properties/parameters */
  properties: Record<string, unknown>;
}

/**
 * Server-side context enrichment data
 */
export interface ServerContext {
  /** Client IP address */
  clientIp?: string;
  /** User agent string */
  userAgent?: string;
  /** Request headers */
  headers: Headers;
}

/**
 * Analytics provider interface
 *
 * All analytics providers must implement this interface to be compatible
 * with the provider registry system.
 */
export interface AnalyticsProvider {
  /** Provider name (e.g., "ga4", "goatcounter") */
  readonly name: string;

  /**
   * Initialize the provider with credentials
   * @param config Provider configuration
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Track a page view event
   * @param data Page view data
   * @param context Server-side context for enrichment
   */
  trackPageView(data: PageViewData, context?: ServerContext): Promise<void>;

  /**
   * Track a custom event (optional - not all providers support this)
   * @param event Event data
   * @param context Server-side context for enrichment
   */
  trackEvent?(event: AnalyticsEvent, context?: ServerContext): Promise<void>;

  /**
   * Flush any pending events (for batching providers)
   */
  flush?(): Promise<void>;

  /**
   * Check if provider is properly configured and ready
   */
  isConfigured(): boolean;
}

/**
 * Provider factory function type
 */
export type ProviderFactory = () => AnalyticsProvider;

/**
 * Result of sending an event to a provider
 */
export interface ProviderResult {
  /** Provider name */
  provider: string;
  /** Whether the request succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
  /** Response time in milliseconds */
  duration?: number;
}
