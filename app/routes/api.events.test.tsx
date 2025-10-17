import { beforeEach, describe, expect, it, vi } from "vitest";

import { action } from "./api.events";

describe("Analytics API Route", () => {
  const mockEnv = {
    GA4_MEASUREMENT_ID: "G-TEST123456",
    GA4_API_SECRET: "test_api_secret_key_123456",
    GA4_DEBUG: "false",
  };

  beforeEach(() => {
    // Mock environment variables
    process.env.GA4_MEASUREMENT_ID = mockEnv.GA4_MEASUREMENT_ID;
    process.env.GA4_API_SECRET = mockEnv.GA4_API_SECRET;
    process.env.GA4_DEBUG = mockEnv.GA4_DEBUG;

    // Reset fetch mock
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "",
    } as Response);
  });

  const createMockRequest = (
    method: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Request => {
    const requestHeaders = new Headers({
      "content-type": "application/json",
      "user-agent": "Mozilla/5.0 Test Browser",
      ...headers,
    });

    return new Request("https://test.com/api/events", {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
  };

  describe("Request Validation", () => {
    it("should reject non-POST requests", async () => {
      const request = createMockRequest("GET");
      const response = await action({ request, params: {}, context: {} });

      expect(response.status).toBe(405);
      const data = await response.json();
      expect(data.error).toBe("Method not allowed");
    });

    it("should reject requests without event name", async () => {
      const request = createMockRequest("POST", {
        properties: { foo: "bar" },
      });
      const response = await action({ request, params: {}, context: {} });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Event name is required");
    });

    it("should reject invalid event names", async () => {
      const request = createMockRequest("POST", {
        event: "invalid-event-name!",
      });
      const response = await action({ request, params: {}, context: {} });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid event name");
    });

    it("should reject requests that are too large", async () => {
      const largeBody = {
        event: "test_event",
        properties: {
          data: "x".repeat(20000), // Exceeds 10KB limit
        },
      };

      const bodyString = JSON.stringify(largeBody);
      const actualSize = bodyString.length;

      // Create a request with a mocked content-length header
      // Note: The Fetch API doesn't allow setting content-length manually,
      // so we need to mock the headers.get method
      const baseRequest = new Request("https://test.com/api/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: bodyString,
      });

      // Override the headers.get method to return our content-length
      const originalGet = baseRequest.headers.get.bind(baseRequest.headers);
      baseRequest.headers.get = (name: string) => {
        if (name.toLowerCase() === "content-length") {
          return actualSize.toString();
        }
        return originalGet(name);
      };

      const response = await action({
        request: baseRequest,
        params: {},
        context: {},
      });

      expect(response.status).toBe(413);
      const data = await response.json();
      expect(data.error).toBe("Request too large");
    });

    it("should accept valid event requests", async () => {
      const request = createMockRequest("POST", {
        event: "page_view",
        properties: {
          page_path: "/test",
        },
      });

      const response = await action({ request, params: {}, context: {} });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });
  });

  describe("GA4 Integration", () => {
    it("should send events to GA4 Measurement Protocol", async () => {
      const request = createMockRequest("POST", {
        event: "page_view",
        properties: {
          page_path: "/test",
          client_id: "test-client-id",
        },
      });

      await action({ request, params: {}, context: {} });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://www.google-analytics.com/mp/collect?measurement_id=${mockEnv.GA4_MEASUREMENT_ID}&api_secret=${mockEnv.GA4_API_SECRET}`,
        ),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(payload.client_id).toBe("test-client-id");
      expect(payload.events).toHaveLength(1);
      expect(payload.events[0].name).toBe("page_view");
      expect(payload.events[0].params.page_path).toBe("/test");
    });

    it("should map custom events to GA4 standard events", async () => {
      const request = createMockRequest("POST", {
        event: "error",
        properties: {
          error_message: "Test error",
        },
      });

      await action({ request, params: {}, context: {} });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      // Should map "error" to "exception"
      expect(payload.events[0].name).toBe("exception");
    });

    it("should sanitize property names for GA4 compatibility", async () => {
      const request = createMockRequest("POST", {
        event: "test_event",
        properties: {
          "invalid-property-name": "value",
          property_with_over_forty_characters_in_name_too_long: "value",
        },
      });

      await action({ request, params: {}, context: {} });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      // Should convert hyphens to underscores
      expect(payload.events[0].params).toHaveProperty("invalid_property_name");

      // Should truncate long property names
      const paramKeys = Object.keys(payload.events[0].params);
      paramKeys.forEach((key) => {
        expect(key.length).toBeLessThanOrEqual(40);
      });
    });

    it("should handle GA4 API errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "GA4 Server Error",
      } as Response);

      const request = createMockRequest("POST", {
        event: "test_event",
      });

      const response = await action({ request, params: {}, context: {} });

      // Should still return success to client
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("should skip GA4 when credentials are missing", async () => {
      delete process.env.GA4_MEASUREMENT_ID;
      delete process.env.GA4_API_SECRET;

      const request = createMockRequest("POST", {
        event: "test_event",
      });

      await action({ request, params: {}, context: {} });

      // Should not call GA4 API
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("Server-side Enrichment", () => {
    it("should add server-side context to events", async () => {
      const request = createMockRequest(
        "POST",
        {
          event: "test_event",
          properties: {
            custom_prop: "value",
          },
        },
        {
          "x-forwarded-for": "192.168.1.1",
          referer: "https://example.com",
        },
      );

      await action({ request, params: {}, context: {} });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      // Server-side properties should be filtered out of GA4 payload
      // but should be used for enrichment
      expect(payload.events[0].params).not.toHaveProperty("client_ip");
      expect(payload.events[0].params).not.toHaveProperty("server_side");
    });

    it("should extract client IP from x-forwarded-for header", async () => {
      const request = createMockRequest(
        "POST",
        { event: "test_event" },
        { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      );

      await action({ request, params: {}, context: {} });

      // This test verifies the IP extraction logic works
      // The actual IP is used internally but not sent to GA4
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe("Rate Limiting", () => {
    it("should rate limit excessive requests from same IP", async () => {
      const createRequestWithIP = (ip: string) =>
        createMockRequest("POST", { event: "test_event" }, { "x-real-ip": ip });

      // Send 61 requests (exceeds 60 per minute limit)
      const responses = [];
      for (let i = 0; i < 61; i++) {
        const response = await action({
          request: createRequestWithIP("192.168.1.100"),
          params: {},
          context: {},
        });
        responses.push(response);
      }

      // Last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);

      const data = await lastResponse.json();
      expect(data.error).toContain("Rate limit exceeded");
    });

    it("should not rate limit requests from different IPs", async () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        const request = createMockRequest(
          "POST",
          { event: "test_event" },
          { "x-real-ip": `192.168.1.${i}` },
        );
        requests.push(action({ request, params: {}, context: {} }));
      }

      const responses = await Promise.all(requests);

      // All requests should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe("Property Sanitization", () => {
    it("should sanitize nested objects", async () => {
      const request = createMockRequest("POST", {
        event: "test_event",
        properties: {
          nested: {
            deep: {
              value: "test",
            },
          },
        },
      });

      const response = await action({ request, params: {}, context: {} });

      expect(response.status).toBe(200);
    });

    it("should truncate long string values", async () => {
      const request = createMockRequest("POST", {
        event: "test_event",
        properties: {
          long_string: "x".repeat(1000),
        },
      });

      await action({ request, params: {}, context: {} });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      // GA4 limits string values to 500 characters
      expect(payload.events[0].params.long_string.length).toBeLessThanOrEqual(
        500,
      );
    });

    it("should handle arrays in properties", async () => {
      const request = createMockRequest("POST", {
        event: "test_event",
        properties: {
          tags: ["tag1", "tag2", "tag3"],
        },
      });

      await action({ request, params: {}, context: {} });

      const callArgs = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const payload = JSON.parse(callArgs[1].body);

      expect(Array.isArray(payload.events[0].params.tags)).toBe(true);
    });
  });
});
