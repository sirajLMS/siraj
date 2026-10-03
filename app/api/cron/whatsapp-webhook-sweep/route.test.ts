import { beforeEach, describe, expect, mock, test } from "bun:test";

const { NextRequest: NextRequestImpl, NextResponse } = await import("next/server");

// --- Mock logger ---

const noop = () => {};
await mock.module("@/backend/lib/logger", () => ({
  logger: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
  default: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
}));

// --- Mock cron-auth ---

const TEST_SECRET = "test-cron-secret-1234567890abcdef";
await mock.module("@/backend/lib/cron-auth", () => {
  const verifyCronSecretAuth = (request: { method: string; headers: Headers }) => {
    if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
      return { authorized: false, response: NextResponse.json({ error: "Server misconfigured" }, { status: 500 }) };
    }
    const auth = request.headers.get("authorization");
    if (request.method !== "GET")
      return { authorized: false, response: NextResponse.json({ error: "Method not allowed" }, { status: 405 }) };
    if (auth === `Bearer ${TEST_SECRET}`) return { authorized: true };
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  };

  const withCronAuth = (handler: (req: unknown) => Promise<Response>) => {
    return async (request: { method: string; headers: Headers }) => {
      const result = verifyCronSecretAuth(request);
      if (!result.authorized) return result.response;
      return handler(request);
    };
  };

  return { verifyCronSecretAuth, withCronAuth };
});

// --- Mock WhatsappWebhookHandler ---

const mockSweepPendingWebhookEvents = mock(async () => ({
  claimed: 10,
  processed: 8,
  failed: 1,
  parked: 1,
}));

await mock.module("@/backend/services/whatsapp", () => ({
  WhatsappWebhookHandler: {
    sweepPendingWebhookEvents: mockSweepPendingWebhookEvents,
  },
}));

// --- Mock backend/services error helpers ---

await mock.module("@/backend/services", () => ({
  formatError: (err: unknown) => (err instanceof Error ? err.message : String(err)),
  getCronErrorT: () => ({
    whatsappWebhookSweepFailed: "WhatsApp webhook sweep failed",
  }),
}));

// --- Import the route under test (after all mocks are registered) ---

const { GET } = await import("@/app/api/cron/whatsapp-webhook-sweep/route");

// --- Helpers ---

function makeRequest(url: string, method = "GET", headers: Record<string, string | null> = {}) {
  const headersInit = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null) headersInit.set(key, value);
  }
  return new NextRequestImpl(url, { method, headers: headersInit });
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  return await response.json();
}

const BASE_URL = "http://localhost:3000/api/cron/whatsapp-webhook-sweep";

// --- Tests ---

describe("GET /api/cron/whatsapp-webhook-sweep", () => {
  beforeEach(() => {
    mockSweepPendingWebhookEvents.mockClear();
  });

  test("returns 401 without valid auth", async () => {
    const request = makeRequest(BASE_URL, "GET", { authorization: null });
    const response = await GET(request);
    expect(response.status).toBe(401);
    expect(mockSweepPendingWebhookEvents).toHaveBeenCalledTimes(0);
  });

  test("returns 405 for non-GET methods", async () => {
    const request = makeRequest(BASE_URL, "POST", { authorization: `Bearer ${TEST_SECRET}` });
    const response = await GET(request);
    expect(response.status).toBe(405);
    expect(mockSweepPendingWebhookEvents).toHaveBeenCalledTimes(0);
  });

  test("happy path: calls sweepPendingWebhookEvents and returns 200 JSON result", async () => {
    const request = makeRequest(BASE_URL, "GET", { authorization: `Bearer ${TEST_SECRET}` });
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(mockSweepPendingWebhookEvents).toHaveBeenCalledTimes(1);

    const body = await parseJson(response);
    expect(body).toEqual({
      claimed: 10,
      processed: 8,
      failed: 1,
      parked: 1,
    });
  });

  test("returns 500 when sweepPendingWebhookEvents throws", async () => {
    mockSweepPendingWebhookEvents.mockRejectedValueOnce(new Error("Sweeper lock error"));

    const request = makeRequest(BASE_URL, "GET", { authorization: `Bearer ${TEST_SECRET}` });
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await parseJson(response);
    expect(body).toEqual({
      success: false,
      error: "WhatsApp webhook sweep failed",
    });
  });
});
