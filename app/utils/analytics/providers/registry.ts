/**
 * Analytics Provider Registry
 *
 * Manages registration and retrieval of analytics providers.
 * Supports multiple providers for dual-tracking or A/B testing scenarios.
 */
import type { AnalyticsProvider, ProviderFactory } from "../types";

class ProviderRegistry {
  private providers = new Map<string, ProviderFactory>();
  private activeProviders = new Map<string, AnalyticsProvider>();

  /**
   * Register a provider factory
   * @param name Provider name (e.g., "ga4", "goatcounter")
   * @param factory Factory function that creates the provider instance
   */
  register(name: string, factory: ProviderFactory): void {
    this.providers.set(name, factory);
  }

  /**
   * Get a provider instance (creates if doesn't exist)
   * @param name Provider name
   * @returns Provider instance or undefined if not registered
   */
  get(name: string): AnalyticsProvider | undefined {
    // Return existing instance if available
    if (this.activeProviders.has(name)) {
      return this.activeProviders.get(name);
    }

    // Create new instance from factory
    const factory = this.providers.get(name);
    if (!factory) {
      return undefined;
    }

    const provider = factory();
    this.activeProviders.set(name, provider);
    return provider;
  }

  /**
   * Get all active provider instances
   */
  getAll(): AnalyticsProvider[] {
    return Array.from(this.activeProviders.values());
  }

  /**
   * Get all registered provider names
   */
  getRegisteredNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Clear all providers (useful for testing)
   */
  clear(): void {
    this.providers.clear();
    this.activeProviders.clear();
  }

  /**
   * Remove a specific provider
   */
  remove(name: string): void {
    this.providers.delete(name);
    this.activeProviders.delete(name);
  }
}

// Singleton instance
export const registry = new ProviderRegistry();

/**
 * Helper to register a provider
 */
export function registerProvider(name: string, factory: ProviderFactory): void {
  registry.register(name, factory);
}

/**
 * Helper to get a provider
 */
export function getProvider(name: string): AnalyticsProvider | undefined {
  return registry.get(name);
}
