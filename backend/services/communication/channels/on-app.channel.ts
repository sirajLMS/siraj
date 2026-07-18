import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel } from "@/backend/enum";
import { logger } from "@/backend/lib";
import type { CommunicationPayload, NotificationMetadata } from "@/backend/types";

function asNotificationMetadata(metadata: Record<string, unknown> | undefined): NotificationMetadata | null {
  if (!metadata || typeof metadata.entityKind !== "string" || typeof metadata.entityId !== "string") {
    return null;
  }
  return metadata as unknown as NotificationMetadata;
}

export namespace OnAppChannel {
  export async function send(payload: CommunicationPayload, _locale?: string): Promise<void> {
    try {
      await NotificationRepository.createDelivery({
        userId: payload.userId,
        channel: NotificationChannel.ON_APP,
        eventType: payload.eventType,
        title: payload.title,
        body: payload.body,
        metadata: asNotificationMetadata(payload.metadata),
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
