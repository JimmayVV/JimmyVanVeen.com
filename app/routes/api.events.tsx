import { type ActionFunctionArgs } from "react-router";

import { createGoatCounterProvider } from "~/utils/analytics/providers/goatcounter";
import { registry } from "~/utils/analytics/providers/registry";
import type { AnalyticsEvent, ServerContext } from "~/utils/analytics/types";

// Initialize providers on first load
let hasInitialized = false;
async function initializeProviders() {
  if (hasInitialized) return;
  hasInitialized = true;

  // Register GoatCounter provider
  registry.register("goatcounter", createGoatCounterProvider);

  // Initialize GoatCounter with credentials
  const goatcounter = registry.get("goatcounter");
  if (goatcounter) {
    await goatcounter.initialize({
      credentials: {
        GOATCOUNTER_SITE_CODE: process.env.GOATCOUNTER_SITE_CODE || "",
        GOATCOUNTER_API_TOKEN: process.env.GOATCOUNTER_API_TOKEN || "",
      },
      debug: process.env.GOATCOUNTER_DEBUG === "true",
    });

    if (goatcounter.isConfigured()) {
      console.log("GoatCounter analytics configured and ready");
    } else {
      console.log(
        "GoatCounter environment variables not configured - analytics will be disabled",
      );
    }
  }
}

/**
 * Reset initialization state and clear providers (for testing)
 * @internal
 */
export function __resetForTesting() {
  hasInitialized = false;
  registry.clear();
}

export async function action({ request }: ActionFunctionArgs) {
  // Initialize providers on first request
  await initializeProviders();

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Validate content length to prevent memory exhaustion
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_CONTENT_LENGTH) {
      return Response.json({ error: "Request too large" }, { status: 413 });
    }

    const body = await request.json();

    // Validate input structure
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { event, properties = {} } = body;

    // Validate event name
    if (!event || typeof event !== "string") {
      return Response.json(
        { error: "Event name is required and must be a string" },
        { status: 400 },
      );
    }

    // Sanitize event name - alphanumeric, underscore, max 50 chars
    if (!/^[a-zA-Z0-9_]{1,50}$/.test(event)) {
      return Response.json(
        {
          error:
            "Invalid event name. Use alphanumeric characters and underscore only, max 50 characters",
        },
        { status: 400 },
      );
    }

    // Validate properties object
    if (
      properties &&
      (typeof properties !== "object" || Array.isArray(properties))
    ) {
      return Response.json(
        { error: "Properties must be an object" },
        { status: 400 },
      );
    }

    // Sanitize properties - limit depth and size
    const sanitizedProperties = sanitizeProperties(properties);
    if (!sanitizedProperties) {
      return Response.json(
        { error: "Properties object too complex or large" },
        { status: 400 },
      );
    }

    // Get client info from headers
    const userAgent = request.headers.get("user-agent") || "";
    const clientIP = getClientIP(request);
    const referer = request.headers.get("referer") || "";

    // Basic rate limiting check
    if (await isRateLimited(clientIP)) {
      return Response.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": "60",
            "X-RateLimit-Window": "60",
          },
        },
      );
    }

    // Add server-side context
    const enrichedProperties = {
      ...sanitizedProperties,
      timestamp: new Date().toISOString(),
      user_agent: userAgent,
      client_ip: clientIP,
      referer,
      server_side: true,
    };

    // Create server context for providers
    const serverContext: ServerContext = {
      clientIp: clientIP,
      userAgent,
      headers: request.headers,
    };

    // Send to analytics providers
    await sendToAnalyticsProviders(event, enrichedProperties, serverContext);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Analytics API error:", error);
    // Always return success to client - don't fail their request because of analytics
    return Response.json({
      success: true,
      warning: "Analytics tracking failed",
    });
  }
}

/**
 * Send event to all configured analytics providers
 */
async function sendToAnalyticsProviders(
  eventName: string,
  properties: Record<string, unknown>,
  context: ServerContext,
): Promise<void> {
  const analyticsEvent: AnalyticsEvent = {
    event: eventName,
    properties,
  };

  // Get all active providers
  const providers = registry.getAll();

  if (providers.length === 0) {
    console.log("No analytics providers configured");
    return;
  }

  // Send to all providers in parallel
  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      if (!provider.isConfigured()) {
        console.log(`Provider ${provider.name} not configured, skipping`);
        return;
      }

      if (provider.trackEvent) {
        await provider.trackEvent(analyticsEvent, context);
      }
    }),
  );

  // Log any failures
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      const provider = providers[index];
      console.error(`Provider ${provider?.name} failed:`, result.reason);
    }
  });
}

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute
const RATE_LIMIT_CLEANUP_INTERVAL = 60000; // Clean up expired entries every minute
const RATE_LIMIT_MAX_ENTRIES = 1000; // Prevent memory exhaustion
const RATE_LIMIT_TRIM_TO = 500; // Trim to this many entries when limit exceeded

// Content size limits
const MAX_CONTENT_LENGTH = 10000; // 10KB limit for request body

// Property sanitization limits
const MAX_PROPERTIES = 20;
const MAX_STRING_LENGTH = 500;
const MAX_PROPERTY_DEPTH = 3;

// Simple in-memory rate limiter for serverless environment
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
let lastCleanup = 0;

async function isRateLimited(clientIP: string): Promise<boolean> {
  const now = Date.now();

  // Only cleanup expired entries every minute to reduce iteration overhead
  if (now - lastCleanup > RATE_LIMIT_CLEANUP_INTERVAL) {
    for (const [ip, data] of rateLimitMap.entries()) {
      if (now > data.resetTime) {
        rateLimitMap.delete(ip);
      }
    }
    lastCleanup = now;
  }

  // Prevent memory exhaustion in high-traffic scenarios
  if (rateLimitMap.size > RATE_LIMIT_MAX_ENTRIES) {
    // Keep only recent entries
    const sortedEntries = Array.from(rateLimitMap.entries())
      .sort((a, b) => b[1].resetTime - a[1].resetTime)
      .slice(0, RATE_LIMIT_TRIM_TO);
    rateLimitMap.clear();
    sortedEntries.forEach(([k, v]) => rateLimitMap.set(k, v));
  }

  const clientData = rateLimitMap.get(clientIP);

  if (!clientData) {
    // First request from this IP
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (now > clientData.resetTime) {
    // Reset window
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true; // Rate limited
  }

  // Increment count
  clientData.count++;
  return false;
}

function getClientIP(request: Request): string {
  const xForwardedFor = request.headers.get("x-forwarded-for");

  if (xForwardedFor) {
    // Parse x-forwarded-for header which may contain comma-separated IPs
    // Format: client, proxy1, proxy2
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    return ips[0] || "unknown"; // Return first (original client) IP
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function sanitizeProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!properties || typeof properties !== "object") {
    return {};
  }

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth >= MAX_PROPERTY_DEPTH) {
      return "[Object too deep]";
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return value.length > MAX_STRING_LENGTH
        ? value.substring(0, MAX_STRING_LENGTH) + "..."
        : value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
    }

    if (typeof value === "object") {
      const sanitized: Record<string, unknown> = {};
      let count = 0;

      for (const [key, val] of Object.entries(
        value as Record<string, unknown>,
      )) {
        if (count >= MAX_PROPERTIES) break;

        // Sanitize key names
        const sanitizedKey = key
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .substring(0, 50);
        if (sanitizedKey.length > 0) {
          sanitized[sanitizedKey] = sanitizeValue(val, depth + 1);
          count++;
        }
      }
      return sanitized;
    }

    return String(value).substring(0, 100);
  }

  try {
    return sanitizeValue(properties, 0) as Record<string, unknown>;
  } catch (error) {
    console.error("Error sanitizing properties:", error);
    return null;
  }
}
