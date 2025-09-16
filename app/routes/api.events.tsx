import { type ActionFunctionArgs } from "react-router";

import { generateClientId as sharedGenerateClientId } from "~/utils/client-id";

// Validate environment variables on first load
let hasValidated = false;
function validateEnvironment() {
  if (hasValidated) return;
  hasValidated = true;

  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId && !apiSecret) {
    console.log(
      "GA4 environment variables not configured - analytics will be disabled",
    );
    return;
  }

  if (measurementId && !/^G-[A-Z0-9]{10}$/.test(measurementId)) {
    console.error("Invalid GA4_MEASUREMENT_ID format - should be G-XXXXXXXXXX");
  }

  if (apiSecret && !/^[A-Za-z0-9_-]{20,}$/.test(apiSecret)) {
    console.error(
      "Invalid GA4_API_SECRET format - should be a valid API secret",
    );
  }

  if (measurementId && apiSecret) {
    console.log("GA4 analytics configured and ready");
  } else {
    console.warn(
      "Partial GA4 configuration - both GA4_MEASUREMENT_ID and GA4_API_SECRET are required",
    );
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Validate environment on first request
  validateEnvironment();

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    // Validate content length to prevent memory exhaustion
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10000) {
      // 10KB limit
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

    // Send to analytics provider (GA4 for now)
    await sendToAnalyticsProvider(event, enrichedProperties);

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

async function sendToAnalyticsProvider(
  event: string,
  properties: Record<string, unknown>,
) {
  // For now, just use GA4. Easy to swap providers later by changing this function
  return sendToGA4(event, properties);
}

async function sendToGA4(event: string, properties: Record<string, unknown>) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    console.log(
      "GA4 credentials not configured, skipping analytics event:",
      event,
    );
    return;
  }

  // Validate GA4 measurement ID format (G-XXXXXXXXXX)
  if (!/^G-[A-Z0-9]{10}$/.test(measurementId)) {
    console.error("Invalid GA4_MEASUREMENT_ID format:", measurementId);
    return;
  }

  // Validate API secret format (base64-like string)
  if (!/^[A-Za-z0-9_-]{20,}$/.test(apiSecret)) {
    console.error("Invalid GA4_API_SECRET format");
    return;
  }

  // Generate or use client_id from properties
  const clientId = properties.client_id || generateClientId();

  // GA4 Measurement Protocol constraints and configuration
  const GA4_CONSTRAINTS = {
    MAX_PARAM_LENGTH: 40, // GA4 parameter names cannot exceed 40 characters
    MAX_STRING_VALUE_LENGTH: 500, // GA4 custom parameter values limited to 500 chars
    MAX_ARRAY_ITEMS: 100, // GA4 array parameters limited to 100 items
  } as const;

  const INTERNAL_PROPERTIES = new Set([
    "client_ip",
    "server_side",
    "client_id",
  ]);

  // Pre-compile regex for better performance in high-traffic scenarios
  const PARAM_NAME_SANITIZER = /[^a-zA-Z0-9_]/g;

  // Clean up properties for GA4 Measurement Protocol compatibility
  const cleanParams: Record<
    string,
    string | number | boolean | (string | number | boolean)[]
  > = {};

  for (const [key, value] of Object.entries(properties)) {
    // Skip internal server-side properties that shouldn't go to GA4
    if (INTERNAL_PROPERTIES.has(key)) {
      continue;
    }

    // Sanitize parameter name: alphanumeric + underscore only, max 40 chars
    // GA4 requires parameter names to follow strict naming conventions
    const cleanKey = key
      .replace(PARAM_NAME_SANITIZER, "_")
      .substring(0, GA4_CONSTRAINTS.MAX_PARAM_LENGTH);

    // Skip empty keys after sanitization
    if (!cleanKey) continue;

    // Sanitize parameter value based on type
    let cleanValue: string | number | boolean | (string | number | boolean)[];

    if (typeof value === "string") {
      // GA4 custom parameters limited to 500 characters
      cleanValue =
        value.length > GA4_CONSTRAINTS.MAX_STRING_VALUE_LENGTH
          ? value.substring(0, GA4_CONSTRAINTS.MAX_STRING_VALUE_LENGTH)
          : value;
    } else if (typeof value === "number" || typeof value === "boolean") {
      // Numbers and booleans are supported directly
      cleanValue = value;
    } else if (Array.isArray(value)) {
      // GA4 arrays limited to 100 items, ensure all items are primitive types
      cleanValue = value
        .slice(0, GA4_CONSTRAINTS.MAX_ARRAY_ITEMS)
        .filter(
          (item) =>
            typeof item === "string" ||
            typeof item === "number" ||
            typeof item === "boolean",
        );
    } else if (typeof value === "object" && value !== null) {
      // GA4 doesn't support nested objects, convert to string representation
      cleanValue = JSON.stringify(value).substring(
        0,
        GA4_CONSTRAINTS.MAX_STRING_VALUE_LENGTH,
      );
    } else {
      // Fallback for other types - convert to string
      cleanValue = String(value).substring(
        0,
        GA4_CONSTRAINTS.MAX_STRING_VALUE_LENGTH,
      );
    }

    cleanParams[cleanKey] = cleanValue;
  }

  // Map custom analytics events to GA4 standard events for better reporting
  // Reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
  const GA4_EVENT_MAPPING: Record<string, string> = {
    // Core events
    page_view: "page_view",

    // User interaction events
    click: "click",
    scroll: "scroll",
    search: "search",

    // Error and performance events
    error: "exception",
    timing: "timing_complete",

    // Content engagement events
    file_download: "file_download",
    video_start: "video_start",
    video_progress: "video_progress",
    video_complete: "video_complete",

    // Form events
    form_start: "form_start",
    form_submit: "form_submit",

    // E-commerce events (future-proofing)
    purchase: "purchase",
    add_to_cart: "add_to_cart",

    // Custom user events
    user_identify: "user_engagement",
  };

  const payload = {
    client_id: clientId,
    events: [
      {
        name: GA4_EVENT_MAPPING[event] || event,
        params: cleanParams,
      },
    ],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  const isDebugMode = process.env.GA4_DEBUG === "true";

  try {
    if (isDebugMode) {
      console.log("Sending to GA4:", JSON.stringify(payload, null, 2));
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`GA4 API error: ${response.status} - ${responseText}`);
      throw new Error(`GA4 API error: ${response.status}`);
    }

    if (isDebugMode) {
      console.log("Successfully sent to GA4");
    }
  } catch (error) {
    console.error("Failed to send to GA4:", error);
    // Graceful degradation: Analytics failures should never impact user experience
    // We log the error for monitoring but don't throw to avoid breaking the main request
    return;
  }
}

// Simple in-memory rate limiter for serverless environment
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

async function isRateLimited(clientIP: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 60; // 60 requests per minute

  // Clean up expired entries
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }

  // Prevent memory exhaustion in high-traffic scenarios
  if (rateLimitMap.size > 1000) {
    // Keep only recent entries
    const sortedEntries = Array.from(rateLimitMap.entries())
      .sort((a, b) => b[1].resetTime - a[1].resetTime)
      .slice(0, 500);
    rateLimitMap.clear();
    sortedEntries.forEach(([k, v]) => rateLimitMap.set(k, v));
  }

  const clientData = rateLimitMap.get(clientIP);

  if (!clientData) {
    // First request from this IP
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (now > clientData.resetTime) {
    // Reset window
    rateLimitMap.set(clientIP, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (clientData.count >= maxRequests) {
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

function generateClientId(): string {
  // Use shared client ID generation with enhanced entropy
  return sharedGenerateClientId();
}

function sanitizeProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!properties || typeof properties !== "object") {
    return {};
  }

  const maxProperties = 20;
  const maxStringLength = 500;
  const maxDepth = 3;

  function sanitizeValue(value: unknown, depth: number): unknown {
    if (depth >= maxDepth) {
      return "[Object too deep]";
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "string") {
      return value.length > maxStringLength
        ? value.substring(0, maxStringLength) + "..."
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
        if (count >= maxProperties) break;

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
