import { invalidateEnvConfigCache, resolveEnvConfig, resolveEnvConfigMany } from "@/backend/lib/env-config-resolver";
import { logger } from "@/backend/lib/logger";
import type { EmailProvider, IEmailChannel } from "@/backend/services/communication/channels/email/IEmailChannel";

let instance: IEmailChannel | null = null;
let initializationPromise: Promise<IEmailChannel> | null = null;

/**
 * Resolves the active email provider via the DB-first / env-fallback resolver.
 *
 * Defaults to `"resend"` when the resolver returns `undefined`. Any non-`resend`
 * value logs the same warning as the previous synchronous implementation and
 * falls back to `"resend"`.
 */
async function getEmailProvider(): Promise<EmailProvider> {
  const rawProvider = await resolveEnvConfig("EMAIL_PROVIDER");
  const provider = (rawProvider || "resend").toLowerCase();

  if (provider !== "resend") {
    logger.warn(`Invalid EMAIL_PROVIDER: ${provider}. Must be 'resend'. Using 'resend'.`);
    return "resend";
  }

  return provider;
}

/**
 * Constructs the Resend adapter, resolving `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
 * via the DB-first / env-fallback resolver before instantiating the adapter.
 *
 * Missing required values raise the same `RESEND_API_KEY environment variable is required...`
 * / `RESEND_FROM_EMAIL...` errors the adapter threw before, preserving the existing
 * failure surface for callers and tests.
 */
async function createResendAdapter(): Promise<IEmailChannel> {
  logger.info("Initializing Email channel with Resend provider");
  const { ResendEmailAdapter } = await import(
    "@/backend/services/communication/channels/email/resend/ResendEmailAdapter"
  );

  const resolved = await resolveEnvConfigMany(["RESEND_API_KEY", "RESEND_FROM_EMAIL"]);
  const apiKey = resolved.RESEND_API_KEY;
  const fromEmail = resolved.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required for ResendEmailAdapter");
  }
  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL environment variable is required for ResendEmailAdapter");
  }

  return new ResendEmailAdapter({ apiKey, fromEmail });
}

async function createEmailChannel(): Promise<IEmailChannel> {
  const provider = await getEmailProvider();

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
  // Force a fresh DB/env lookup on the next getEmailChannel() call after an
  // override update so the resolver does not serve a stale cached value.
  invalidateEnvConfigCache("EMAIL_PROVIDER");
  invalidateEnvConfigCache("RESEND_API_KEY");
  invalidateEnvConfigCache("RESEND_FROM_EMAIL");
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
