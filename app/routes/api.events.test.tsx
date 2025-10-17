import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetForTesting, action } from "./api.events";

describe("Analytics API Route", () => {
  beforeEach(() => {
    // Reset provider initialization state
    __resetForTesting();

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

  describe("Analytics API Errors", () => {
    it("should handle API errors gracefully", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Analytics Server Error",
      } as Response);

      const request = createMockRequest("POST", {
        event: "page_view",
      });

      const response = await action({ request, params: {}, context: {} });

      // Should still return success to client
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
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
        event: "page_view",
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
  });
});
