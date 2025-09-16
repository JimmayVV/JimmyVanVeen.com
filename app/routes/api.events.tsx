import { type ActionFunctionArgs } from "react-router";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const body = await request.json();
    const { event, properties = {} } = body;

    if (!event) {
      return Response.json(
        { error: "Event name is required" },
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

    // Add server-side context
    const enrichedProperties = {
      ...properties,
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

function generateClientId(): string {
  // Generate a unique client ID for server-side events
  return `${Date.now()}.${Math.random().toString(36).substring(2)}`;
}
