import { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";
import { NotificationChannel } from "@/backend/enum";
import { WhatsappAccountPurpose } from "@/backend/enum/whatsapp/whatsapp-account.enum";
import { logger } from "@/backend/lib/logger";
import { deliveryFailedMessage } from "@/backend/services/communication/utils";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/services/system";
import type { IWhatsappChannel, WhatsappPayload, WhatsappProvider, WhatsappSendResult } from "@/backend/types";

/**
 * Per-account adapter instances. Each `whatsapp_accounts` row gets its own
 * `MetaCloudApiAdapter` so credentials, pair-rate-limit state, and the
 * concurrency budget stay isolated between numbers.
 */
const instances = new Map<string, IWhatsappChannel>();
const initializationPromises = new Map<string, Promise<IWhatsappChannel>>();

/**
 * Tracks in-flight init/send/validate/disconnect operations so that
 * `resetWhatsappChannel` can await them before discarding instances,
 * preventing the singleton-reset race where a concurrent reset
 * discards a disconnected instance while a send is still in progress.
 */
const inFlightOperations = new Set<Promise<unknown>>();
let resetInProgress = false;
let resetWaiter: Promise<void> | null = null;

/**
 * Resolves the active WhatsApp provider via the DB-first / env-fallback resolver.
 * Only `"cloud_api"` is supported (forward-compat slot for future BSP adapters).
 */
async function getWhatsappProvider(): Promise<WhatsappProvider> {
  const raw = (await resolveEnvConfig("WHATSAPP_PROVIDER")) ?? "cloud_api";
  if (raw !== "cloud_api") {
    // Internal startup error — not user-facing, no i18n needed
    throw new Error("ERR_UNKNOWN_PROVIDER");
  }
  return raw;
}

/**
 * Constructs the MetaCloudApiAdapter for one WhatsApp account, resolving
 * global provider config via the DB-first / env-fallback resolver before
 * dynamic-importing the adapter.
 *
 * Per-account credentials (accessToken, phoneNumberId) are NOT resolved here —
 * the adapter resolves the bound account's token on demand so token rotation
 * takes effect without holding plaintext on a long-lived instance.
 */
async function createCloudApiAdapter(accountId: string): Promise<IWhatsappChannel> {
  logger.info("Initializing WhatsApp channel with Meta Cloud API provider", { accountId });
  const { MetaCloudApiAdapter } = await import(
    "@/backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter"
  );

  return new MetaCloudApiAdapter(accountId);
}

async function createWhatsappChannel(accountId: string): Promise<IWhatsappChannel> {
  const provider = await getWhatsappProvider();

  logger.info(`Initializing WhatsApp channel with provider: ${provider}`, { accountId });

  return await createCloudApiAdapter(accountId);
}

/**
 * Lazily instantiates and caches the channel adapter for one WhatsApp
 * account. Callers with no explicit account (legacy dispatch) should go
 * through {@link resolveDefaultAccountId} / the `whatsappChannel` proxy.
 */
export const getWhatsappChannel = async (accountId: string): Promise<IWhatsappChannel> => {
  if (!accountId.trim()) {
    // Internal wiring error — not user-facing, no i18n needed
    throw new Error("getWhatsappChannel: accountId is required");
  }

  // If a reset is in progress, wait for it to complete before (re)initializing
  if (resetInProgress && resetWaiter) {
    await resetWaiter;
  }

  const existing = instances.get(accountId);
  if (existing) {
    return existing;
  }

  let initPromise = initializationPromises.get(accountId);
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const channel = await createWhatsappChannel(accountId);
        instances.set(accountId, channel);
        return channel;
      } catch (error) {
        initializationPromises.delete(accountId);
        logger.error("Failed to initialize WhatsApp channel", { accountId, error });
        throw error;
      }
    })();
    initializationPromises.set(accountId, initPromise);
  }

  void trackInFlight(initPromise);
  return initPromise;
};

/**
 * Resolves the sending channel for a routing purpose: the active account
 * carrying `purpose`, falling back to the active GENERAL account when the
 * purpose has no dedicated number. Returns `null` when no account qualifies —
 * callers translate that into the `whatsapp.noSenderForPurpose` domain error.
 */
export const getChannelForPurpose = async (
  purpose: WhatsappAccountPurpose
): Promise<{ accountId: string; channel: IWhatsappChannel } | null> => {
  const purposeAccount = await WhatsappAccountRepository.findActiveByPurpose(purpose);
  const account =
    purposeAccount ??
    (purpose === WhatsappAccountPurpose.GENERAL ? null : await WhatsappAccountRepository.findActiveGeneral());
  if (!account) {
    return null;
  }
  if (!purposeAccount) {
    logger.warn("getChannelForPurpose: no active account for purpose — routing via GENERAL fallback", {
      purpose,
      accountId: account.id,
    });
  }
  return { accountId: account.id, channel: await getWhatsappChannel(account.id) };
};

/**
 * Legacy default-account resolution for call sites that predate purpose
 * routing. GENERAL only — deliberately no "first active account of any
 * purpose" fallback so sends never borrow an unrelated number's credentials.
 */
async function resolveDefaultAccountId(): Promise<string | null> {
  const account = await WhatsappAccountRepository.findActiveGeneral();
  return account?.id ?? null;
}

/**
 * Per-account health hook: validates that the channel for `accountId` can
 * resolve credentials. Used by aggregate configuration checks and the
 * per-account health surface.
 */
export const validateWhatsappChannelConfig = async (accountId: string): Promise<boolean> => {
  const channel = await getWhatsappChannel(accountId);
  return channel.validateConfig();
};

function trackInFlight<T>(promise: Promise<T>): Promise<T> {
  inFlightOperations.add(promise);
  return promise.finally(() => {
    inFlightOperations.delete(promise);
  });
}

async function waitForInFlight(): Promise<void> {
  if (inFlightOperations.size > 0) {
    logger.info(
      `resetWhatsappChannel: awaiting ${inFlightOperations.size} in-flight WhatsApp operation(s) before reset`
    );
    await Promise.allSettled(inFlightOperations);
  }
}

/**
 * Every env-config key any branch of the WhatsApp channel layer resolves:
 * provider, webhook base URL / HMAC globals, per-sync globals, and the
 * Graph API version / Embedded Signup configuration keys. Every reset path
 * must drop the cache for the whole set so stored settings edits take effect
 * on the next resolution regardless of which account was reset.
 */
const WHATSAPP_ENV_CONFIG_KEYS = [
  "WHATSAPP_PROVIDER",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_WEBHOOK_BASE_URL",
  "WHATSAPP_WABA_ID",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_API_VERSION",
  "WHATSAPP_GRAPH_API_VERSION",
  "WHATSAPP_ES_CONFIG_ID",
] as const;

function invalidateWhatsappEnvConfigCache(): void {
  for (const key of WHATSAPP_ENV_CONFIG_KEYS) {
    invalidateEnvConfigCache(key);
  }
}

/**
 * Drops cached adapter instances so token rotation, deactivation, or
 * offboarding take effect without a process restart.
 *
 * - `resetWhatsappChannel()` drops every account's instance.
 * - `resetWhatsappChannel(accountId)` evicts only that account's adapter —
 *   the offboarding path's eviction hook. Evicted adapters get a fresh
 *   credential lookup on the next send, and offboarded accounts then fail
 *   fast in `resolveCredentials` before any Graph API call.
 *
 * Race-safety: sets a reset flag and awaits any in-flight init/send/validate
 * operations before discarding instances, preventing a reset from discarding
 * a disconnected instance while a send is still using it.
 */
export const resetWhatsappChannel = async (accountId?: string): Promise<void> => {
  // Guard against concurrent reset calls — coalesce them onto a single waiter
  if (resetInProgress && resetWaiter) {
    return resetWaiter;
  }

  resetInProgress = true;
  resetWaiter = (async () => {
    try {
      // Wait for any pending init or send operations to complete
      await waitForInFlight();

      if (accountId) {
        const instance = instances.get(accountId);
        if (instance) {
          await instance.disconnect();
          instances.delete(accountId);
        }
        initializationPromises.delete(accountId);
      } else {
        await Promise.all(Array.from(instances.values(), instance => instance.disconnect()));
        instances.clear();
        initializationPromises.clear();
      }

      invalidateWhatsappEnvConfigCache();
    } finally {
      resetInProgress = false;
      resetWaiter = null;
    }
  })();

  return resetWaiter;
};

/**
 * Legacy account-agnostic proxy kept for dispatch call sites that predate
 * per-account routing. Sends honor `payload.senderAccountId` when the
 * dispatch layer already resolved the account; otherwise they fall back to
 * the default GENERAL-purpose account.
 */
export const whatsappChannel = {
  send: async (payload: WhatsappPayload, locale?: string): Promise<WhatsappSendResult> => {
    const op = (async (): Promise<WhatsappSendResult> => {
      const accountId = payload.senderAccountId ?? (await resolveDefaultAccountId());
      if (!accountId) {
        logger.warn("whatsappChannel proxy: no GENERAL WhatsApp account configured — send aborted", {
          eventType: payload.eventType,
          userId: payload.userId,
        });
        return {
          success: false,
          sendAttempted: false,
          error: deliveryFailedMessage(NotificationChannel.WHATSAPP, locale ?? "en"),
        };
      }
      const channel = await getWhatsappChannel(accountId);
      return channel.send(payload, locale);
    })();
    return trackInFlight(op);
  },
  validateConfig: async () => {
    const op = (async () => {
      const accountId = await resolveDefaultAccountId();
      if (!accountId) {
        return false;
      }
      const channel = await getWhatsappChannel(accountId);
      return channel.validateConfig();
    })();
    return trackInFlight(op);
  },
  disconnect: async () => {
    const op = (async () => {
      await resetWhatsappChannel();
    })();
    return trackInFlight(op);
  },
};
