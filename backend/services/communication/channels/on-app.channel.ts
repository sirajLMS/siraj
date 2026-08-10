import { NotificationRepository } from "@/backend/db/repo";
import { NotificationChannel } from "@/backend/enum";
import { logger } from "@/backend/lib";
import type { CommunicationPayload, NotificationMetadata } from "@/backend/types";

const VALID_ENTITY_KINDS = new Set<string>([
  "invoice",
  "class",
  "student",
  "complaint",
  "suggestion",
  "paymentMethod",
  "schedule",
  "lessonReport",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNotificationMetadata(value: unknown): value is NotificationMetadata {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.entityKind === "string" &&
    VALID_ENTITY_KINDS.has(value.entityKind) &&
    typeof value.entityId === "string"
  );
}

function asNotificationMetadata(metadata: Record<string, unknown> | undefined): NotificationMetadata | null {
  if (!metadata || !isNotificationMetadata(metadata)) {
    return null;
  }
  return metadata;
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
