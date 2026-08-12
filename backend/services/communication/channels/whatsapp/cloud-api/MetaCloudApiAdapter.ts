import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { decryptField } from "@/backend/lib/field-encryption";
import { logger } from "@/backend/lib/logger";
import { FETCH_TIMEOUT_MS, MAX_CONCURRENT_CALLS, readErrorBody } from "@/backend/lib/whatsapp-constants";
import { sanitizeFailureReason } from "@/backend/lib/whatsapp-sanitize";
import {
  extractMetaErrorCode,
  extractMetaErrorMessage,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers";
import {
  buildSendTemplateMessageRequest,
  parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import { redisService } from "@/backend/services/redis";
import type { GraphApiRequestContext } from "@/backend/types";
import type { CreateNotificationDeliveryInput } from "@/backend/types/notifications/notificationDeliveries.types";
import type {
  IWhatsappChannel,
  WhatsappPayload,
  WhatsappSendResult,
} from "@/backend/types/whatsapp/whatsapp-channel.types";

/** Pair-rate-limit window: no two messages to the same recipient within 6 seconds (B2). */
const PAIR_RATE_LIMIT_MS = 6000;

/** Redis key TTL for the pair-rate-limit timestamp. Entries self-expire after 60 seconds. */
const PAIR_RATE_LIMIT_TTL_SEC = 60;

/** Meta error code 131056 — recipient-only rate limit; defer, do not mark FAILED (B2). */
const META_ERROR_131056 = 131056;

/** Prefix for Redis pair-rate-limit keys: `whatsapp:pair:<e164>`. */
const REDIS_PAIR_KEY_PREFIX = "whatsapp:pair:";

/**
 * TTL for the in-memory credentials cache (r7-011).
 *
 * Security trade-off (r10-001, r10-033): The cache stores the decrypted
 * access token in plaintext JS memory. A heap dump or error serializer
 * could leak the live Meta access token. A 5s TTL limits the exposure
 * window while still avoiding a DB query on every `send()` call within
 * a short burst. The 401 retry path (see `executeSend`) invalidates the
 * cache and re-resolves credentials, so token rotation correctness is
 * preserved even with a short TTL.
 *
 * On multi-instance deployments, cache is per-instance. A 401 retry
 * (lines ~409-426) handles token rotation correctness. The 5s TTL
 * limits the stale-token window.
 */
const CREDENTIALS_CACHE_TTL_MS = 5_000;

/**
 * Window for local pair-rate-limit fallback (r10-017). Matches
 * {@link PAIR_RATE_LIMIT_MS} — no two messages to the same recipient
 * within this window when Redis is unavailable.
 */
const LOCAL_PAIR_RATE_LIMIT_WINDOW_MS = PAIR_RATE_LIMIT_MS;

/** Maximum number of entries in the local pair-rate-limit Map (r11-r04). */
const LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES = 10_000;

/**
 * Prunes the localPairRateLimit Map to prevent unbounded growth during
 * extended Redis outages. Removes entries older than the rate-limit window
 * and caps the total entries to LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES.
 */
function pruneLocalPairRateLimit(map: Map<string, number>): void {
  const now = Date.now();
  const maxAge = LOCAL_PAIR_RATE_LIMIT_WINDOW_MS;

  // First pass: remove entries older than the window
  for (const [key, timestamp] of map.entries()) {
    if (now - timestamp > maxAge) {
      map.delete(key);
    }
  }

  // Second pass: if still over limit, remove oldest entries
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
 * Pure defer computation shared by {@link MetaCloudApiAdapter#checkPairRateLimit}
 * and tests. Returns the ms to defer (0 if within-or-past the window, or if the
 * previous timestamp is non-finite / null).
 *
 * Exported so tests can assert against the SUT's own computation rather than a
 * re-implemented local copy — see `pair-rate-limit.test.ts`.
 *
 * @param lastStr raw Redis value of the pair-rate-limit timestamp (may be null,
 *   non-numeric, or a numeric string).
 * @param now wall-clock ms at the time of the check.
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

class MetaCloudApiAdapter implements IWhatsappChannel {
  activeCalls = 0;

  /** Queue of resolvers waiting for a concurrency slot to open up. */
  private readonly waitQueue: (() => void)[] = [];

  /**
   * Local in-memory fallback for pair-rate-limiting when Redis is
   * unavailable (r10-017). Maps recipient e164 → timestamp of last send.
   * Provides basic rate-limiting during Redis outages so the adapter
   * does not fully fail-open.
   *
   * r11-r04: Bounded to {@link LOCAL_PAIR_RATE_LIMIT_MAX_ENTRIES} entries
   * via {@link pruneLocalPairRateLimit} to prevent unbounded growth.
   */
  private readonly localPairRateLimit: Map<string, number> = new Map();

  /**
   * In-memory cache for `resolveCredentials` (r7-011). Avoids running a DB
   * query on every `send()` call. Invalidation:
   *  - Expiry: entries become stale after {@link CREDENTIALS_CACHE_TTL_MS}.
   *  - Manual: `resetWhatsappChannel()` calls `instance.disconnect()` which
   *    invokes {@link invalidateCredentialsCache}.
   */
  private credentialsCache: {
    credentials: { accessToken: string; phoneNumberId: string; apiVersion: string };
    timestamp: number;
  } | null = null;

  /** Clears the in-memory credentials cache (called from `disconnect()`). */
  invalidateCredentialsCache(): void {
    this.credentialsCache = null;
  }

  async send(payload: WhatsappPayload, locale = "en"): Promise<WhatsappSendResult> {
    if (!payload.to?.trim()) {
      return this.handleEmptyRecipient(payload, locale);
    }

    const e164 = payload.to.trim();
    const delivery = await NotificationRepository.createDelivery(this.createDelivery(payload));

    try {
      const { accessToken, phoneNumberId, apiVersion } = await this.resolveCredentials();

      // Pair-rate-limit guard (B2): defer if within 6s window, never marked FAILED on guard hit.
      const deferredMs = await this.checkPairRateLimit(e164);
      if (deferredMs > 0) {
        logger.info("MetaCloudApiAdapter: deferring send due to pair-rate-limit", {
          e164,
          deferredMs,
          deliveryId: delivery.id,
        });

        return {
          success: false,
          sendAttempted: false,
          rateLimited: true,
          error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
        };
      }

      return await this.executeWithConcurrencyLimit({
        deliveryId: delivery.id,
        payload,
        e164,
        accessToken,
        phoneNumberId,
        apiVersion,
        locale,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("MetaCloudApiAdapter: send failed", {
        deliveryId: delivery.id,
        error: errorMessage,
      });

      return {
        success: false,
        sendAttempted: false,
        error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
      };
    }
  }

  private async executeWithConcurrencyLimit(params: {
    deliveryId: string;
    payload: WhatsappPayload;
    e164: string;
    accessToken: string;
    phoneNumberId: string;
    apiVersion: string | undefined;
    locale: string;
  }): Promise<WhatsappSendResult> {
    if (this.activeCalls >= MAX_CONCURRENT_CALLS) {
      await new Promise<void>(resolve => {
        this.waitQueue.push(resolve);
      });
    }

    this.activeCalls++;
    try {
      return await this.executeSend({
        deliveryId: params.deliveryId,
        payload: params.payload,
        e164: params.e164,
        accessToken: params.accessToken,
        phoneNumberId: params.phoneNumberId,
        apiVersion: params.apiVersion,
        locale: params.locale,
      });
    } finally {
      this.activeCalls--;
      const next = this.waitQueue.shift();
      if (next) next();
    }
  }

  private async executeSend(params: {
    deliveryId: string;
    payload: WhatsappPayload;
    e164: string;
    accessToken: string;
    phoneNumberId: string;
    apiVersion: string | undefined;
    locale: string;
    isRetry?: boolean;
  }): Promise<WhatsappSendResult> {
    const { deliveryId, payload, e164, accessToken, phoneNumberId, apiVersion, locale, isRetry = false } = params;
    const ctx: GraphApiRequestContext = { accessToken, apiVersion };
    const { url, init } = buildSendTemplateMessageRequest(ctx, {
      phoneNumberId,
      to: e164,
      templateName: payload.template.name,
      languageCode: payload.template.languageCode ?? "",
      components: payload.components,
    });

    const fetchInit: RequestInit = {
      ...init,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    };

    try {
      const response = await fetch(url, fetchInit);

      if (!response.ok) {
        // On 401, credentials may have been rotated cross-instance (e.g.
        // token refreshed by another server instance). Invalidate the cache
        // and retry once with fresh credentials to avoid a spurious FAILED
        // mark on a transient stale-token condition.
        if (response.status === 401 && !isRetry) {
          logger.warn("MetaCloudApiAdapter: 401 received — invalidating credentials cache and retrying once", {
            deliveryId,
          });
          this.invalidateCredentialsCache();
          const freshCreds = await this.resolveCredentials();
          // Fix 5 (M7): Call executeSend directly without executeWithConcurrencyLimit
          // since the outer call already holds a concurrency slot. Retrying through
          // the wrapper would try to acquire a second slot and block.
          return await this.executeSend({
            deliveryId,
            payload,
            e164,
            accessToken: freshCreds.accessToken,
            phoneNumberId: freshCreds.phoneNumberId,
            apiVersion: freshCreds.apiVersion,
            locale,
            isRetry: true,
          });
        }

        return await this.handleHttpError(deliveryId, response, locale);
      }

      const body = await response.json();
      const result = parseSendTemplateResponse(body);

      await NotificationRepository.updateDeliveryStatus({
        deliveryId,
        status: NotificationDeliveryStatus.SENT,
        providerMessageId: result.providerMessageId,
      });

      logger.info("WhatsApp template message sent successfully", {
        deliveryId,
        providerMessageId: result.providerMessageId,
        recipientWaId: result.recipientWaId,
      });

      await this.recordPairRateLimitSuccess(e164);

      return {
        success: true,
        sendAttempted: true,
        providerMessageId: result.providerMessageId,
      };
    } catch (error) {
      // Q4: fetch was attempted, so budget is consumed even on failure.
      return this.handleSendException(deliveryId, error, locale, true);
    }
  }

  private async recordPairRateLimitSuccess(e164: string): Promise<void> {
    try {
      const key = `${REDIS_PAIR_KEY_PREFIX}${e164}`;
      await redisService.set(key, Date.now().toString(), { ex: PAIR_RATE_LIMIT_TTL_SEC });
    } catch (error) {
      logger.warn("MetaCloudApiAdapter: Redis pair-rate-limit recording failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async handleHttpError(deliveryId: string, response: Response, locale: string): Promise<WhatsappSendResult> {
    const errorBody = await readErrorBody(response);

    const statusCode = response.status;
    const metaErrorCode = extractMetaErrorCode(errorBody);
    const isRateLimited = statusCode === 429 || metaErrorCode === META_ERROR_131056;

    logger.error("MetaCloudApiAdapter: Graph API returned non-2xx", {
      deliveryId,
      statusCode,
      metaErrorCode,
      rateLimited: isRateLimited,
    });

    // B2: Never mark FAILED on rate-limit signals — caller should deferred-retry.
    // r7-022: A bare HTTP 429 (without a Meta 131056 body) previously fell
    // through to `safeMarkFailed`, violating the "never mark FAILED on
    // rate-limit" contract. Short-circuit on ANY rate-limit indicator here
    // (status 429 OR Meta error code 131056).
    if (isRateLimited) {
      return {
        success: false,
        sendAttempted: true,
        rateLimited: true,
        error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
      };
    }

    const failureReason = extractMetaErrorMessage(errorBody) ?? `Graph API error ${statusCode}`;
    await this.safeMarkFailed(deliveryId, failureReason);

    return {
      success: false,
      sendAttempted: true,
      rateLimited: isRateLimited,
      error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
    };
  }

  private async handleSendException(
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

    await this.safeMarkFailed(deliveryId, errorMessage);

    // Q4: sendAttempted indicates whether a Graph API call was actually made.
    // Failed sends that reached Meta still consume portfolioMessagingLimitTier
    // budget; pre-fetch failures (credential resolution, etc.) do not.
    return {
      success: false,
      sendAttempted,
      error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
    };
  }

  private async safeMarkFailed(deliveryId: string, failureReason: string): Promise<void> {
    // r10-011: Sanitize before persisting — Meta error responses can contain
    // internal diagnostic strings, account IDs, cursor tokens, and very long
    // messages that should not be stored in the database as-is.
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
        // Rank guard rejected PENDING→FAILED — delivery stays at current status.
        // Meta's retry webhooks will eventually update it.
        // r7-060: Include BOTH the original `failureReason` (why we wanted
        // to mark FAILED) AND the rank-guard rejection error so operators
        // can debug the double-error condition without losing context.
        logger.warn("MetaCloudApiAdapter: rank guard rejected FAILED transition", {
          deliveryId,
          failureReason: sanitized,
          rankGuardError: msg,
        });
      } else {
        // Genuine DB failure — log at error and re-throw so callers can handle it.
        logger.error("MetaCloudApiAdapter: failed to mark delivery as FAILED (DB error)", {
          deliveryId,
          failureReason: sanitized,
          error: msg,
        });
        throw error;
      }
    }
  }

  // --- Private helpers ---

  private async checkPairRateLimit(e164: string): Promise<number> {
    try {
      const key = `${REDIS_PAIR_KEY_PREFIX}${e164}`;
      const lastStr = await redisService.get(key);
      return computeDeferMs(lastStr, Date.now());
    } catch (error) {
      // Redis unavailable — fall back to local in-memory rate limit
      logger.warn("MetaCloudApiAdapter: Redis pair-rate-limit check failed, using local fallback", {
        e164,
        error: error instanceof Error ? error.message : String(error),
      });
      const now = Date.now();
      const last = this.localPairRateLimit.get(e164);
      const deferMs = computeDeferMs(last?.toString() ?? null, now);
      if (deferMs === 0) {
        this.localPairRateLimit.set(e164, now);
        pruneLocalPairRateLimit(this.localPairRateLimit);
      }
      return deferMs;
    }
  }

  private createDelivery(payload: WhatsappPayload): CreateNotificationDeliveryInput {
    return {
      userId: payload.userId,
      channel: NotificationChannel.WHATSAPP,
      eventType: payload.eventType,
      title: payload.template?.name ?? null,
      body: null,
      metadata: payload.metadata ?? null,
    };
  }

  private async resolveCredentials(): Promise<{ accessToken: string; phoneNumberId: string; apiVersion: string }> {
    const now = Date.now();
    if (this.credentialsCache && now - this.credentialsCache.timestamp < CREDENTIALS_CACHE_TTL_MS) {
      return this.credentialsCache.credentials;
    }

    const account = await WhatsappAccountRepository.findFirstActiveForCredentials();
    if (!account) {
      // Internal startup error — not user-facing, no i18n needed (no active WhatsApp account configured)
      throw new Error("No active WhatsApp account configured");
    }

    const encryptedToken = account.encryptedAccessToken;
    if (!encryptedToken) {
      throw new Error("WhatsApp access token is null");
    }
    const accessToken = decryptField(encryptedToken);
    if (!accessToken) {
      throw new Error("Failed to decrypt WhatsApp access token");
    }

    const phoneNumberId = account.phoneNumberId;
    const apiVersion = "v20.0"; // Default fallback since apiVersion column doesn't exist in schema

    const credentials = {
      accessToken,
      phoneNumberId,
      apiVersion,
    };

    this.credentialsCache = { credentials, timestamp: now };
    return credentials;
  }

  private async handleEmptyRecipient(payload: WhatsappPayload, locale: string): Promise<WhatsappSendResult> {
    logger.warn("MetaCloudApiAdapter: empty recipient in payload", {
      templateName: payload.template?.name,
    });

    return {
      success: false,
      sendAttempted: false,
      error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
    };
  }

  /**
   * Validates the WhatsApp channel configuration by attempting to resolve credentials.
   * Returns true if credentials can be resolved and are valid.
   */
  async validateConfig(): Promise<boolean> {
    try {
      await this.resolveCredentials();
      return true;
    } catch (error) {
      logger.warn("MetaCloudApiAdapter: validateConfig failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Disconnects the adapter by clearing the credentials cache.
   * Called from `resetWhatsappChannel()` during reinitialization.
   */
  async disconnect(): Promise<void> {
    this.invalidateCredentialsCache();
    logger.info("MetaCloudApiAdapter: disconnected, credentials cache invalidated");
  }
}

export { MetaCloudApiAdapter };
