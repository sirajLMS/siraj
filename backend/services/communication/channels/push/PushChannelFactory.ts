import { invalidateEnvConfigCache, resolveEnvConfig, resolveEnvConfigMany } from "@/backend/lib/env-config-resolver";
import { logger } from "@/backend/lib/logger";
import type { IPushChannel, PushProvider } from "@/backend/services/communication/channels/push/IPushChannel";

let instance: IPushChannel | null = null;
let initializationPromise: Promise<IPushChannel> | null = null;

/**
 * Resolves the active push provider via the DB-first / env-fallback resolver.
 *
 * Preserves the original fallback chain:
 *  - When `PUSH_PROVIDER` is unset, defaults to `"fcm"`.
 *  - When the resolved value is not `"fcm"`, logs the same warn and falls back to `"fcm"`.
 */
async function getPushProvider(): Promise<PushProvider> {
  const rawProvider = (await resolveEnvConfig("PUSH_PROVIDER")) || "fcm";
  const provider = rawProvider.toLowerCase();

  if (provider !== "fcm") {
    logger.warn(`Invalid PUSH_PROVIDER: ${provider}. Must be 'fcm'. Using 'fcm'.`);
    return "fcm";
  }

  return provider;
}

/**
 * Constructs the FCM push adapter, resolving the Firebase service-account
 * credentials from `system_settings` overrides (falling back to `process.env`)
 * via the env-config resolver, then passing them explicitly to the adapter's
 * DI constructor. Missing-credential errors are propagated unchanged so
 * callers see the same `FIREBASE_* environment variable is required for FcmPushAdapter`
 * messages the adapter throws internally.
 */
async function createFcmAdapter(): Promise<IPushChannel> {
  logger.info("Initializing Push channel with FCM provider");
  const { FcmPushAdapter } = await import("@/backend/services/communication/channels/push/fcm/FcmPushAdapter");

  const resolved = await resolveEnvConfigMany(["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"]);

  return new FcmPushAdapter({
    projectId: resolved.FIREBASE_PROJECT_ID,
    privateKey: resolved.FIREBASE_PRIVATE_KEY,
    clientEmail: resolved.FIREBASE_CLIENT_EMAIL,
  });
}

async function createPushChannel(): Promise<IPushChannel> {
  const provider = await getPushProvider();

  logger.info(`Initializing Push channel with provider: ${provider}`);

  if (provider !== "fcm") {
    logger.warn(`Unknown push provider: ${provider}, falling back to fcm`);
  }

  return await createFcmAdapter();
}

export const getPushChannel = async (): Promise<IPushChannel> => {
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createPushChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize push channel", error);
      throw error;
    }
  })();

  return initializationPromise;
};

/**
 * Tears down the singleton and invalidates the env-config cache entries used to
 * build it, so a subsequent `getPushChannel()` re-resolves `PUSH_PROVIDER` and
 * the `FIREBASE_*` credentials from a freshly-queried `system_settings` row.
 *
 * Invalidation is a no-op for keys that are `excludeFromDb` (never cached), and
 * is a safe no-op when the cache has no matching entry.
 */
export const resetPushChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;

  invalidateEnvConfigCache("PUSH_PROVIDER");
  invalidateEnvConfigCache("FIREBASE_PROJECT_ID");
  invalidateEnvConfigCache("FIREBASE_PRIVATE_KEY");
  invalidateEnvConfigCache("FIREBASE_CLIENT_EMAIL");
};

export const pushChannel = {
  send: async (payload: Parameters<IPushChannel["send"]>[0], locale?: string) => {
    const service = await getPushChannel();
    return service.send(payload, locale);
  },
  validateConfig: async () => {
    const service = await getPushChannel();
    return service.validateConfig();
  },
  disconnect: async () => {
    const service = await getPushChannel();
    return service.disconnect();
  },
};
