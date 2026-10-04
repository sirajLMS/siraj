import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import {
  deferWebhookProcessing,
  extractIp,
  MAX_BODY_SIZE,
  parseWebhookBody,
  safeEqual,
  verifyHmacSignature,
  webhookRateLimiter,
} from "@/app/api/webhooks/whatsapp/webhook.helpers";
import { logger } from "@/backend/lib/logger";
import { checkRateLimit } from "@/backend/lib/ratelimit";
import { resolveEnvConfig } from "@/backend/services";
import { persistWebhookChanges } from "@/backend/services/whatsapp";

/**
 * Meta WhatsApp Cloud API webhook endpoint.
 *
 * GET  — Meta webhook verification handshake (hub.mode=subscribe).
 * POST — Durable inbound event ingest: every change of the payload is
 *        persisted as a `whatsapp_webhook_events` row BEFORE acking 200
 *        (persist-first), and asynchronous workers (the `after()` tick and
 *        the stale-PENDING sweeper cron) dispatch them. Meta retries
 *        deliveries for up to 7 days and may replay identical bodies, so a
 *        5-minute exact-replay window acks-but-skips duplicates while entity
 *        upserts (wamid / contact LWW / chunk keys) absorb later redeliveries.
 *
 * Security:
 *  S1 — Per-IP rate limiting on all verification attempts and POST flooding.
 *  S2 — On HMAC mismatch, log only (ip, userAgent, contentLength); never the body
 *       or raw header content, and no event rows are inserted.
 *  S5 — `hub.verify_token` compared via `crypto.timingSafeEqual` over equal-length buffers.
 *  C3 — Handler deferred via `after()` from `next/server` (not queueMicrotask).
 */

// ─── GET: Webhook Verification ───────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe" || !token || !challenge) {
    logger.warn("whatsapp-webhook: invalid verification request", { ip: extractIp(request), mode });
    return new NextResponse(null, { status: 403 });
  }

  const ip = extractIp(request);
  // Rate-limit ALL verification attempts (match AND mismatch) per IP before
  // timingSafeEqual: applying the limit only on mismatch leaks a timing oracle.
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

  if (!safeEqual(Buffer.from(token), Buffer.from(verifyToken))) {
    logger.warn("whatsapp-webhook: verify token mismatch", { ip });
    return new NextResponse(null, { status: 403 });
  }

  // Meta's hub.challenge is always numeric; reflect only the numeric prefix.
  if (!/^\d{1,20}$/.test(challenge)) {
    logger.warn("whatsapp-webhook: invalid challenge format", { ip });
    return new NextResponse(null, { status: 400 });
  }

  return new NextResponse(challenge.slice(0, 20), {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

// ─── POST: Durable Inbound Webhook Ingest ────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = extractIp(request);
  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);

  if (contentLength > MAX_BODY_SIZE) {
    logger.warn("whatsapp-webhook: body too large", { ip, contentLength });
    return new NextResponse(null, { status: 413 });
  }

  // Rate-limit POST per IP (before body read to avoid memory exhaustion),
  // fail-closed: the webhook is a security endpoint.
  const postRateLimitResult = await checkRateLimit(`whatsapp-webhook-post:${ip}`, webhookRateLimiter, {
    failOpen: false,
  });
  if (!postRateLimitResult.success) {
    logger.warn("whatsapp-webhook: POST rate limit exceeded", { ip });
    return new NextResponse(null, { status: 429 });
  }

  // Raw body first: HMAC needs it, and the post-read size check catches a
  // spoofed Content-Length. The rate limiter bounds concurrent oversized reads.
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

  // Persist one durable event row per change BEFORE acking — Meta's own docs
  // mandate capture-then-process. A persist failure returns 503 so Meta's
  // 7-day retry redelivers rather than the body being dropped.
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  try {
    await persistWebhookChanges(parseResult.body, payloadHash);
  } catch (error) {
    logger.error("whatsapp-webhook: durable event persist failed — Meta will retry", {
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse(null, { status: 503 });
  }

  deferWebhookProcessing();

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
