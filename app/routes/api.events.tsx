import { type ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
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
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
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

  // Generate or use client_id from properties
  const clientId = properties.client_id || generateClientId();

  const payload = {
    client_id: clientId,
    events: [
      {
        name: event,
        params: {
          ...properties,
          // Remove non-GA4 properties
          client_ip: undefined,
          server_side: undefined,
        },
      },
    ],
  };

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`GA4 API error: ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to send to GA4:", error);
    // Don't throw - just log and continue gracefully
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

function generateClientId(): string {
  // Generate a unique client ID for server-side events
  return `${Date.now()}.${Math.random().toString(36).substring(2)}`;
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
