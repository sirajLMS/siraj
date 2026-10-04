import { NotificationRepository } from "@/backend/db/repo/notifications/notification.repository";
import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel, NotificationDeliveryStatus } from "@/backend/enum";
import { WhatsappAccountOffboardedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { FETCH_TIMEOUT_MS, MAX_CONCURRENT_CALLS, resolveGraphApiVersion } from "@/backend/lib/whatsapp-constants";
import {
  type AdapterConcurrencyState,
  buildCredentialFailureResult,
  buildDeliveryInput,
  buildEmptyRecipientResult,
  CREDENTIALS_CACHE_TTL_MS,
  checkPairRateLimit,
  normalizeSenderKey,
  recordPairRateLimitSuccess,
  resolveHttpErrorResult,
  resolveSendExceptionResult,
  runWithConcurrencyLimit,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.helpers";
import {
  buildSendTemplateMessageRequest,
  parseSendTemplateResponse,
} from "@/backend/services/communication/channels/whatsapp/cloud-api/requests";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import { noFollowRedirectInit, readJsonWithByteBudget } from "@/backend/services/shared";
import type { GraphApiRequestContext, IWhatsappChannel, WhatsappPayload, WhatsappSendResult } from "@/backend/types";

class MetaCloudApiAdapter implements IWhatsappChannel {
  /** Mutable concurrency state shared with the concurrency-limit helper. */
  private readonly concurrency: AdapterConcurrencyState = { activeCalls: 0, waitQueue: [] };

  /** Number of Graph API calls currently in flight. */
  get activeCalls(): number {
    return this.concurrency.activeCalls;
  }

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
   * Local in-memory fallback for pair-rate-limiting when Redis is unavailable.
   * Maps `<sender>:<recipient>` → timestamp of last send, pruned to a bounded
   * size so it cannot grow without limit during extended Redis outages.
   */
  private readonly localPairRateLimit: Map<string, number> = new Map();

  /**
   * In-memory cache for `resolveCredentials`, avoiding a DB query on every
   * `send()` call. Entries become stale after {@link CREDENTIALS_CACHE_TTL_MS};
   * `disconnect()` clears the cache via {@link invalidateCredentialsCache}.
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
      return buildEmptyRecipientResult(payload, locale);
    }

    const e164 = payload.to.trim();

    // Resolve per-account credentials before any side effect: offboarded,
    // inactive, or missing accounts fail fast here without creating a
    // delivery row and without any Graph API call.
    let credentials: { accessToken: string; phoneNumberId: string; senderKey: string; apiVersion: string };
    try {
      credentials = await this.resolveCredentials();
    } catch (error) {
      return buildCredentialFailureResult(payload, error, this.accountId, locale);
    }

    const delivery = await NotificationRepository.createDelivery(buildDeliveryInput(payload));

    try {
      const { accessToken, phoneNumberId, senderKey, apiVersion } = credentials;

      // Pair-rate-limit guard: defer if within the window, never marked FAILED on guard hit.
      const deferredMs = await checkPairRateLimit(senderKey, e164, this.localPairRateLimit);
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
    return runWithConcurrencyLimit(this.concurrency, MAX_CONCURRENT_CALLS, () =>
      this.executeSend({
        deliveryId: params.deliveryId,
        payload: params.payload,
        e164: params.e164,
        accessToken: params.accessToken,
        phoneNumberId: params.phoneNumberId,
        senderKey: params.senderKey,
        apiVersion: params.apiVersion,
        locale: params.locale,
      })
    );
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

        return await resolveHttpErrorResult(deliveryId, response, locale);
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

      await recordPairRateLimitSuccess(senderKey, e164);

      return {
        success: true,
        sendAttempted: true,
        providerMessageId: result.providerMessageId,
      };
    } catch (error) {
      // A fetch was attempted, so budget is consumed even on failure.
      return resolveSendExceptionResult(deliveryId, error, locale, true);
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
    const senderKey = normalizeSenderKey(account.displayPhoneNumber, phoneNumberId);
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
