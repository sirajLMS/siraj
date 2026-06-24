import { logger } from "@/backend/lib";
import { EmailChannel, OnAppChannel } from "@/backend/services";
import type { CommunicationPayload } from "@/backend/types";

export namespace CommunicationService {
  export async function dispatch(payload: CommunicationPayload, locale?: string): Promise<void> {
    try {
      switch (payload.channel) {
        case "on_app":
          await OnAppChannel.send(payload, locale);
          break;
        case "email":
          await EmailChannel.send(payload, locale);
          break;
        default: {
          const exhaustiveCheck: never = payload.channel;
          logger.error("Unknown communication channel", { channel: exhaustiveCheck, userId: payload.userId });
          break;
        }
      }
    } catch (error) {
      logger.error("CommunicationService.dispatch failed", {
        userId: payload.userId,
        channel: payload.channel,
        eventType: payload.eventType,
        error,
      });
      throw error;
    }
  }
}
