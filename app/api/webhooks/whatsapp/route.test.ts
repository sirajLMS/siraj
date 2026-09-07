import { beforeEach, describe, expect, mock, test } from "bun:test";
import crypto from "node:crypto";
import type { NextRequest } from "next/server";

// Import the real NextRequest and NextResponse from the actual module.
// We override `after` in the mock below while preserving the real constructors.
const NextServerModule = await import("next/server");
const RealNextRequest = NextServerModule.NextRequest;
const RealNextResponse = NextServerModule.NextResponse;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_APP_SECRET = "test-app-secret-1234567890abcdef";
const TEST_VERIFY_TOKEN = "test-verify-token-abcdef123456";

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/whatsapp";

// ---------------------------------------------------------------------------
// Mock state
// ---------------------------------------------------------------------------

type WebhookChangeValue = {
  messages?: unknown[];
  statuses?: unknown[];
  messaging_product?: string;
  phone_number_id?: string;
  [key: string]: unknown;
};

const processPendingEventsMock = mock(
  async (_limit?: number): Promise<{ claimed: number; processed: number; failed: number }> => ({
    claimed: 0,
    processed: 0,
    failed: 0,
  })
);
const persistWebhookChangesMock = mock(
  async (_body: unknown, _hash: string): Promise<{ inserted: number; skippedReplay: boolean }> => ({
    inserted: 1,
    skippedReplay: false,
  })
);

const loggerWarnMock = mock((_msg: string, _meta?: Record<string, unknown>) => {});
const loggerErrorMock = mock((_msg: string, _meta?: Record<string, unknown>) => {});
const loggerInfoMock = mock((_msg: string, _meta?: Record<string, unknown>) => {});
const loggerDebugMock = mock((_msg: string, _meta?: Record<string, unknown>) => {});
const loggerLogMock = mock((_msg: string, _meta?: Record<string, unknown>) => {});

// Capture arguments passed to `after()` so we can verify deferred behaviour.
let afterCallback: (() => Promise<void>) | null = null;

// Configurable rate-limit result — tests can override to simulate 429.
let rateLimitSuccess = true;
// Configurable env token — tests can override to simulate missing config / 500.
let envVerifyToken: string | undefined = TEST_VERIFY_TOKEN;
// Configurable app secret — tests can override to simulate missing config / 500.
let envAppSecret: string | undefined = TEST_APP_SECRET;

// ---------------------------------------------------------------------------
// Mocks — must register before SUT import
// ---------------------------------------------------------------------------

// Mock `after` from next/server to execute synchronously (capture + invoke).
// We store the callback so tests can explicitly await it after the route returns.
// Real NextRequest and NextResponse constructors are preserved so the route can
// use `new NextResponse(...)` exactly as in production.
await mock.module("next/server", () => {
  return {
    after: (cb: () => Promise<void>) => {
      afterCallback = cb;
    },
    NextRequest: RealNextRequest,
    NextResponse: RealNextResponse,
  };
});

await mock.module("@/backend/services/system", () => ({
  resolveEnvConfig: async (key: string): Promise<string | undefined> => {
    switch (key) {
      case "WHATSAPP_APP_SECRET":
        return envAppSecret;
      case "WHATSAPP_VERIFY_TOKEN":
        return envVerifyToken;
      default:
        return undefined;
    }
  },
  invalidateEnvConfigCache: () => {},
  resolveEnvConfigMany: async () => ({}),
  setEnvConfig: async () => {},
  clearEnvConfigCache: () => {},
  // The whatsapp services barrel evaluates whatsapp-config.service (which
  // imports the env-config write path) — keep the factory in sync with the
  // real module surface in environment-config.service.ts. The webhook route
  // itself never invokes these.
  upsertEnvConfigOverride: async () => ({}),
  deleteEnvConfigOverride: async () => ({}),
  auditEnvConfigChange: async () => {},
}));

await mock.module("@/backend/lib/ratelimit", () => ({
  apiRateLimiter: {},
  checkRateLimit: async () => ({
    success: rateLimitSuccess,
    limit: 60,
    remaining: rateLimitSuccess ? 59 : 0,
    reset: Date.now() + 60000,
  }),
  getClientIdentifier: (request: Request): string => request.headers.get("x-forwarded-for") ?? "127.0.0.1",
}));

await mock.module("@/backend/services/whatsapp/whatsapp-webhook.handler", () => ({
  WhatsappWebhookHandler: {
    processPendingWebhookEvents: processPendingEventsMock,
  },
}));

await mock.module("@/backend/services/whatsapp/whatsapp-webhook-ingest.helpers", () => ({
  persistWebhookChanges: persistWebhookChangesMock,
  isRecord: (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value),
  isValidWamid: (vamid: unknown): boolean =>
    typeof vamid === "string" && vamid.length >= 8 && vamid.length <= 128 && /^(?=.*[a-zA-Z0-9])[\w.-]+$/.test(vamid),
  toSafeString: (value: unknown): string | undefined =>
    typeof value === "string" && value.length > 0 ? value : undefined,
  resolveAccountByPhoneNumberId: async () => null,
  resolveLifecycleAccount: async () => null,
  collectEventRows: () => [],
  WEBHOOK_REPLAY_WINDOW_MS: 5 * 60 * 1000,
}));

await mock.module("@/backend/lib/logger", () => ({
  logger: {
    log: loggerLogMock,
    info: loggerInfoMock,
    warn: loggerWarnMock,
    error: loggerErrorMock,
    debug: loggerDebugMock,
  },
  default: {
    log: loggerLogMock,
    info: loggerInfoMock,
    warn: loggerWarnMock,
    error: loggerErrorMock,
    debug: loggerDebugMock,
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeHmac(body: string, secret: string = TEST_APP_SECRET): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
}

/** Narrow an unknown mock argument to a record for assertions. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildWebhookBody(messagesIncluded = false): string {
  const value: WebhookChangeValue = {
    messaging_product: "whatsapp",
    phone_number_id: "987654321",
    statuses: [
      {
        id: "wamid.test123",
        status: "delivered",
        timestamp: "1700000000",
        recipient_id: "1234567890",
      },
    ],
  };

  if (messagesIncluded) {
    value.messages = [
      {
        from: "1234567890",
        id: "wamid.inbound1",
        text: { body: "hello" },
        timestamp: "1700000001",
        type: "text",
      },
    ];
  }

  const entry = {
    id: "123456789",
    changes: [
      {
        field: "messages",
        value,
      },
    ],
  };

  return JSON.stringify({
    object: "whatsapp_business_account",
    entry: [entry],
  });
}

function makePostRequest(body: string, headers: Record<string, string>): NextRequest {
  const headerInit = new Headers();
  for (const [k, v] of Object.entries(headers)) {
    headerInit.set(k, v);
  }
  return new RealNextRequest(WEBHOOK_URL, {
    method: "POST",
    headers: headerInit,
    body,
  });
}

function makeGetRequest(params: Record<string, string> = {}, headers: Record<string, string> = {}): NextRequest {
  const url = new URL(WEBHOOK_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const headerInit = new Headers();
  for (const [k, v] of Object.entries(headers)) {
    headerInit.set(k, v);
  }
  return new RealNextRequest(url.toString(), {
    method: "GET",
    headers: headerInit,
  });
}

function makeSignedPostRequest(body: string, customHeaders: Record<string, string> = {}): NextRequest {
  const signature = computeHmac(body);
  return makePostRequest(body, {
    "content-type": "application/json",
    "x-hub-signature-256": signature,
    "content-length": String(Buffer.byteLength(body)),
    ...customHeaders,
  });
}

async function assertPostRejected(
  POST: (request: NextRequest) => Promise<Response>,
  req: NextRequest,
  expectedStatus: number
): Promise<Response> {
  const res = await POST(req);
  expect(res.status).toBe(expectedStatus);
  expect(afterCallback).toBeNull();
  // No durable event rows may be written for a rejected request (S2 cover).
  expect(processPendingEventsMock).toHaveBeenCalledTimes(0);
  expect(persistWebhookChangesMock).toHaveBeenCalledTimes(0);
  return res;
}

async function assertGetForbidden(
  GET: (request: NextRequest) => Promise<Response>,
  params: Record<string, string>
): Promise<Response> {
  const req = makeGetRequest(params);
  const res = await GET(req);
  expect(res.status).toBe(403);
  expect(afterCallback).toBeNull();
  return res;
}

async function importRoute() {
  return import("./route");
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  processPendingEventsMock.mockClear();
  processPendingEventsMock.mockResolvedValue({ claimed: 0, processed: 0, failed: 0 });
  persistWebhookChangesMock.mockClear();
  persistWebhookChangesMock.mockResolvedValue({ inserted: 1, skippedReplay: false });
  loggerWarnMock.mockClear();
  loggerErrorMock.mockClear();
  loggerInfoMock.mockClear();
  loggerDebugMock.mockClear();
  loggerLogMock.mockClear();
  afterCallback = null;
  rateLimitSuccess = true;
  envVerifyToken = TEST_VERIFY_TOKEN;
  envAppSecret = TEST_APP_SECRET;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/webhooks/whatsapp", () => {
  test("HMAC positive: valid signature returns 200", async () => {
    const { POST } = await importRoute();
    const rawBody = buildWebhookBody(false);
    const signature = computeHmac(rawBody);

    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
      "content-length": String(Buffer.byteLength(rawBody)),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);

    // Durable rows were persisted BEFORE the 200 (persist-first).
    expect(persistWebhookChangesMock).toHaveBeenCalledTimes(1);
    const call = persistWebhookChangesMock.mock.calls[0];
    expect(call).toBeDefined();
    expect(isRecord(call?.[0])).toBe(true);
    expect(call?.[1]).toHaveLength(64);

    // The deferred durable worker was registered via after().
    expect(afterCallback).not.toBeNull();
    await afterCallback?.();
    expect(processPendingEventsMock).toHaveBeenCalledTimes(1);
  });

  test("HMAC negative: invalid signature returns 401 and logs safe metadata only (S2)", async () => {
    const { POST } = await importRoute();
    const bodyContains = "This is the raw webhook body that must never be logged";
    const rawBodyWithSensitive = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [{ id: "1", changes: [{ field: "messages", value: { secret: bodyContains } }] }],
    });

    const req = makePostRequest(rawBodyWithSensitive, {
      "content-type": "application/json",
      "x-hub-signature-256": "sha256=deadbeef0000000000000000000000000000000000000000000000000000ffff",
      "content-length": String(Buffer.byteLength(rawBodyWithSensitive)),
    });

    const res = await POST(req);

    expect(res.status).toBe(401);

    // S2: logger.warn must have been called on HMAC mismatch.
    expect(loggerWarnMock).toHaveBeenCalled();

    // S2: The logged metadata must NOT contain the raw body or any sensitive content.
    const warnCalls = loggerWarnMock.mock.calls;
    const hmacMismatchCall = warnCalls.find(([msg]) => msg.includes("HMAC signature mismatch"));
    expect(hmacMismatchCall).toBeDefined();

    const loggedMeta = hmacMismatchCall?.[1] ?? {};
    const metaJson = JSON.stringify(loggedMeta);
    // The raw body content must never appear in the log output.
    expect(metaJson).not.toContain(bodyContains);
    // Safe metadata fields should be present.
    expect(loggedMeta).toHaveProperty("ip");
    expect(loggedMeta).toHaveProperty("userAgent");
    expect(loggedMeta).toHaveProperty("contentLength");

    // The handler must NOT have been called on HMAC failure, and no event rows.
    expect(afterCallback).toBeNull();
    expect(processPendingEventsMock).toHaveBeenCalledTimes(0);
    expect(persistWebhookChangesMock).toHaveBeenCalledTimes(0);
  });

  test("Body-size cap: Content-Length > 1MB returns 413", async () => {
    const { POST } = await importRoute();
    const rawBody = buildWebhookBody(false);
    const signature = computeHmac(rawBody);

    const oversizedContentLength = String(1024 * 1024 + 1); // 1 MB + 1 byte

    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
      "content-length": oversizedContentLength,
    });

    const res = await POST(req);

    expect(res.status).toBe(413);

    // Handler must not be called.
    expect(afterCallback).toBeNull();
    expect(processPendingEventsMock).toHaveBeenCalledTimes(0);
    expect(persistWebhookChangesMock).toHaveBeenCalledTimes(0);
  });

  test("Identical-body retry inside the replay window is acked but persists no rows", async () => {
    const { POST } = await importRoute();
    persistWebhookChangesMock.mockResolvedValueOnce({ inserted: 0, skippedReplay: true });
    const rawBody = buildWebhookBody(true);
    const signature = computeHmac(rawBody);

    const res = await POST(
      makePostRequest(rawBody, {
        "content-type": "application/json",
        "x-hub-signature-256": signature,
        "content-length": String(Buffer.byteLength(rawBody)),
      })
    );

    expect(res.status).toBe(200);
    expect(persistWebhookChangesMock).toHaveBeenCalledTimes(1);
    await afterCallback?.();
    expect(processPendingEventsMock).toHaveBeenCalledTimes(1);
  });

  test("Inbound messages[] are NOT stripped — the full change is persisted durably", async () => {
    const { POST } = await importRoute();
    const rawBody = buildWebhookBody(true); // body includes value.messages[]
    const signature = computeHmac(rawBody);

    const res = await POST(
      makePostRequest(rawBody, {
        "content-type": "application/json",
        "x-hub-signature-256": signature,
        "content-length": String(Buffer.byteLength(rawBody)),
      })
    );

    expect(res.status).toBe(200);
    // The exact parsed body reaches the durable store — messages survive.
    const persistedBody = persistWebhookChangesMock.mock.calls[0]?.[0];
    expect(isRecord(persistedBody)).toBe(true);
    const entry = isRecord(persistedBody) && Array.isArray(persistedBody.entry) ? persistedBody.entry[0] : null;
    const changes = isRecord(entry) && Array.isArray(entry.changes) ? entry.changes : [];
    const changeValue = isRecord(changes[0]) && isRecord(changes[0].value) ? changes[0].value : {};
    expect(changeValue.messages).toEqual([expect.objectContaining({ id: "wamid.inbound1" })]);
    await afterCallback?.();
    expect(processPendingEventsMock).toHaveBeenCalledTimes(1);
  });

  test("End-to-end: valid HMAC → durable persist BEFORE 200 → deferred worker runs", async () => {
    const { POST } = await importRoute();
    const rawBody = buildWebhookBody(true); // body includes value.messages[]
    const signature = computeHmac(rawBody);

    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
      "content-length": String(Buffer.byteLength(rawBody)),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(afterCallback).not.toBeNull();

    await afterCallback?.();

    // Worker claimed the queue once; the full parsed body was persisted first.
    expect(processPendingEventsMock).toHaveBeenCalledTimes(1);
    expect(persistWebhookChangesMock).toHaveBeenCalledTimes(1);
    const persistedBody = persistWebhookChangesMock.mock.calls[0]?.[0];
    expect(isRecord(persistedBody) && persistedBody.object).toBe("whatsapp_business_account");
  });

  test("Durable persist failure returns 503 (Meta retries) — no after() kick", async () => {
    const { POST } = await importRoute();
    persistWebhookChangesMock.mockRejectedValueOnce(new Error("db down"));
    const rawBody = buildWebhookBody(false);

    const req = makeSignedPostRequest(rawBody);
    const res = await POST(req);

    expect(res.status).toBe(503);
    expect(afterCallback).toBeNull();
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  // r10-021: POST error-path edge cases
  test("Malformed JSON body returns 400", async () => {
    const { POST } = await importRoute();
    const malformedBody = "{ this is not valid json";
    const req = makeSignedPostRequest(malformedBody);
    await assertPostRejected(POST, req, 400);
  });

  test("Missing WHATSAPP_APP_SECRET env returns 500", async () => {
    const { POST } = await importRoute();
    envAppSecret = undefined;
    const rawBody = buildWebhookBody(false);
    const req = makeSignedPostRequest(rawBody);
    await assertPostRejected(POST, req, 500);
    expect(loggerErrorMock).toHaveBeenCalled();
  });

  test("object !== 'whatsapp_business_account' returns 404", async () => {
    const { POST } = await importRoute();
    const rawBody = JSON.stringify({ object: "page", entry: [] });
    const req = makeSignedPostRequest(rawBody);
    await assertPostRejected(POST, req, 404);
  });

  test("POST with rate limit exceeded returns 429", async () => {
    const { POST } = await importRoute();
    rateLimitSuccess = false;
    const rawBody = buildWebhookBody(false);
    const req = makeSignedPostRequest(rawBody);
    await assertPostRejected(POST, req, 429);
  });

  test("Malformed signature header without sha256= prefix returns 401", async () => {
    const { POST } = await importRoute();
    const rawBody = buildWebhookBody(false);
    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": "invalidsig-without-prefix",
      "content-length": String(Buffer.byteLength(rawBody)),
    });
    await assertPostRejected(POST, req, 401);
  });

  // r10-022: Actual-body-size boundary tests
  test("Actual body size > MAX_BODY_SIZE with spoofed Content-Length returns 413", async () => {
    const { POST } = await importRoute();
    // Build a body larger than 1MB by padding with whitespace (valid JSON, large size)
    const padding = " ".repeat(1024 * 1024 + 100);
    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [],
      padding,
    });
    // Spoof Content-Length to a small value to bypass pre-read check
    const spoofedContentLength = "100";

    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": computeHmac(rawBody),
      "content-length": spoofedContentLength,
    });

    const res = await POST(req);

    // Post-read Buffer.byteLength check catches the oversized body
    expect(res.status).toBe(413);
    expect(afterCallback).toBeNull();
    expect(processPendingEventsMock).toHaveBeenCalledTimes(0);
    expect(persistWebhookChangesMock).toHaveBeenCalledTimes(0);
  });

  test("Body at exactly 1MB boundary is accepted (not 413)", async () => {
    const { POST } = await importRoute();
    // Build a body just under 1MB to verify the boundary check accepts it
    const targetSize = 1024 * 1024 - 100; // Just under 1MB to avoid JSON overhead issues
    const padding = " ".repeat(targetSize - 200);
    const rawBody = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [
        {
          id: "123456789",
          changes: [{ field: "messages", value: { statuses: [], padding } }],
        },
      ],
    });
    // Verify we're under the 1MB boundary
    const actualSize = Buffer.byteLength(rawBody, "utf-8");
    expect(actualSize).toBeLessThanOrEqual(1024 * 1024);

    const signature = computeHmac(rawBody);
    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
    });

    const res = await POST(req);

    // Body under 1MB should pass (check is > not >=)
    expect(res.status).not.toBe(413);
    expect(afterCallback).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GET: Webhook Verification Handshake
// ---------------------------------------------------------------------------

describe("GET /api/webhooks/whatsapp", () => {
  test("200 success: valid hub.mode=subscribe, correct verify_token, valid challenge", async () => {
    const { GET } = await importRoute();
    const challenge = "1234567890";

    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": TEST_VERIFY_TOKEN,
      "hub.challenge": challenge,
    });

    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain");
    const body = await res.text();
    expect(body).toBe(challenge);
  });

  test("403 invalid mode: hub.mode not subscribe", async () => {
    const { GET } = await importRoute();
    await assertGetForbidden(GET, {
      "hub.mode": "unsubscribe",
      "hub.verify_token": TEST_VERIFY_TOKEN,
      "hub.challenge": "[PHONE_REDACTED]",
    });
    expect(loggerWarnMock).toHaveBeenCalled();
  });

  test("403 invalid token: verify_token mismatch", async () => {
    const { GET } = await importRoute();
    await assertGetForbidden(GET, {
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong-token",
      "hub.challenge": "[PHONE_REDACTED]",
    });
    expect(loggerWarnMock).toHaveBeenCalled();
    const warnCalls = loggerWarnMock.mock.calls;
    const mismatchCall = warnCalls.find(([msg]) => msg.includes("verify token mismatch"));
    expect(mismatchCall).toBeDefined();
  });

  test("403 missing hub.mode", async () => {
    const { GET } = await importRoute();
    await assertGetForbidden(GET, {
      "hub.verify_token": TEST_VERIFY_TOKEN,
      "hub.challenge": "[PHONE_REDACTED]",
    });
  });

  test("403 missing hub.challenge", async () => {
    const { GET } = await importRoute();
    await assertGetForbidden(GET, {
      "hub.mode": "subscribe",
      "hub.verify_token": TEST_VERIFY_TOKEN,
    });
  });

  test("403 missing hub.verify_token", async () => {
    const { GET } = await importRoute();
    await assertGetForbidden(GET, {
      "hub.mode": "subscribe",
      "hub.challenge": "[PHONE_REDACTED]",
    });
  });

  test("429 rate limited: per-IP rate limit triggers on token mismatch when rate limit exceeded", async () => {
    const { GET } = await importRoute();

    // Simulate rate limiter denying the request
    rateLimitSuccess = false;

    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong-token",
      "hub.challenge": "1234567890",
    });

    const res = await GET(req);

    expect(res.status).toBe(429);
    expect(afterCallback).toBeNull();
  });

  test("500 server error: WHATSAPP_VERIFY_TOKEN not configured", async () => {
    const { GET } = await importRoute();

    // Simulate missing env config
    envVerifyToken = undefined;

    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": TEST_VERIFY_TOKEN,
      "hub.challenge": "1234567890",
    });

    const res = await GET(req);

    expect(res.status).toBe(500);
    expect(loggerErrorMock).toHaveBeenCalled();
    const errorCalls = loggerErrorMock.mock.calls;
    const tokenMissingCall = errorCalls.find(([msg]) => msg.includes("WHATSAPP_VERIFY_TOKEN not configured"));
    expect(tokenMissingCall).toBeDefined();
    expect(afterCallback).toBeNull();
  });

  test("S5 timingSafeEqual: equal-length token compared correctly", async () => {
    const { GET } = await importRoute();
    const challenge = "my-challenge-value";

    // Token of same length as TEST_VERIFY_TOKEN but different content
    const wrongTokenSameLength = "a".repeat(TEST_VERIFY_TOKEN.length);

    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": wrongTokenSameLength,
      "hub.challenge": challenge,
    });

    const res = await GET(req);

    // Same-length wrong token should fail timing-safe comparison → 403
    expect(res.status).toBe(403);
    expect(afterCallback).toBeNull();
  });

  test("S5 timingSafeEqual: different-length token returns 403 (short-circuit, no throw)", async () => {
    const { GET } = await importRoute();

    const req = makeGetRequest({
      "hub.mode": "subscribe",
      "hub.verify_token": "short",
      "hub.challenge": "1234567890",
    });

    const res = await GET(req);

    // Different-length token should NOT throw — safeEqual returns false → 403
    expect(res.status).toBe(403);
    expect(afterCallback).toBeNull();
  });
});
