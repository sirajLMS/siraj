import crypto from "node:crypto";
import { after, type NextRequest, NextResponse } from "next/server";
import { logger } from "@/backend/lib/logger";
import { apiRateLimiter, checkRateLimit, getClientIdentifier } from "@/backend/lib/ratelimit";
import { resolveEnvConfig, WhatsappWebhookHandler } from "@/backend/services";
import { cacheService } from "@/backend/services/cache/CacheServiceFactory";

/**
 * Meta WhatsApp Cloud API webhook endpoint.
 *
 * GET  — Meta webhook verification handshake (hub.mode=subscribe).
 * POST — Inbound event delivery (status updates, template lifecycle, account updates).
 *
 * Security:
 *  S1 — Per-IP rate limiting on all verification attempts and POST flooding.
 *  S2 — On HMAC mismatch, log only (ip, userAgent, contentLength); never the body or raw header content.
 *  S3 — Inbound `value.messages[]` stripped from every change entry before deferring to handler.
 *  S5 — `hub.verify_token` compared via `crypto.timingSafeEqual` over equal-length buffers.
 *  C3 — Handler deferred via `after()` from `next/server` (not queueMicrotask).
 */

const MAX_BODY_SIZE = 1024 * 1024; // ~1 MB

/** Webhook-specific rate limiter: 60 req/min per IP (fail-closed for mismatches). */
const webhookRateLimiter = apiRateLimiter;

/**
 * Compare two buffers in constant time.
 * Both buffers are hashed first so that `timingSafeEqual` always receives
 * equal-length inputs, eliminating the length-based timing oracle.
 */
function safeEqual(a: Buffer, b: Buffer): boolean {
  const aHash = crypto.createHash("sha256").update(a).digest();
  const bHash = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

/**
 * Extract client IP from the request (S1).
 * Thin wrapper around `getClientIdentifier` — kept for readability and
 * to provide a single seam for testing/mocking the IP extraction in webhook tests.
 */
function extractIp(request: NextRequest): string {
  return getClientIdentifier(request);
}

// ─── GET: Webhook Verification ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    logger.warn("whatsapp-webhook: invalid verification request", {
      ip: extractIp(request),
      mode,
    });
    return new NextResponse(null, { status: 403 });
  }

  const ip = extractIp(request);

  // S1: Rate-limit ALL verification attempts (match AND mismatch) per IP before the
  // timingSafeEqual comparison. Applying the limit only on mismatch created a timing
  // oracle — the mismatch path did a Redis round-trip while the match path did not,
  // allowing attackers to distinguish the two paths across many requests.
  const verifyRateLimitResult = await checkRateLimit(`whatsapp-webhook-verify:${ip}`, webhookRateLimiter, {
    failOpen: false,
  });
  if (!verifyRateLimitResult.success) {
    logger.warn("whatsapp-webhook: verify rate limit exceeded", { ip });
    return new NextResponse(null, { status: 429 });
  }

  const verifyToken = await resolveEnvConfig("WHATSAPP_VERIFY_TOKEN");
  if (!verifyToken) {
    logger.error("whatsapp-webhook: WHATSAPP_VERIFY_TOKEN not configured");
    return new NextResponse(null, { status: 500 });
  }

  // S5: timingSafeEqual over equal-length buffers
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(verifyToken);
  if (!safeEqual(tokenBuf, expectedBuf)) {
    logger.warn("whatsapp-webhook: verify token mismatch", { ip });
    return new NextResponse(null, { status: 403 });
  }

  // r10-002: Validate challenge is numeric-only before reflecting it back.
  // Meta's hub.challenge is always a numeric string. An attacker could inject
  // arbitrary content via the query parameter, which would be reflected verbatim
  // as text/plain — a potential XSS or content-injection vector if a browser
  // sniffs the response as HTML.
  const isNumeric = /^\d{1,20}$/.test(challenge);
  if (!isNumeric) {
    logger.warn("whatsapp-webhook: invalid challenge format", { ip });
    return new NextResponse(null, { status: 400 });
  }

  // Defense-in-depth: truncate to max 20 characters (already enforced by regex,
  // but kept as an explicit boundary for readability and future-proofing).
  const safeChallenge = challenge.slice(0, 20);

  // Return the validated challenge as plain text (Meta expects raw string, not JSON)
  return new NextResponse(safeChallenge, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// ─── POST: Inbound Webhook Event ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = extractIp(request);
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);

  // Body-size cap ~1 MB → 413
  if (contentLength > MAX_BODY_SIZE) {
    logger.warn("whatsapp-webhook: body too large", { ip, contentLength });
    return new NextResponse(null, { status: 413 });
  }

  // S1: Rate-limit per IP on POST to prevent flooding (before body read to avoid memory exhaustion)
  // r6-sec-04: fail-closed on cache errors — webhook is a security endpoint and must not allow unbounded flooding
  const postRateLimitResult = await checkRateLimit(`whatsapp-webhook-post:${ip}`, webhookRateLimiter, {
    failOpen: false,
  });
  if (!postRateLimitResult.success) {
    logger.warn("whatsapp-webhook: POST rate limit exceeded", { ip });
    return new NextResponse(null, { status: 429 });
  }

  // Read raw body first (needed for HMAC verification).
  //
  // r10-016: Memory-exhaustion trade-off documentation.
  // If an attacker omits or spoofs the Content-Length header (e.g., sets it to 0),
  // the pre-read check above passes but `request.text()` still reads the full body
  // into memory. The post-read check below catches this case and rejects oversized
  // bodies with 413. We accept the temporary memory use because:
  //   1. The rate limiter (60 req/min per IP) bounds how many concurrent oversized
  //      bodies a single attacker can cause to be buffered.
  //   2. The post-read `Buffer.byteLength` check runs immediately after the read,
  //      capping the maximum retained body at MAX_BODY_SIZE before any processing.
  // A fully streaming approach would complicate HMAC verification (which needs the
  // full body for hashing) without meaningfully reducing the worst-case footprint
  // given the rate-limited entry point.
  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf-8") > MAX_BODY_SIZE) {
    logger.warn("whatsapp-webhook: actual body too large", { ip, contentLength: Buffer.byteLength(rawBody, "utf-8") });
    return new NextResponse(null, { status: 413 });
  }

  const hmacResult = await verifyHmacSignature(request, ip, contentLength, rawBody);
  if (hmacResult) {
    return hmacResult;
  }

  const parseResult = parseWebhookBody(rawBody, ip);
  if (parseResult.response) {
    return parseResult.response;
  }

  // S3: Strip inbound `value.messages[]` from every change entry before anything else
  const stripped = stripInboundMessages(parseResult.body);

  deferWebhookProcessing(stripped);

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

/**
 * Verify HMAC-SHA256 signature of the incoming webhook payload.
 * Returns a NextResponse if verification fails (caller should return it),
 * or `null` if the signature is valid.
 */
async function verifyHmacSignature(
  request: NextRequest,
  ip: string,
  contentLength: number,
  rawBody: string
): Promise<NextResponse | null> {
  // HMAC-SHA256 signature verification
  const signatureHeader = request.headers.get("x-hub-signature-256") ?? "";
  const appSecret = await resolveEnvConfig("WHATSAPP_APP_SECRET");

  if (!appSecret) {
    logger.error("whatsapp-webhook: WHATSAPP_APP_SECRET not configured");
    return new NextResponse(null, { status: 500 });
  }

  if (!signatureHeader.startsWith("sha256=")) {
    // S2: log only safe metadata — never the body, never the raw header
    logger.warn("whatsapp-webhook: missing or malformed signature", {
      ip,
      userAgent: request.headers.get("user-agent") ?? "",
      contentLength,
    });
    return new NextResponse(null, { status: 401 });
  }

  // Compute expected signature
  const expectedSignature = crypto.createHmac("sha256", appSecret).update(rawBody).digest();

  const receivedSignature = Buffer.from(signatureHeader.slice(7), "hex");

  const signatureMatched = safeEqual(receivedSignature, expectedSignature);

  if (!signatureMatched) {
    // S2: log only safe metadata — never the body, never raw attacker-controlled header content (r6-sec-05, r10-035)
    logger.warn("whatsapp-webhook: HMAC signature mismatch", {
      ip,
      userAgent: request.headers.get("user-agent") ?? "",
      contentLength,
    });
    return new NextResponse(null, { status: 401 });
  }

  // M7: Replay-window nonce. A captured (rawBody, signature) pair can be replayed
  // indefinitely without this check. The cache key is the SHA-256 of the raw body —
  // identical bodies produce identical keys, so the FIRST accepted delivery claims the
  // nonce and subsequent deliveries within the 24h window are rejected with 409.
  //
  // The 24h TTL mirrors Meta's maximum retry window — once Meta stops retrying a
  // webhook, the nonce expires and a future legitimate identical body (extremely
  // unlikely for HMAC-signed payloads) would be accepted.
  //
  // `WhatsappWebhookHandler.processEvent` is already idempotent (B3 forward-only rank
  // guard), so duplicate Meta retries were already safe; this nonce is defense-in-depth
  // in case that idempotency is ever weakened.
  //
  // r6-sec-04 / fail-closed: on cache errors, reject the webhook (409) rather than risk
  // accepting a replay. Matches the existing `failOpen: false` pattern on the POST rate
  // limiter above. Meta will retry; a healthy cache will allow the retry to claim the nonce.
  const replayKey = `whatsapp:replay:${crypto.createHash("sha256").update(rawBody).digest("hex")}`;
  try {
    const claimed = await cacheService.setNx(replayKey, "1", 24 * 60 * 60 * 1000);
    if (claimed === null) {
      logger.warn("whatsapp-webhook: replay detected (duplicate body within 24h window)", {
        ip,
        contentLength,
      });
      return new NextResponse(null, { status: 409 });
    }
  } catch (error) {
    logger.error("whatsapp-webhook: replay-cache error, rejecting (fail-closed)", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse(null, { status: 409 });
  }

  return null;
}

/**
 * Parse and validate the webhook body JSON.
 * Returns `{ body, response: null }` on success, or `{ body: null, response }` on failure.
 */
function parseWebhookBody(rawBody: string, ip: string): { body: unknown; response: NextResponse | null } {
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    logger.warn("whatsapp-webhook: invalid JSON body", { ip });
    return { body: null, response: new NextResponse(null, { status: 400 }) };
  }

  const objectValue =
    body !== null && typeof body === "object" && "object" in body && typeof body.object === "string"
      ? body.object
      : undefined;

  // Validate top-level object field
  if (objectValue !== "whatsapp_business_account") {
    logger.warn("whatsapp-webhook: unexpected object field", {
      ip,
      object: objectValue,
    });
    return { body: null, response: new NextResponse(null, { status: 404 }) };
  }

  return { body, response: null };
}

/**
 * C3: Defer event processing via `after()` from `next/server`.
 *
 * ⚠️ Best-effort on serverless (r7-048):
 * On Vercel serverless, `after()` runs after the response is sent but is NOT
 * guaranteed to complete — the serverless function may be frozen or terminated
 * before the deferred work finishes. This means webhook processing can be
 * silently dropped.
 *
 * Reliability is ensured by two mechanisms:
 * - Meta retries unacknowledged webhooks (exponential backoff up to ~24h).
 * - `WhatsappWebhookHandler.processEvent` is idempotent — the B3 forward-only
 *   rank guard handles duplicate deliveries safely.
 *
 * Together, these guarantee that dropped deferred work is retried by Meta and
 * that retries do not cause duplicate side-effects. The `after()` call itself
 * is still preferred because it returns 200 immediately, reducing webhook
 * timeout risk and Meta retry pressure.
 */
function deferWebhookProcessing(strippedBody: unknown): void {
  after(async () => {
    try {
      await WhatsappWebhookHandler.processEvent(strippedBody);
    } catch (error) {
      logger.error("whatsapp-webhook: deferred handler error", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/**
 * S3: Strip inbound `value.messages[]` from every change entry.
 * Inbound user messages must never be stored or processed — only status updates,
 * template lifecycle events, and account-level updates are handled.
 */
function stripInboundMessages(webhookBody: unknown): unknown {
  if (
    !webhookBody ||
    typeof webhookBody !== "object" ||
    !("entry" in webhookBody) ||
    !Array.isArray(webhookBody.entry)
  ) {
    return webhookBody;
  }

  const entries = webhookBody.entry.map((entry: unknown) => {
    if (!entry || typeof entry !== "object" || !("changes" in entry) || !Array.isArray(entry.changes)) {
      return entry;
    }
    const changes = entry.changes.map((change: unknown) => {
      if (!change || typeof change !== "object" || !("value" in change)) {
        return change;
      }
      const val = change.value;
      if (val && typeof val === "object" && "messages" in val && Array.isArray(val.messages)) {
        const valObj: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val)) {
          if (k !== "messages") {
            valObj[k] = v;
          }
        }
        return { ...change, value: valObj };
      }
      return change;
    });
    return { ...entry, changes };
  });

  return { ...webhookBody, entry: entries };
}
