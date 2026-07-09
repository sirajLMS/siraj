import { getStringEnv } from "@/backend/lib/env";
import { logger } from "@/backend/lib/logger";
import type { ISmsChannel, SmsProvider } from "@/backend/services/communication/channels/sms/ISmsChannel";

let instance: ISmsChannel | null = null;
let initializationPromise: Promise<ISmsChannel> | null = null;

function getSmsProvider(): SmsProvider {
  const rawProvider = getStringEnv("SMS_PROVIDER");
  const provider = (rawProvider || "twilio").toLowerCase();

  if (provider !== "twilio") {
    logger.warn(`Invalid SMS_PROVIDER: ${provider}. Must be 'twilio'. Using 'twilio'.`);
    return "twilio";
  }

  return provider;
}

async function createTwilioAdapter(): Promise<ISmsChannel> {
  logger.info("Initializing SMS channel with Twilio provider");
  const { TwilioSmsAdapter } = await import("./twilio/TwilioSmsAdapter");
  return new TwilioSmsAdapter();
}

async function createSmsChannel(): Promise<ISmsChannel> {
  const provider = getSmsProvider();

  logger.info(`Initializing SMS channel with provider: ${provider}`);

  if (provider !== "twilio") {
    logger.warn(`Unknown SMS provider: ${provider}, falling back to twilio`);
  }

  return await createTwilioAdapter();
}

export const getSmsChannel = async (): Promise<ISmsChannel> => {
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createSmsChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize SMS channel", error);
      throw error;
    }
  })();

  return initializationPromise;
};

export const resetSmsChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
};

export const smsChannel = {
  send: async (payload: Parameters<ISmsChannel["send"]>[0], locale?: string) => {
    const service = await getSmsChannel();
    return service.send(payload, locale);
  },
  validateConfig: async () => {
    const service = await getSmsChannel();
    return service.validateConfig();
  },
  disconnect: async () => {
    const service = await getSmsChannel();
    return service.disconnect();
  },
};
