import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { complaints, notificationDeliveries } from "@/backend/db/schema";
import {
  ComplaintStatus,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationEventType,
} from "@/backend/enum";
import {
  isNotificationChannel,
  isNotificationDeliveryStatus,
  isNotificationEventType,
} from "@/backend/services/notification/notification-alerts.helpers";
import type {
  MarkableDeliveryRow,
  NotificationMetadata,
  RecentNotificationRow,
  UnansweredComplaintRow,
} from "@/backend/types";

const ALERTS_PAGE_SIZE = 20;

function toRecentNotificationRow(row: {
  id: string;
  title: string | null;
  body: string | null;
  createdAt: Date;
  status: string;
  eventType: string;
  channel: string;
  metadata: NotificationMetadata | null;
  openedAt: Date | null;
}): RecentNotificationRow {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.createdAt,
    status: isNotificationDeliveryStatus(row.status) ? row.status : NotificationDeliveryStatus.PENDING,
    eventType: isNotificationEventType(row.eventType) ? row.eventType : NotificationEventType.CLASS_REMINDER,
    channel: isNotificationChannel(row.channel) ? row.channel : NotificationChannel.EMAIL,
    metadata: row.metadata,
    openedAt: row.openedAt,
  };
}

function toMarkableDeliveryRow(row: { id: string; status: string }): MarkableDeliveryRow {
  return {
    id: row.id,
    status: isNotificationDeliveryStatus(row.status) ? row.status : NotificationDeliveryStatus.PENDING,
  };
}

export function fetchUnansweredComplaintRows(): Promise<UnansweredComplaintRow[]> {
  return db
    .select({
      id: complaints.id,
      body: complaints.body,
      createdAt: complaints.createdAt,
    })
    .from(complaints)
    .where(and(eq(complaints.status, ComplaintStatus.UNANSWERED), isNull(complaints.deletedAt)))
    .orderBy(desc(complaints.createdAt))
    .limit(ALERTS_PAGE_SIZE);
}

export function fetchRecentNotificationRows(userId: string): Promise<RecentNotificationRow[]> {
  return db
    .select({
      id: notificationDeliveries.id,
      title: notificationDeliveries.title,
      body: notificationDeliveries.body,
      createdAt: notificationDeliveries.createdAt,
      status: notificationDeliveries.status,
      eventType: notificationDeliveries.eventType,
      channel: notificationDeliveries.channel,
      metadata: notificationDeliveries.metadata,
      openedAt: notificationDeliveries.openedAt,
    })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.userId, userId))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(ALERTS_PAGE_SIZE)
    .then(rows => rows.map(toRecentNotificationRow));
}

export async function fetchMarkableDeliveryRows(userId: string): Promise<MarkableDeliveryRow[]> {
  const rows = await db
    .select({
      id: notificationDeliveries.id,
      status: notificationDeliveries.status,
    })
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.userId, userId))
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(ALERTS_PAGE_SIZE);
  return rows.map(toMarkableDeliveryRow);
}
