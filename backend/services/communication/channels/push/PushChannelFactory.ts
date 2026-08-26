import { createChannelFactory } from "@/backend/services/communication/channels/__shared__/channelFactoryBase";
import { resolveEnvConfigMany } from "@/backend/services/system";
import type { IPushChannel } from "@/backend/types";

async function createFcmAdapter(): Promise<IPushChannel> {
  const { FcmPushAdapter } = await import("@/backend/services/communication/channels/push/fcm/FcmPushAdapter");

  const resolved = await resolveEnvConfigMany(["FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"]);

  return new FcmPushAdapter({
    projectId: resolved.FIREBASE_PROJECT_ID,
    privateKey: resolved.FIREBASE_PRIVATE_KEY,
    clientEmail: resolved.FIREBASE_CLIENT_EMAIL,
  });
}

const factory = createChannelFactory<IPushChannel>({
  channelName: "Push",
  providerEnvKey: "PUSH_PROVIDER",
  defaultProvider: "fcm",
  cacheKeysToInvalidate: ["PUSH_PROVIDER", "FIREBASE_PROJECT_ID", "FIREBASE_PRIVATE_KEY", "FIREBASE_CLIENT_EMAIL"],
  createAdapter: createFcmAdapter,
});

export const getPushChannel = factory.getChannel;
export const resetPushChannel = factory.resetChannel;
export const pushChannel = factory.channel;
