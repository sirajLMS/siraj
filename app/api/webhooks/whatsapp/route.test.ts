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

const processEventMock = mock(async (_payload?: unknown): Promise<void> => {});

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
mock.module("next/server", () => {
  return {
    after: (cb: () => Promise<void>) => {
      afterCallback = cb;
    },
    NextRequest: RealNextRequest,
    NextResponse: RealNextResponse,
  };
});

mock.module("@/backend/lib/env-config-resolver", () => ({
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
}));

mock.module("@/backend/lib/ratelimit", () => ({
  apiRateLimiter: {},
  checkRateLimit: async () => ({
    success: rateLimitSuccess,
    limit: 60,
    remaining: rateLimitSuccess ? 59 : 0,
    reset: Date.now() + 60000,
  }),
  getClientIdentifier: (request: Request): string => request.headers.get("x-forwarded-for") ?? "127.0.0.1",
}));

mock.module("@/backend/services/whatsapp/whatsapp-webhook.handler", () => ({
  WhatsappWebhookHandler: {
    processEvent: processEventMock,
  },
}));

mock.module("@/backend/lib/logger", () => ({
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

function buildWebhookBody(messagesIncluded = false): string {
  const entry = {
    id: "123456789",
    changes: [
      {
        field: "messages",
        value: {
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
        },
      },
    ],
  };

  if (messagesIncluded) {
    (entry.changes[0].value as Record<string, unknown>).messages = [
      {
        from: "1234567890",
        id: "wamid.inbound1",
        text: { body: "hello" },
        timestamp: "1700000001",
        type: "text",
      },
    ];
  }

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
  expect(processEventMock).toHaveBeenCalledTimes(0);
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

async function importRoute(): Promise<{
  GET: (request: NextRequest) => Promise<Response>;
  POST: (request: NextRequest) => Promise<Response>;
}> {
  return import("./route") as Promise<{
    GET: (request: NextRequest) => Promise<Response>;
    POST: (request: NextRequest) => Promise<Response>;
  }>;
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  processEventMock.mockClear();
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

    // The deferred handler should have been registered via after().
    expect(afterCallback).not.toBeNull();
    // Execute the deferred callback and verify processEvent was called.
    await afterCallback?.();
    expect(processEventMock).toHaveBeenCalledTimes(1);
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
    const warnCalls = loggerWarnMock.mock.calls as unknown as [string, Record<string, unknown>?][];
    const hmacMismatchCall = warnCalls.find(
      ([msg]) => typeof msg === "string" && msg.includes("HMAC signature mismatch")
    );
    expect(hmacMismatchCall).toBeDefined();

    const loggedMeta = hmacMismatchCall?.[1] ?? {};
    const metaJson = JSON.stringify(loggedMeta);
    // The raw body content must never appear in the log output.
    expect(metaJson).not.toContain(bodyContains);
    // Safe metadata fields should be present.
    expect(loggedMeta).toHaveProperty("ip");
    expect(loggedMeta).toHaveProperty("userAgent");
    expect(loggedMeta).toHaveProperty("contentLength");

    // The handler must NOT have been called on HMAC failure.
    expect(afterCallback).toBeNull();
    expect(processEventMock).toHaveBeenCalledTimes(0);
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
    expect(processEventMock).toHaveBeenCalledTimes(0);
  });

  test("Route-level S3 strip: messages[] stripped from change entries before deferral", async () => {
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

    // Execute the deferred handler.
    expect(afterCallback).not.toBeNull();
    await afterCallback?.();

    // processEvent should have been called once with the stripped payload.
    expect(processEventMock).toHaveBeenCalledTimes(1);

    const passedPayload = processEventMock.mock.calls[0][0] as {
      entry?: Array<{ changes?: Array<{ value?: { messages?: unknown[]; statuses?: unknown[] } }> }>;
    };

    expect(passedPayload).toBeDefined();
    expect(passedPayload.entry).toBeDefined();
    expect(Array.isArray(passedPayload.entry)).toBe(true);

    // Every change entry's value MUST NOT have a messages[] array — it should be stripped (S3).
    for (const entry of passedPayload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.value) {
          expect(change.value.messages).toBeUndefined();
          // Other fields like statuses should be preserved.
          expect(change.value.statuses).toBeDefined();
        }
      }
    }
  });

  // r10-056: End-to-end HMAC + S3 strip + deferred after() callback + handler invocation
  test("End-to-end: valid HMAC → S3 strip → deferred after() → handler called with stripped payload", async () => {
    const { POST } = await importRoute();
    const rawBody = buildWebhookBody(true); // body includes value.messages[]
    const signature = computeHmac(rawBody);

    const req = makePostRequest(rawBody, {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
      "content-length": String(Buffer.byteLength(rawBody)),
    });

    // Step 1: POST returns 200 immediately (deferred handler registered)
    const res = await POST(req);
    expect(res.status).toBe(200);

    // Step 2: after() callback was registered (deferred processing)
    expect(afterCallback).not.toBeNull();

    // Step 3: Execute deferred callback → handler invoked with stripped payload
    await afterCallback?.();

    // Step 4: processEvent was called exactly once
    expect(processEventMock).toHaveBeenCalledTimes(1);

    // Step 5: The passed payload has messages[] stripped (S3)
    const passedPayload = processEventMock.mock.calls[0][0] as {
      object?: string;
      entry?: Array<{ changes?: Array<{ value?: { messages?: unknown[]; statuses?: unknown[] } }> }>;
    };
    expect(passedPayload.object).toBe("whatsapp_business_account");
    for (const entry of passedPayload.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.value) {
          expect(change.value.messages).toBeUndefined();
          expect(change.value.statuses).toBeDefined();
        }
      }
    }
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
    expect(processEventMock).toHaveBeenCalledTimes(0);
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
    const warnCalls = loggerWarnMock.mock.calls as unknown as [string, Record<string, unknown>?][];
    const mismatchCall = warnCalls.find(([msg]) => typeof msg === "string" && msg.includes("verify token mismatch"));
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
    const errorCalls = loggerErrorMock.mock.calls as unknown as [string, Record<string, unknown>?][];
    const tokenMissingCall = errorCalls.find(
      ([msg]) => typeof msg === "string" && msg.includes("WHATSAPP_VERIFY_TOKEN not configured")
    );
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
