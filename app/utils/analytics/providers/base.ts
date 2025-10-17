/**
 * Base Analytics Provider
 *
 * Abstract base class providing common functionality for all analytics providers.
 * Handles configuration, debugging, and error handling.
 */
import type {
  AnalyticsProvider,
  ProviderConfig,
  ProviderResult,
} from "../types";

export abstract class BaseProvider implements Partial<AnalyticsProvider> {
  protected config: ProviderConfig | null = null;
  protected initialized = false;

  abstract readonly name: string;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.initialized = true;

    if (this.config.debug) {
      console.log(`[${this.name}] Provider initialized with config:`, {
        ...config,
        credentials: Object.keys(config.credentials),
      });
    }
  }

  isConfigured(): boolean {
    return this.initialized && this.config !== null;
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  protected debug(message: string, data?: unknown): void {
    if (this.config?.debug) {
      console.log(`[${this.name}] ${message}`, data || "");
    }
  }

  /**
   * Log errors
   */
  protected error(message: string, error?: unknown): void {
    console.error(`[${this.name}] ${message}`, error || "");
  }

  /**
   * Execute a provider request with timing and error handling
   */
  protected async executeRequest(
    requestFn: () => Promise<Response>,
  ): Promise<ProviderResult> {
    const startTime = Date.now();

    try {
      this.debug("Sending request...");
      const response = await requestFn();
      const duration = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        this.error(`Request failed (${response.status}):`, errorText);

        return {
          provider: this.name,
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          duration,
        };
      }

      this.debug(`Request succeeded in ${duration}ms`);
      return {
        provider: this.name,
        success: true,
        duration,
      };
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      this.error("Request failed with exception:", err);

      return {
        provider: this.name,
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Validate required credentials are present
   */
  protected validateCredentials(required: string[]): void {
    if (!this.config) {
      throw new Error(`${this.name} provider not initialized`);
    }

    const missing = required.filter((key) => !this.config!.credentials[key]);

    if (missing.length > 0) {
      throw new Error(
        `${this.name} missing required credentials: ${missing.join(", ")}`,
      );
    }
  }
}
