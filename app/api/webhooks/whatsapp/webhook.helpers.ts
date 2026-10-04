import crypto from "node:crypto";
import { after, type NextRequest, NextResponse } from "next/server";
import { logger } from "@/backend/lib/logger";
import { apiRateLimiter, getClientIdentifier } from "@/backend/lib/ratelimit";
import { resolveEnvConfig } from "@/backend/services";
import { WhatsappWebhookHandler } from "@/backend/services/whatsapp";

export const MAX_BODY_SIZE = 1024 * 1024; // ~1 MB — a documented Meta limit does not exist; this is a self-imposed DoS cap (history chunks can approach it)

/** Webhook-specific rate limiter: 60 req/min per IP (fail-closed for mismatches). */
export const webhookRateLimiter = apiRateLimiter;

/**
 * Compare two buffers in constant time. Both are hashed first so
 * `timingSafeEqual` always receives equal-length inputs, eliminating the
 * length-based timing oracle.
 */
export function safeEqual(a: Buffer, b: Buffer): boolean {
  const aHash = crypto.createHash("sha256").update(a).digest();
  const bHash = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

/**
 * Verify HMAC-SHA256 signature; returns the failure response or null on match.
 * No durable event row is ever written for a failed signature (S2).
 */
export async function verifyHmacSignature(
  request: NextRequest,
  ip: string,
  contentLength: number,
  rawBody: string
): Promise<NextResponse | null> {
  const signatureHeader = request.headers.get("x-hub-signature-256") ?? "";
  const appSecret = await resolveEnvConfig("WHATSAPP_APP_SECRET");

  if (!appSecret) {
    logger.error("whatsapp-webhook: WHATSAPP_APP_SECRET not configured");
    return new NextResponse(null, { status: 500 });
  }

  if (!signatureHeader.startsWith("sha256=")) {
    logger.warn("whatsapp-webhook: missing or malformed signature", {
      ip,
      userAgent: request.headers.get("user-agent") ?? "",
      contentLength,
    });
    return new NextResponse(null, { status: 401 });
  }

  const expectedSignature = crypto.createHmac("sha256", appSecret).update(rawBody).digest();
  const receivedSignature = Buffer.from(signatureHeader.slice(7), "hex");

  if (!safeEqual(receivedSignature, expectedSignature)) {
    logger.warn("whatsapp-webhook: HMAC signature mismatch", {
      ip,
      userAgent: request.headers.get("user-agent") ?? "",
      contentLength,
    });
    return new NextResponse(null, { status: 401 });
  }
  return null;
}

/** Parse + top-level-shape-validate the webhook body. */
export function parseWebhookBody(rawBody: string, ip: string): { body: unknown; response: NextResponse | null } {
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
  if (objectValue !== "whatsapp_business_account") {
    logger.warn("whatsapp-webhook: unexpected object field", { ip, object: objectValue });
    return { body: null, response: new NextResponse(null, { status: 404 }) };
  }
  return { body, response: null };
}

/**
 * Best-effort inline processing of the just-persisted durable rows via
 * `after()` (not guaranteed on serverless — the sweeper cron reclaims any
 * rows left PENDING, so nothing is lost when the tick is skipped).
 */
export function deferWebhookProcessing(): void {
  after(async () => {
    try {
      await WhatsappWebhookHandler.processPendingWebhookEvents();
    } catch (error) {
      logger.error("whatsapp-webhook: deferred durable-run failed; sweeper will reclaim", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });
}

/** Extract client IP from the request (S1). */
export function extractIp(request: NextRequest): string {
  return getClientIdentifier(request);
}
