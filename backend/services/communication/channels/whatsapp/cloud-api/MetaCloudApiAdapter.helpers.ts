import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { WhatsappAccountOffboardedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { sanitizeFailureReason } from "@/backend/lib/whatsapp-sanitize";
import {
  extractMetaErrorCode,
  extractMetaErrorMessage,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import { redisService } from "@/backend/services/redis";
import { readResponseBodyWithByteBudget } from "@/backend/services/shared";
import type { CreateNotificationDeliveryInput, WhatsappPayload, WhatsappSendResult } from "@/backend/types";

/** Pair-rate-limit window: no two messages to the same recipient within 6 seconds. */
const PAIR_RATE_LIMIT_MS = 6000;

/** Redis key TTL for the pair-rate-limit timestamp. Entries self-expire after 60 seconds. */
const PAIR_RATE_LIMIT_TTL_SEC = 60;

/** Meta error code 131056 — recipient-only rate limit; defer, do not mark FAILED. */
const META_ERROR_131056 = 131056;

/** Prefix for Redis pair-rate-limit keys: `whatsapp:pair:<sender>:<recipient>`. */
const REDIS_PAIR_KEY_PREFIX = "whatsapp:pair:";

/** TTL for the adapter's in-memory credentials cache — bounds plaintext-token memory exposure. */
export const CREDENTIALS_CACHE_TTL_MS = 5_000;

/** Window for the local pair-rate-limit fallback when Redis is unavailable. */
const LOCAL_PAIR_RATE_LIMIT_WINDOW_MS = PAIR_RATE_LIMIT_MS;

/** Maximum number of entries in the local pair-rate-limit map. */
const LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES = 10_000;

/** Mutable concurrency state shared with {@link runWithConcurrencyLimit}. */
export type AdapterConcurrencyState = {
  activeCalls: number;
  waitQueue: (() => void)[];
};

/**
 * Prunes the local pair-rate-limit map to prevent unbounded growth during
 * extended Redis outages. Removes entries older than the rate-limit window
 * and caps the total entries to {@link LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES}.
 */
function pruneLocalPairRateLimit(map: Map<string, number>): void {
  const now = Date.now();
  const maxAge = LOCAL_PAIR_RATE_LIMIT_WINDOW_MS;

  for (const [key, timestamp] of map.entries()) {
    if (now - timestamp > maxAge) {
      map.delete(key);
    }
  }

  if (map.size > LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES) {
    const entriesToRemove = map.size - LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES;
    const keys = map.keys();
    for (let i = 0; i < entriesToRemove; i++) {
      const key = keys.next().value;
      if (key !== undefined) {
        map.delete(key);
      }
    }
  }
}

/**
 * Pure defer computation for the pair-rate-limit window. Returns the ms to
 * defer (0 if within-or-past the window, or if the previous timestamp is
 * non-finite / null).
 */
function computeDeferMs(lastStr: string | null, now: number): number {
  if (lastStr === null) {
    return 0;
  }
  const last = Number.parseInt(lastStr, 10);
  if (!Number.isFinite(last)) {
    return 0;
  }
  const elapsed = now - last;
  if (elapsed < PAIR_RATE_LIMIT_MS) {
    return PAIR_RATE_LIMIT_MS - elapsed;
  }
  return 0;
}

/**
 * Derives the sender segment for pair-rate-limit keys: digits of the account's
 * display phone number, falling back to the Meta `phone_number_id` when no
 * display number has been synced yet.
 */
export function normalizeSenderKey(displayPhoneNumber: string | null, phoneNumberId: string): string {
  const digits = displayPhoneNumber?.replace(/\D/g, "") ?? "";
  return digits.length > 0 ? digits : phoneNumberId;
}

export function buildDeliveryInput(payload: WhatsappPayload): CreateNotificationDeliveryInput {
  return {
    userId: payload.userId,
    channel: NotificationChannel.WHATSAPP,
    eventType: payload.eventType,
    title: payload.template?.name ?? null,
    body: null,
    metadata: payload.metadata ?? null,
  };
}

/** Failure result for a payload with no recipient — logged, never sent. */
export function buildEmptyRecipientResult(payload: WhatsappPayload, locale: string): WhatsappSendResult {
  logger.logDomainError("MetaCloudApiAdapter: empty recipient in payload", {
    templateName: payload.template?.name,
  });

  return {
    success: false,
    sendAttempted: false,
    error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
  };
}

/**
 * Failure during credential resolution — before any delivery row or Graph API
 * call. Offboarded accounts surface the `whatsapp.accountOffboarded` domain
 * code; every other failure stays a generic misconfiguration.
 */
export function buildCredentialFailureResult(
  payload: WhatsappPayload,
  error: unknown,
  accountId: string,
  locale: string
): WhatsappSendResult {
  if (error instanceof WhatsappAccountOffboardedError) {
    logger.logDomainError("MetaCloudApiAdapter: send to offboarded account — fail fast before Graph call", {
      accountId,
      templateName: payload.template?.name,
    });
    return {
      success: false,
      sendAttempted: false,
      error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
      errorCode: error.code,
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error("MetaCloudApiAdapter: credential resolution failed", {
    accountId,
    error: errorMessage,
  });

  return {
    success: false,
    sendAttempted: false,
    error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
  };
}

export async function recordPairRateLimitSuccess(senderKey: string, e164: string): Promise<void> {
  try {
    const key = `${REDIS_PAIR_KEY_PREFIX}${senderKey}:${e164}`;
    await redisService.set(key, Date.now().toString(), { ex: PAIR_RATE_LIMIT_TTL_SEC });
  } catch (error) {
    logger.warn("MetaCloudApiAdapter: Redis pair-rate-limit recording failed", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Marks a delivery FAILED after sanitizing the reason. A rank-guard rejection
 * (PENDING→FAILED disallowed) is logged and swallowed — Meta's retry webhooks
 * eventually reconcile the status — while genuine DB failures are re-thrown.
 */
async function markDeliveryFailed(deliveryId: string, failureReason: string): Promise<void> {
  const sanitized = sanitizeFailureReason(failureReason);

  try {
    await NotificationRepository.updateDeliveryStatus({
      deliveryId,
      status: NotificationDeliveryStatus.FAILED,
      failureReason: sanitized,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("invalid") && msg.includes("transition")) {
      logger.warn("MetaCloudApiAdapter: rank guard rejected FAILED transition", {
        deliveryId,
        failureReason: sanitized,
        rankGuardError: msg,
      });
    } else {
      logger.error("MetaCloudApiAdapter: failed to mark delivery as FAILED (DB error)", {
        deliveryId,
        failureReason: sanitized,
        error: msg,
      });
      throw error;
    }
  }
}

/**
 * Resolves a non-2xx Graph API response into a send result. Rate-limit signals
 * (HTTP 429 or Meta code 131056) never mark FAILED — the caller should
 * deferred-retry instead.
 */
export async function resolveHttpErrorResult(
  deliveryId: string,
  response: Response,
  locale: string
): Promise<WhatsappSendResult> {
  const errorText = await readResponseBodyWithByteBudget(response);
  let errorBody: unknown;
  try {
    errorBody = JSON.parse(errorText) as unknown;
  } catch {
    errorBody = errorText;
  }

  const statusCode = response.status;
  const metaErrorCode = extractMetaErrorCode(errorBody);
  const isRateLimited = statusCode === 429 || metaErrorCode === META_ERROR_131056;

  logger.error("MetaCloudApiAdapter: Graph API returned non-2xx", {
    deliveryId,
    statusCode,
    metaErrorCode,
    rateLimited: isRateLimited,
  });

  if (isRateLimited) {
    return {
      success: false,
      sendAttempted: true,
      rateLimited: true,
      error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
    };
  }

  const failureReason = extractMetaErrorMessage(errorBody) ?? `Graph API error ${statusCode}`;
  await markDeliveryFailed(deliveryId, failureReason);

  return {
    success: false,
    sendAttempted: true,
    rateLimited: isRateLimited,
    error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
  };
}

/**
 * Failure result for a thrown send exception. `sendAttempted` records whether a
 * Graph API call was actually made — failed sends that reached Meta still
 * consume portfolio messaging budget, pre-fetch failures do not.
 */
export async function resolveSendExceptionResult(
  deliveryId: string,
  error: unknown,
  locale: string,
  sendAttempted: boolean
): Promise<WhatsappSendResult> {
  const errorMessage = error instanceof Error ? error.message : String(error);

  logger.error("Failed to send WhatsApp template message", {
    deliveryId,
    error: errorMessage,
  });

  await markDeliveryFailed(deliveryId, errorMessage);

  return {
    success: false,
    sendAttempted,
    error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
  };
}

/**
 * Redis-backed pair-rate-limit check that falls back to the adapter's local
 * in-memory map when Redis is unavailable.
 */
export async function checkPairRateLimit(
  senderKey: string,
  e164: string,
  localPairRateLimit: Map<string, number>
): Promise<number> {
  const pairKey = `${senderKey}:${e164}`;
  try {
    const key = `${REDIS_PAIR_KEY_PREFIX}${pairKey}`;
    const lastStr = await redisService.get(key);
    return computeDeferMs(lastStr, Date.now());
  } catch (error) {
    logger.warn("MetaCloudApiAdapter: Redis pair-rate-limit check failed, using local fallback", {
      pairKey,
      error: error instanceof Error ? error.message : String(error),
    });
    const now = Date.now();
    const last = localPairRateLimit.get(pairKey);
    const deferMs = computeDeferMs(last?.toString() ?? null, now);
    if (deferMs === 0) {
      localPairRateLimit.set(pairKey, now);
      pruneLocalPairRateLimit(localPairRateLimit);
    }
    return deferMs;
  }
}

/**
 * Runs a task under a simple concurrency gate, queuing callers while the active
 * call count is at `maxConcurrent` and releasing the next queued caller when a
 * slot frees up.
 */
export async function runWithConcurrencyLimit(
  state: AdapterConcurrencyState,
  maxConcurrent: number,
  task: () => Promise<WhatsappSendResult>
): Promise<WhatsappSendResult> {
  if (state.activeCalls >= maxConcurrent) {
    await new Promise<void>(resolve => {
      state.waitQueue.push(resolve);
    });
  }

  state.activeCalls++;
  try {
    return await task();
  } finally {
    state.activeCalls--;
    const next = state.waitQueue.shift();
    if (next) next();
  }
}
