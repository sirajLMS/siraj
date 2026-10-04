import type { NotificationAlertsQuery } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NotificationDrawerAlert } from "@/frontend/common/views/dashboard/components/navbar/notifications/types/notificationDrawer.types";
import type { NotificationMetadata } from "@/shared/types/notification-alerts.types";

type RawNotificationAlert = NonNullable<NonNullable<NotificationAlertsQuery["notificationAlerts"]>["alerts"]>[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNotificationMetadata(value: unknown): value is NotificationMetadata {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.entityKind === "string" && typeof value.entityId === "string";
}

function parseNotificationMetadata(value: unknown): NotificationMetadata | null {
  return isNotificationMetadata(value) ? value : null;
}

export function mapAlerts(rawAlerts: RawNotificationAlert[] | null | undefined): readonly NotificationDrawerAlert[] {
  if (!rawAlerts) {
    return [];
  }

  return rawAlerts.map((alert: RawNotificationAlert) => ({
    id: alert.id,
    deliveryId: alert.deliveryId,
    type: alert.type,
    eventType: alert.eventType,
    channel: alert.channel,
    metadata: parseNotificationMetadata(alert.metadata),
    title: alert.title,
    body: alert.body,
    createdAt: alert.createdAt,
    severity: alert.severity,
    readAt: alert.readAt,
  }));
}
