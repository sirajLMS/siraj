import { NotificationRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib";
import type { CommunicationPayload } from "@/backend/types";
import { NotificationChannel } from "@/shared/lib/enum";

export namespace OnAppChannel {
  export async function send(payload: CommunicationPayload, _locale?: string): Promise<void> {
    try {
      await NotificationRepository.createDelivery({
        userId: payload.userId,
        channel: NotificationChannel.ON_APP,
        eventType: payload.eventType,
        title: payload.title,
        body: payload.body,
      });

      logger.info("On-app notification delivery created", {
        userId: payload.userId,
        eventType: payload.eventType,
        title: payload.title,
      });
    } catch (error) {
      logger.error("OnAppChannel.send failed", {
        userId: payload.userId,
        eventType: payload.eventType,
        error,
      });
      throw error;
    }
  }
}
