import { logger } from "@/backend/lib/logger";
import { EmailChannel } from "@/backend/services/communication/channels/email.channel";
import { OnAppChannel } from "@/backend/services/communication/channels/on-app.channel";
import type { NotificationEventType } from "@/shared/lib/enum";

export interface CommunicationPayload {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: "on_app" | "email";
  readonly eventType: NotificationEventType;
}

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
