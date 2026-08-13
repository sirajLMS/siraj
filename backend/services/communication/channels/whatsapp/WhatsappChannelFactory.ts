import { logger } from "@/backend/lib/logger";
import { invalidateEnvConfigCache, resolveEnvConfig } from "@/backend/services/system";
import type { IWhatsappChannel, WhatsappProvider } from "@/backend/types";

let instance: IWhatsappChannel | null = null;
let initializationPromise: Promise<IWhatsappChannel> | null = null;

/**
 * Tracks in-flight init/send/validate/disconnect operations so that
 * `resetWhatsappChannel` can await them before discarding the instance,
 * preventing the r11-r10 singleton init race where a concurrent reset
 * discards a disconnected instance while a send is still in progress.
 */
const inFlightOperations = new Set<Promise<unknown>>();
let resetInProgress = false;
let resetWaiter: Promise<void> | null = null;

/**
 * Resolves the active WhatsApp provider via the DB-first / env-fallback resolver.
 * v1 only supports `"cloud_api"` (forward-compat slot for future BSP adapters).
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
 * Constructs the MetaCloudApiAdapter, resolving global WhatsApp config via
 * the DB-first / env-fallback resolver before dynamic-importing the adapter.
 *
 * Per-account credentials (accessToken, phoneNumberId) are NOT resolved here —
 * the adapter decrypts the active account token per send call (S4) so token
 * rotation takes effect without holding plaintext on the singleton.
 */
async function createCloudApiAdapter(): Promise<IWhatsappChannel> {
  logger.info("Initializing WhatsApp channel with Meta Cloud API provider");
  const { MetaCloudApiAdapter } = await import(
    "@/backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter"
  );

  return new MetaCloudApiAdapter();
}

async function createWhatsappChannel(): Promise<IWhatsappChannel> {
  const provider = await getWhatsappProvider();

  logger.info(`Initializing WhatsApp channel with provider: ${provider}`);

  return await createCloudApiAdapter();
}

export const getWhatsappChannel = async (): Promise<IWhatsappChannel> => {
  // If a reset is in progress, wait for it to complete before (re)initializing
  if (resetInProgress && resetWaiter) {
    await resetWaiter;
  }

  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createWhatsappChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize WhatsApp channel", error);
      throw error;
    }
  })();

  void trackInFlight(initializationPromise);
  return initializationPromise;
};

/**
 * Registers a promise in the in-flight set so that `resetWhatsappChannel`
 * can await it before discarding the singleton. The promise is removed
 * from the set once it settles (success or failure).
 */
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
 * S4: Drops the singleton instance and initialization promise so that
 * token rotation (setAccessToken / setTwoStepPin) takes effect without
 * a process restart. Also invalidates the env-config cache for WhatsApp
 * keys so the resolver does not serve stale values on the next init.
 *
 * Race-safety: sets a reset flag and awaits any in-flight init/send/validate
 * operations before disconnecting and discarding the instance, preventing
 * the r11-r10 race where a concurrent reset discards a disconnected instance
 * while a send is still using it.
 */
export const resetWhatsappChannel = async (): Promise<void> => {
  // Guard against concurrent reset calls — coalesce them onto a single waiter
  if (resetInProgress && resetWaiter) {
    return resetWaiter;
  }

  resetInProgress = true;
  resetWaiter = (async () => {
    try {
      // Wait for any pending init or send operations to complete
      await waitForInFlight();

      if (instance) {
        await instance.disconnect();
        instance = null;
      }
      initializationPromise = null;
      invalidateEnvConfigCache("WHATSAPP_PROVIDER");
      invalidateEnvConfigCache("WHATSAPP_APP_SECRET");
      invalidateEnvConfigCache("WHATSAPP_VERIFY_TOKEN");
      invalidateEnvConfigCache("WHATSAPP_WABA_ID");
      invalidateEnvConfigCache("WHATSAPP_ACCESS_TOKEN");
      invalidateEnvConfigCache("WHATSAPP_PHONE_NUMBER_ID");
      invalidateEnvConfigCache("WHATSAPP_API_VERSION");
    } finally {
      resetInProgress = false;
      resetWaiter = null;
    }
  })();

  return resetWaiter;
};

export const whatsappChannel = {
  send: async (payload: Parameters<IWhatsappChannel["send"]>[0], locale?: string) => {
    const op = (async () => {
      const service = await getWhatsappChannel();
      return service.send(payload, locale);
    })();
    return trackInFlight(op);
  },
  validateConfig: async () => {
    const op = (async () => {
      const service = await getWhatsappChannel();
      return service.validateConfig();
    })();
    return trackInFlight(op);
  },
  disconnect: async () => {
    const op = (async () => {
      const service = await getWhatsappChannel();
      return service.disconnect();
    })();
    return trackInFlight(op);
  },
};
