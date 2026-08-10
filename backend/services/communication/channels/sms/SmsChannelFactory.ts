import { logger } from "@/backend/lib/logger";
import type { ISmsChannel, SmsProvider } from "@/backend/services/communication/channels/sms/ISmsChannel";
import { invalidateEnvConfigCache, resolveEnvConfig, resolveEnvConfigMany } from "@/backend/services/system";

let instance: ISmsChannel | null = null;
let initializationPromise: Promise<ISmsChannel> | null = null;

async function getSmsProvider(): Promise<SmsProvider> {
  const rawProvider = await resolveEnvConfig("SMS_PROVIDER");
  const provider = (rawProvider || "twilio").toLowerCase();

  if (provider !== "twilio") {
    logger.warn(`Invalid SMS_PROVIDER: ${provider}. Must be 'twilio'. Using 'twilio'.`);
    return "twilio";
  }

  return provider;
}

async function createTwilioAdapter(): Promise<ISmsChannel> {
  logger.info("Initializing SMS channel with Twilio provider");
  const { TwilioSmsAdapter } = await import("@/backend/services/communication/channels/sms/twilio/TwilioSmsAdapter");

  const config = await resolveEnvConfigMany(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"]);
  const accountSid = config.TWILIO_ACCOUNT_SID;
  const authToken = config.TWILIO_AUTH_TOKEN;
  const fromNumber = config.TWILIO_FROM_NUMBER;

  if (!accountSid) {
    throw new Error("TWILIO_ACCOUNT_SID environment variable is required for TwilioSmsAdapter");
  }
  if (!authToken) {
    throw new Error("TWILIO_AUTH_TOKEN environment variable is required for TwilioSmsAdapter");
  }
  if (!fromNumber) {
    throw new Error("TWILIO_FROM_NUMBER environment variable is required for TwilioSmsAdapter");
  }

  return new TwilioSmsAdapter({ accountSid, authToken, fromNumber });
}

async function createSmsChannel(): Promise<ISmsChannel> {
  const provider = await getSmsProvider();

  logger.info(`Initializing SMS channel with provider: ${provider}`);

  if (provider !== "twilio") {
    logger.warn(`Unknown SMS provider: ${String(provider)}, falling back to twilio`);
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
    void instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
  // An env-config override update must force a fresh init on the next
  // getSmsChannel() call, so drop the cached resolver entries for the SMS
  // provider selection and the Twilio credential triple.
  invalidateEnvConfigCache("SMS_PROVIDER");
  invalidateEnvConfigCache("TWILIO_ACCOUNT_SID");
  invalidateEnvConfigCache("TWILIO_AUTH_TOKEN");
  invalidateEnvConfigCache("TWILIO_FROM_NUMBER");
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
