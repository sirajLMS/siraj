import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { WhatsappAccountOffboardedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { FETCH_TIMEOUT_MS, MAX_CONCURRENT_CALLS, resolveGraphApiVersion } from "@/backend/lib/whatsapp-constants";
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
import {
  noFollowRedirectInit,
  readJsonWithByteBudget,
  readResponseBodyWithByteBudget,
} from "@/backend/services/shared";
import type {
  CreateNotificationDeliveryInput,
  GraphApiRequestContext,
  IWhatsappChannel,
  WhatsappPayload,
  WhatsappSendResult,
} from "@/backend/types";

/** Pair-rate-limit window: no two messages to the same recipient within 6 seconds (B2). */
const PAIR_RATE_LIMIT_MS = 6000;

/** Redis key TTL for the pair-rate-limit timestamp. Entries self-expire after 60 seconds. */
const PAIR_RATE_LIMIT_TTL_SEC = 60;

/** Meta error code 131056 — recipient-only rate limit; defer, do not mark FAILED (B2). */
const META_ERROR_131056 = 131056;

/**
 * Prefix for Redis pair-rate-limit keys: `whatsapp:pair:<sender>:<recipient>`.
 * The sender segment is the sending account's E.164 display number (digits),
 * falling back to its Meta `phone_number_id` when no display number is synced.
 */
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
   * The `whatsapp_accounts` row this adapter instance is bound to. One
   * adapter instance per account keeps credentials and pair-rate limits
   * isolated between numbers; instances are created/cached by
   * `WhatsappChannelFactory`.
   */
  private readonly accountId: string;

  constructor(accountId: string) {
    if (!accountId.trim()) {
      // Internal wiring error — not user-facing, no i18n needed
      throw new Error("MetaCloudApiAdapter: accountId must be a non-empty string");
    }
    this.accountId = accountId;
  }

  /**
   * Local in-memory fallback for pair-rate-limiting when Redis is
   * unavailable (r10-017). Maps `<sender>:<recipient>` → timestamp of last send.
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
   *  - Manual: `resetWhatsappChannel(accountId)` calls `disconnect()` on this
   *    instance which invokes {@link invalidateCredentialsCache}.
   */
  private credentialsCache: {
    credentials: { accessToken: string; phoneNumberId: string; senderKey: string; apiVersion: string };
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

    // Resolve per-account credentials before any side effect: offboarded,
    // inactive, or missing accounts fail fast here without creating a
    // delivery row and without any Graph API call.
    let credentials: { accessToken: string; phoneNumberId: string; senderKey: string; apiVersion: string };
    try {
      credentials = await this.resolveCredentials();
    } catch (error) {
      return this.handleCredentialFailure(payload, error, locale);
    }

    const delivery = await NotificationRepository.createDelivery(this.createDelivery(payload));

    try {
      const { accessToken, phoneNumberId, senderKey, apiVersion } = credentials;

      // Pair-rate-limit guard (B2): defer if within 6s window, never marked FAILED on guard hit.
      const deferredMs = await this.checkPairRateLimit(senderKey, e164);
      if (deferredMs > 0) {
        logger.info("MetaCloudApiAdapter: deferring send due to pair-rate-limit", {
          accountId: this.accountId,
          senderKey,
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
        senderKey,
        apiVersion,
        locale,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error("MetaCloudApiAdapter: send failed", {
        deliveryId: delivery.id,
        accountId: this.accountId,
        error: errorMessage,
      });

      return {
        success: false,
        sendAttempted: false,
        error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
      };
    }
  }

  /**
   * Failure during credential resolution — before any delivery row or Graph
   * API call. Offboarded accounts surface the `whatsapp.accountOffboarded`
   * domain code; every other failure stays a generic misconfiguration.
   */
  private handleCredentialFailure(payload: WhatsappPayload, error: unknown, locale: string): WhatsappSendResult {
    if (error instanceof WhatsappAccountOffboardedError) {
      logger.logDomainError("MetaCloudApiAdapter: send to offboarded account — fail fast before Graph call", {
        accountId: this.accountId,
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
      accountId: this.accountId,
      error: errorMessage,
    });

    return {
      success: false,
      sendAttempted: false,
      error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale),
    };
  }

  private async executeWithConcurrencyLimit(params: {
    deliveryId: string;
    payload: WhatsappPayload;
    e164: string;
    accessToken: string;
    phoneNumberId: string;
    senderKey: string;
    apiVersion: string;
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
        senderKey: params.senderKey,
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
    senderKey: string;
    apiVersion: string;
    locale: string;
    isRetry?: boolean;
  }): Promise<WhatsappSendResult> {
    const {
      deliveryId,
      payload,
      e164,
      accessToken,
      phoneNumberId,
      senderKey,
      apiVersion,
      locale,
      isRetry = false,
    } = params;
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
      ...noFollowRedirectInit(),
    };

    try {
      const response = await fetch(url, fetchInit);

      if (!response.ok) {
        if (response.status === 401 && !isRetry) {
          return await this.retryAfterTokenRefresh(deliveryId, payload, e164, locale);
        }

        return await this.handleHttpError(deliveryId, response, locale);
      }

      const body = await readJsonWithByteBudget(response);
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

      await this.recordPairRateLimitSuccess(senderKey, e164);

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

  /**
   * On 401, credentials may have been rotated cross-instance (e.g. refreshed
   * by another server instance). Invalidate the cache and retry once with
   * fresh credentials to avoid a spurious FAILED mark on a transient
   * stale-token condition. The retry calls `executeSend` directly because the
   * outer call already holds a concurrency slot — routing through the wrapper
   * would try to acquire a second slot and block.
   */
  private async retryAfterTokenRefresh(
    deliveryId: string,
    payload: WhatsappPayload,
    e164: string,
    locale: string
  ): Promise<WhatsappSendResult> {
    logger.warn("MetaCloudApiAdapter: 401 received — invalidating credentials cache and retrying once", {
      deliveryId,
    });
    this.invalidateCredentialsCache();
    const freshCreds = await this.resolveCredentials();
    return this.executeSend({
      deliveryId,
      payload,
      e164,
      accessToken: freshCreds.accessToken,
      phoneNumberId: freshCreds.phoneNumberId,
      senderKey: freshCreds.senderKey,
      apiVersion: freshCreds.apiVersion,
      locale,
      isRetry: true,
    });
  }

  private async recordPairRateLimitSuccess(senderKey: string, e164: string): Promise<void> {
    try {
      const key = `${REDIS_PAIR_KEY_PREFIX}${senderKey}:${e164}`;
      await redisService.set(key, Date.now().toString(), { ex: PAIR_RATE_LIMIT_TTL_SEC });
    } catch (error) {
      logger.warn("MetaCloudApiAdapter: Redis pair-rate-limit recording failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async handleHttpError(deliveryId: string, response: Response, locale: string): Promise<WhatsappSendResult> {
    // Budgeted read of Meta's error envelope (structured JSON when present,
    // raw text otherwise). Replaces `readErrorBody` here so error bodies are
    // also bounded by the response-size guard.
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

  private async checkPairRateLimit(senderKey: string, e164: string): Promise<number> {
    const pairKey = `${senderKey}:${e164}`;
    try {
      const key = `${REDIS_PAIR_KEY_PREFIX}${pairKey}`;
      const lastStr = await redisService.get(key);
      return computeDeferMs(lastStr, Date.now());
    } catch (error) {
      // Redis unavailable — fall back to local in-memory rate limit
      logger.warn("MetaCloudApiAdapter: Redis pair-rate-limit check failed, using local fallback", {
        pairKey,
        error: error instanceof Error ? error.message : String(error),
      });
      const now = Date.now();
      const last = this.localPairRateLimit.get(pairKey);
      const deferMs = computeDeferMs(last?.toString() ?? null, now);
      if (deferMs === 0) {
        this.localPairRateLimit.set(pairKey, now);
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

  /**
   * Derives the sender segment for pair-rate-limit keys: digits of the
   * account's display phone number, falling back to the Meta
   * `phone_number_id` when no display number has been synced yet.
   */
  private static normalizeSenderKey(displayPhoneNumber: string | null, phoneNumberId: string): string {
    const digits = displayPhoneNumber?.replace(/\D/g, "") ?? "";
    return digits.length > 0 ? digits : phoneNumberId;
  }

  /**
   * Resolves credentials for this adapter's bound account only. There is no
   * cross-account fallback: a send addressed to account A must never borrow
   * account B's token. Offboarded accounts throw
   * {@link WhatsappAccountOffboardedError} before any Graph API call.
   */
  private async resolveCredentials(): Promise<{
    accessToken: string;
    phoneNumberId: string;
    senderKey: string;
    apiVersion: string;
  }> {
    const now = Date.now();
    if (this.credentialsCache && now - this.credentialsCache.timestamp < CREDENTIALS_CACHE_TTL_MS) {
      return this.credentialsCache.credentials;
    }

    const account = await WhatsappAccountRepository.findCredentialsById(this.accountId);
    if (account?.offboardedAt) {
      throw new WhatsappAccountOffboardedError();
    }
    if (!account?.isActive) {
      // Internal misconfiguration — not user-facing, no i18n needed
      throw new Error("No active WhatsApp account configured");
    }

    // `encryptedText.fromDriver` decrypts at the driver boundary — the value
    // arriving here is already the plaintext token (null when unset).
    const accessToken = account.encryptedAccessToken;
    if (!accessToken) {
      throw new Error("WhatsApp access token is null");
    }

    const phoneNumberId = account.phoneNumberId;
    const senderKey = MetaCloudApiAdapter.normalizeSenderKey(account.displayPhoneNumber, phoneNumberId);
    const apiVersion = await resolveGraphApiVersion();

    const credentials = {
      accessToken,
      phoneNumberId,
      senderKey,
      apiVersion,
    };

    this.credentialsCache = { credentials, timestamp: now };
    return credentials;
  }

  private async handleEmptyRecipient(payload: WhatsappPayload, locale: string): Promise<WhatsappSendResult> {
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
