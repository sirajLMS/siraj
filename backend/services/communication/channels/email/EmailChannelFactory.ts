import { createChannelFactory } from "@/backend/services/communication/channels/__shared__/channelFactoryBase";
import { resolveEnvConfigMany } from "@/backend/services/system";
import type { IEmailChannel } from "@/backend/types";

async function createResendAdapter(): Promise<IEmailChannel> {
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

const factory = createChannelFactory<IEmailChannel>({
  channelName: "Email",
  providerEnvKey: "EMAIL_PROVIDER",
  defaultProvider: "resend",
  cacheKeysToInvalidate: ["EMAIL_PROVIDER", "RESEND_API_KEY", "RESEND_FROM_EMAIL"],
  createAdapter: createResendAdapter,
});

export const getEmailChannel = factory.getChannel;
export const resetEmailChannel = factory.resetChannel;
export const emailChannel = factory.channel;
