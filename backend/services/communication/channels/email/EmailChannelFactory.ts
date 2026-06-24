import { logger } from "@/backend/lib/logger";
import type { EmailProvider, IEmailChannel } from "./IEmailChannel";

let instance: IEmailChannel | null = null;
let initializationPromise: Promise<IEmailChannel> | null = null;

function getEmailProvider(): EmailProvider {
  const rawProvider = process.env.EMAIL_PROVIDER as string | undefined;
  const provider = (rawProvider || "resend").toLowerCase();

  if (provider !== "resend") {
    logger.warn(`Invalid EMAIL_PROVIDER: ${provider}. Must be 'resend'. Using 'resend'.`);
    return "resend";
  }

  return provider;
}

async function createResendAdapter(): Promise<IEmailChannel> {
  logger.info("Initializing Email channel with Resend provider");
  const { ResendEmailAdapter } = await import("./resend/ResendEmailAdapter");
  return new ResendEmailAdapter();
}

async function createEmailChannel(): Promise<IEmailChannel> {
  const provider = getEmailProvider();

  logger.info(`Initializing Email channel with provider: ${provider}`);

  if (provider !== "resend") {
    logger.warn(`Unknown email provider: ${provider}, falling back to resend`);
  }

  return await createResendAdapter();
}

export const getEmailChannel = async (): Promise<IEmailChannel> => {
  if (instance) {
    return instance;
  }

  initializationPromise ??= (async () => {
    try {
      const service = await createEmailChannel();
      instance = service;
      return instance;
    } catch (error) {
      initializationPromise = null;
      logger.error("Failed to initialize email channel", error);
      throw error;
    }
  })();

  return initializationPromise;
};

export const resetEmailChannel = (): void => {
  if (instance) {
    instance.disconnect();
    instance = null;
  }
  initializationPromise = null;
};

export const emailChannel = {
  send: async (payload: Parameters<IEmailChannel["send"]>[0], locale?: string) => {
    const service = await getEmailChannel();
    return service.send(payload, locale);
  },
  validateConfig: async () => {
    const service = await getEmailChannel();
    return service.validateConfig();
  },
  disconnect: async () => {
    const service = await getEmailChannel();
    return service.disconnect();
  },
};
