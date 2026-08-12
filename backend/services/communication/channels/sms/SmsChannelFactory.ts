import { createChannelFactory } from "@/backend/services/communication/channels/__shared__/channelFactoryBase";
import type { ISmsChannel } from "@/backend/services/communication/channels/sms/ISmsChannel";
import { resolveEnvConfigMany } from "@/backend/services/system";

async function createTwilioAdapter(): Promise<ISmsChannel> {
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

const factory = createChannelFactory<ISmsChannel>({
  channelName: "SMS",
  providerEnvKey: "SMS_PROVIDER",
  defaultProvider: "twilio",
  cacheKeysToInvalidate: ["SMS_PROVIDER", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"],
  createAdapter: createTwilioAdapter,
});

export const getSmsChannel = factory.getChannel;
export const resetSmsChannel = factory.resetChannel;
export const smsChannel = factory.channel;
