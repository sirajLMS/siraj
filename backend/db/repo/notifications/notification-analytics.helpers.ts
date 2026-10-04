import { and, count, desc, eq, gt, gte, lte, type SQL, sql } from "drizzle-orm";
import type { QueryDbHandle } from "@/backend/db";
import { toDeliveryStatus } from "@/backend/db/repo/notifications/notification-status.helpers";
import { notificationDeliveries } from "@/backend/db/schema";
import { NotificationChannel, NotificationDeliveryStatus, type NotificationEventType } from "@/backend/enum";
import type {
  DBTransaction,
  NotificationDeliveryAnalyticsFilter,
  NotificationDeliveryAnalyticsResult,
  NotificationDeliveryStatusCount,
  UserDeliveryHistoryResult,
} from "@/backend/types";

/** Pagination and optional filters for a user's delivery history. */
export interface DeliveryHistoryOptions {
  limit: number;
  offset: number;
  channel?: NotificationChannel;
  eventType?: NotificationEventType;
}

function buildAnalyticsConditions(filters: NotificationDeliveryAnalyticsFilter): SQL[] {
  const conditions: SQL[] = [];

  if (filters.userId) {
    conditions.push(eq(notificationDeliveries.userId, filters.userId));
  }
  if (filters.channel) {
    conditions.push(eq(notificationDeliveries.channel, filters.channel));
  }
  if (filters.eventType) {
    conditions.push(eq(notificationDeliveries.eventType, filters.eventType));
  }
  if (filters.startDate) {
    conditions.push(gte(notificationDeliveries.createdAt, filters.startDate));
  }
  if (filters.endDate) {
    conditions.push(lte(notificationDeliveries.createdAt, filters.endDate));
  }

  return conditions;
}

export async function runDeliveryAnalytics(
  q: QueryDbHandle | DBTransaction,
  filters: NotificationDeliveryAnalyticsFilter
): Promise<NotificationDeliveryAnalyticsResult> {
  const conditions = buildAnalyticsConditions(filters);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ totalDeliveries }] = await q
    .select({ totalDeliveries: count() })
    .from(notificationDeliveries)
    .where(whereClause);

  const statusCounts = await q
    .select({
      status: notificationDeliveries.status,
      count: count(),
    })
    .from(notificationDeliveries)
    .where(whereClause)
    .groupBy(notificationDeliveries.status);

  const normalizedStatusCounts: NotificationDeliveryStatusCount[] = statusCounts.map(row => ({
    status: toDeliveryStatus(row.status),
    count: row.count,
  }));

  const openedCount = normalizedStatusCounts.find(row => row.status === NotificationDeliveryStatus.OPENED)?.count ?? 0;
  const failedCount = normalizedStatusCounts.find(row => row.status === NotificationDeliveryStatus.FAILED)?.count ?? 0;

  return {
    totalDeliveries,
    statusCounts: normalizedStatusCounts,
    openRate: totalDeliveries === 0 ? 0 : openedCount / totalDeliveries,
    failureRate: totalDeliveries === 0 ? 0 : failedCount / totalDeliveries,
  };
}

export async function runDeliveryHistory(
  q: QueryDbHandle | DBTransaction,
  userId: string,
  options: DeliveryHistoryOptions
): Promise<UserDeliveryHistoryResult> {
  const conditions: SQL[] = [eq(notificationDeliveries.userId, userId)];

  if (options.channel) {
    conditions.push(eq(notificationDeliveries.channel, options.channel));
  }

  if (options.eventType) {
    conditions.push(eq(notificationDeliveries.eventType, options.eventType));
  }

  const whereClause = and(...conditions);

  const rows = await q
    .select()
    .from(notificationDeliveries)
    .where(whereClause)
    .orderBy(desc(notificationDeliveries.createdAt))
    .limit(options.limit)
    .offset(options.offset);

  const [totalCount] = await q.select({ count: count() }).from(notificationDeliveries).where(whereClause);

  return {
    rows,
    totalCount: totalCount?.count ?? 0,
  };
}

export async function countSmsInLastHour(q: QueryDbHandle | DBTransaction, userId: string): Promise<number> {
  const [result] = await q
    .select({
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(notificationDeliveries)
    .where(
      and(
        eq(notificationDeliveries.userId, userId),
        eq(notificationDeliveries.channel, NotificationChannel.SMS),
        gt(notificationDeliveries.createdAt, new Date(Date.now() - 60 * 60 * 1000))
      )
    );

  return result?.count ?? 0;
}
