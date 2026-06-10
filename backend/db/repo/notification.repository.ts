import { and, count, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { notificationDeliveries, userDeviceTokens } from "@/backend/db/schema";
import type * as Types from "@/backend/types";
import { NotificationDeliveryStatus } from "@/lib/enum";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const STATUS_ORDER: Record<NotificationDeliveryStatus, number> = {
  [NotificationDeliveryStatus.PENDING]: 0,
  [NotificationDeliveryStatus.SENT]: 1,
  [NotificationDeliveryStatus.DELIVERED]: 2,
  [NotificationDeliveryStatus.OPENED]: 3,
  [NotificationDeliveryStatus.FAILED]: 4,
};

export namespace NotificationRepository {
  async function acquireDeviceTokenLock(tx: DBTransaction, userId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('device_token_user_' || ${userId}::text))`);
  }

  async function acquireDeliveryLock(tx: DBTransaction, deliveryId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('notification_delivery_' || ${deliveryId}::text))`);
  }

  function assertValidStatusTransition(
    currentStatus: NotificationDeliveryStatus,
    nextStatus: NotificationDeliveryStatus
  ): void {
    if (currentStatus === nextStatus) {
      return;
    }

    if (currentStatus === NotificationDeliveryStatus.FAILED) {
      throw new Error(`Cannot transition delivery from FAILED to ${nextStatus}`);
    }

    if (nextStatus === NotificationDeliveryStatus.FAILED) {
      return;
    }

    if (STATUS_ORDER[nextStatus] <= STATUS_ORDER[currentStatus]) {
      throw new Error(`Invalid delivery status transition from ${currentStatus} to ${nextStatus}`);
    }
  }

  function buildStatusTimestamps(
    status: NotificationDeliveryStatus,
    now: Date
  ): Pick<Types.NotificationDeliverySelectType, "sentAt" | "deliveredAt" | "openedAt" | "failedAt"> {
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

  export const registerDeviceToken = async (
    input: Types.RegisterDeviceTokenInput,
    tx?: DBTransaction
  ): Promise<Types.UserDeviceTokenSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireDeviceTokenLock(t, input.userId);
      const now = new Date();

      const [token] = await t
        .insert(userDeviceTokens)
        .values({
          userId: input.userId,
          token: input.token,
          platform: input.platform,
          deviceName: input.deviceName ?? null,
          isActive: true,
          lastUsedAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userDeviceTokens.token,
          set: {
            userId: input.userId,
            platform: input.platform,
            deviceName: input.deviceName ?? null,
            isActive: true,
            lastUsedAt: now,
            updatedAt: now,
          },
        })
        .returning();

      return token;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const deactivateDeviceToken = async (
    userId: string,
    token: string,
    tx?: DBTransaction
  ): Promise<Types.UserDeviceTokenSelectType | null> => {
    const runner = async (t: DBTransaction) => {
      await acquireDeviceTokenLock(t, userId);
      const now = new Date();

      const updated = await t
        .update(userDeviceTokens)
        .set({
          isActive: false,
          updatedAt: now,
        })
        .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.token, token)))
        .returning();

      return updated.length > 0 ? updated[0] : null;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getActiveDeviceTokensForUser = async (
    userId: string,
    tx?: DBTransaction
  ): Promise<Types.UserDeviceTokenSelectType[]> => {
    const t = tx ?? db;
    return t
      .select()
      .from(userDeviceTokens)
      .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.isActive, true)));
  };

  export const createDelivery = async (
    input: Types.CreateNotificationDeliveryInput,
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliverySelectType> => {
    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const [created] = await t
        .insert(notificationDeliveries)
        .values({
          userId: input.userId,
          deviceTokenId: input.deviceTokenId ?? null,
          channel: input.channel,
          eventType: input.eventType,
          status: NotificationDeliveryStatus.PENDING,
          title: input.title ?? null,
          body: input.body ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const updateDeliveryStatus = async (
    input: Types.UpdateDeliveryStatusInput,
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliverySelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireDeliveryLock(t, input.deliveryId);
      const now = new Date();

      const results = await t
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.id, input.deliveryId))
        .limit(1);

      if (results.length === 0) {
        throw new Error(`Notification delivery ${input.deliveryId} not found`);
      }

      const current = results[0];
      assertValidStatusTransition(current.status as NotificationDeliveryStatus, input.status);

      const statusTimestamps = buildStatusTimestamps(input.status, now);

      const [updated] = await t
        .update(notificationDeliveries)
        .set({
          status: input.status,
          providerMessageId: input.providerMessageId ?? current.providerMessageId,
          failureReason: input.failureReason ?? current.failureReason,
          webhookPayload: input.webhookPayload ?? current.webhookPayload,
          sentAt: current.sentAt ?? statusTimestamps.sentAt,
          deliveredAt: current.deliveredAt ?? statusTimestamps.deliveredAt,
          openedAt: current.openedAt ?? statusTimestamps.openedAt,
          failedAt: current.failedAt ?? statusTimestamps.failedAt,
          updatedAt: now,
        })
        .where(eq(notificationDeliveries.id, input.deliveryId))
        .returning();

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const recordDeliveryOpened = async (
    deliveryId: string,
    webhookPayload?: Record<string, unknown> | null,
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliverySelectType> => {
    return updateDeliveryStatus(
      {
        deliveryId,
        status: NotificationDeliveryStatus.OPENED,
        webhookPayload: webhookPayload ?? null,
      },
      tx
    );
  };

  export const getDeliveryByProviderMessageId = async (
    providerMessageId: string,
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliverySelectType | null> => {
    const t = tx ?? db;
    const results = await t
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
      .limit(1);

    return results[0] ?? null;
  };

  export const handleDeliveryWebhook = async (
    providerMessageId: string,
    status: NotificationDeliveryStatus,
    webhookPayload?: Record<string, unknown> | null,
    failureReason?: string | null,
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliverySelectType> => {
    const runner = async (t: DBTransaction) => {
      const delivery = await getDeliveryByProviderMessageId(providerMessageId, t);
      if (!delivery) {
        throw new Error(`Notification delivery with provider message id ${providerMessageId} not found`);
      }

      return updateDeliveryStatus(
        {
          deliveryId: delivery.id,
          status,
          providerMessageId,
          failureReason: failureReason ?? null,
          webhookPayload: webhookPayload ?? null,
        },
        t
      );
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getDeliveryAnalytics = async (
    filters: Types.NotificationDeliveryAnalyticsFilter = {},
    tx?: DBTransaction
  ): Promise<Types.NotificationDeliveryAnalyticsResult> => {
    const t = tx ?? db;
    const conditions = [];

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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ totalDeliveries }] = await t
      .select({ totalDeliveries: count() })
      .from(notificationDeliveries)
      .where(whereClause);

    const statusCounts = await t
      .select({
        status: notificationDeliveries.status,
        count: count(),
      })
      .from(notificationDeliveries)
      .where(whereClause)
      .groupBy(notificationDeliveries.status);

    const normalizedStatusCounts: Types.NotificationDeliveryStatusCount[] = statusCounts.map(row => ({
      status: row.status as NotificationDeliveryStatus,
      count: row.count,
    }));

    const openedCount =
      normalizedStatusCounts.find(row => row.status === NotificationDeliveryStatus.OPENED)?.count ?? 0;
    const failedCount =
      normalizedStatusCounts.find(row => row.status === NotificationDeliveryStatus.FAILED)?.count ?? 0;

    return {
      totalDeliveries,
      statusCounts: normalizedStatusCounts,
      openRate: totalDeliveries === 0 ? 0 : openedCount / totalDeliveries,
      failureRate: totalDeliveries === 0 ? 0 : failedCount / totalDeliveries,
    };
  };
}
