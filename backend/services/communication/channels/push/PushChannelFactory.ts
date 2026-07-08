import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { IPushChannel, PushProvider } from "./IPushChannel";

let instance: IPushChannel | null = null;
let initializationPromise: Promise<IPushChannel> | null = null;

function getPushProvider(): PushProvider {
  const rawProvider = getStringEnv("PUSH_PROVIDER");
  const provider = (rawProvider || "fcm").toLowerCase();

  if (provider !== "fcm") {
    logger.warn(`Invalid PUSH_PROVIDER: ${provider}. Must be 'fcm'. Using 'fcm'.`);
    return "fcm";
  }

  return provider;
}

async function createFcmAdapter(): Promise<IPushChannel> {
  logger.info("Initializing Push channel with FCM provider");
  const { FcmPushAdapter } = await import("./fcm/FcmPushAdapter");
  return new FcmPushAdapter();
}

async function createPushChannel(): Promise<IPushChannel> {
  const provider = getPushProvider();

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

export const resetPushChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
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
