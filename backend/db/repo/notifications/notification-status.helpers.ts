import { sql } from "drizzle-orm";
import { DELIVERY_STATUS_RANK } from "@/backend/db/repo/notifications/notification-status.constants";
import { NotificationDeliveryStatus } from "@/backend/enum";
import type { NotificationDeliverySelectType } from "@/backend/types";

// Lookup map from the raw DB status string to the NotificationDeliveryStatus enum.
// The pgEnum column infers as `string` at the Drizzle level, so this map restores
// the enum type without resorting to an unsafe type assertion.
const DELIVERY_STATUS_LOOKUP: Record<string, NotificationDeliveryStatus> = {
  [NotificationDeliveryStatus.PENDING]: NotificationDeliveryStatus.PENDING,
  [NotificationDeliveryStatus.SENT]: NotificationDeliveryStatus.SENT,
  [NotificationDeliveryStatus.DELIVERED]: NotificationDeliveryStatus.DELIVERED,
  [NotificationDeliveryStatus.OPENED]: NotificationDeliveryStatus.OPENED,
  [NotificationDeliveryStatus.FAILED]: NotificationDeliveryStatus.FAILED,
};

export const toDeliveryStatus = (value: string): NotificationDeliveryStatus => {
  const status = DELIVERY_STATUS_LOOKUP[value];
  if (!status) {
    throw new Error(`Invalid NotificationDeliveryStatus: ${value}`);
  }
  return status;
};

/** Timestamp columns to write when moving a delivery into `status`. */
export function buildStatusTimestamps(
  status: NotificationDeliveryStatus,
  now: Date
): Pick<NotificationDeliverySelectType, "sentAt" | "deliveredAt" | "openedAt" | "failedAt"> {
  switch (status) {
    case NotificationDeliveryStatus.SENT:
      return { sentAt: now, deliveredAt: null, openedAt: null, failedAt: null };
    case NotificationDeliveryStatus.DELIVERED:
      return { sentAt: now, deliveredAt: now, openedAt: null, failedAt: null };
    case NotificationDeliveryStatus.OPENED:
      return { sentAt: now, deliveredAt: now, openedAt: now, failedAt: null };
    case NotificationDeliveryStatus.FAILED:
      return { sentAt: null, deliveredAt: null, openedAt: null, failedAt: now };
    default:
      return { sentAt: null, deliveredAt: null, openedAt: null, failedAt: null };
  }
}

// B3: SQL rank guard for ON CONFLICT branch — mirrors isValidStatusTransition:
//   nextRank > currentRank || status === FAILED || (currentRank === -1 && nextRank > 0)
// IMPORTANT: These SQL CASE values must stay in sync with DELIVERY_STATUS_RANK
// in notification-status.constants.ts. The values are derived from the actual
// NotificationDeliveryStatus enum members and DELIVERY_STATUS_RANK map so any
// drift surfaces at compile time.
export const buildStatusRankSql = (col: unknown) =>
  sql<number>`CASE ${col} WHEN ${NotificationDeliveryStatus.PENDING} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.PENDING]} WHEN ${NotificationDeliveryStatus.SENT} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.SENT]} WHEN ${NotificationDeliveryStatus.DELIVERED} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.DELIVERED]} WHEN ${NotificationDeliveryStatus.OPENED} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.OPENED]} WHEN ${NotificationDeliveryStatus.FAILED} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.FAILED]} ELSE -2 END`.mapWith(
    Number
  );

// Same rank mapping applied to an incoming status literal (rather than a column),
// used by the ON CONFLICT rank guard to compare the incoming rank against the stored rank.
export const buildIncomingStatusRankSql = (status: NotificationDeliveryStatus) =>
  sql<number>`(CASE WHEN ${status} = ${NotificationDeliveryStatus.PENDING} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.PENDING]} WHEN ${status} = ${NotificationDeliveryStatus.SENT} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.SENT]} WHEN ${status} = ${NotificationDeliveryStatus.DELIVERED} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.DELIVERED]} WHEN ${status} = ${NotificationDeliveryStatus.OPENED} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.OPENED]} WHEN ${status} = ${NotificationDeliveryStatus.FAILED} THEN ${DELIVERY_STATUS_RANK[NotificationDeliveryStatus.FAILED]} ELSE -2 END)`.mapWith(
    Number
  );
