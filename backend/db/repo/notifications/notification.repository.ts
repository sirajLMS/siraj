import { and, count, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { notificationDeliveries, userDeviceTokens, userNotificationPreferences } from "@/backend/db/schema";
import { NotificationChannel, NotificationDeliveryStatus, type NotificationEventType } from "@/backend/enum";
import type {
  CreateNotificationDeliveryInput,
  NotificationDeliveryAnalyticsFilter,
  NotificationDeliveryAnalyticsResult,
  NotificationDeliverySelectType,
  NotificationDeliveryStatusCount,
  UpdateDeliveryStatusInput,
  UserDeliveryHistoryResult,
} from "@/backend/types/notifications/notificationDeliveries.types";
import type { RegisterDeviceTokenInput, UserDeviceTokenSelectType } from "@/backend/types/users/userDeviceTokens.types";
import type {
  SetNotificationPreferenceInput,
  UserNotificationPreferenceSelectType,
} from "@/backend/types/users/userNotificationPreferences.types";
import { getServerTranslations } from "@/shared/locale";

const STATUS_ORDER: Record<NotificationDeliveryStatus, number> = {
  [NotificationDeliveryStatus.PENDING]: 0,
  [NotificationDeliveryStatus.SENT]: 1,
  [NotificationDeliveryStatus.DELIVERED]: 2,
  [NotificationDeliveryStatus.OPENED]: 3,
  [NotificationDeliveryStatus.FAILED]: 4,
};

export namespace NotificationRepository {
  export type NotificationDeliveryInsertInput = CreateNotificationDeliveryInput & {
    status: NotificationDeliveryStatus;
    sentAt?: Date | null;
    deliveredAt?: Date | null;
    failedAt?: Date | null;
    failureReason?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  };

  export const createManyDeliveries = async (
    inputs: NotificationDeliveryInsertInput[],
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType[]> => {
    if (inputs.length === 0) return [];

    const runner = async (t: DBTransaction) => {
      const now = new Date();
      const values = inputs.map(input => ({
        userId: input.userId,
        deviceTokenId: input.deviceTokenId ?? null,
        channel: input.channel,
        eventType: input.eventType,
        status: input.status,
        title: input.title ?? null,
        body: input.body ?? null,
        sentAt: input.sentAt ?? null,
        deliveredAt: input.deliveredAt ?? null,
        failedAt: input.failedAt ?? null,
        failureReason: input.failureReason ?? null,
        createdAt: input.createdAt ?? now,
        updatedAt: input.updatedAt ?? now,
      }));

      return t.insert(notificationDeliveries).values(values).returning();
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  async function acquireDeviceTokenLock(tx: DBTransaction, userId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('device_token_user_' || ${userId}::text))`);
  }

  async function acquireDeliveryLock(tx: DBTransaction, deliveryId: string): Promise<void> {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('notification_delivery_' || ${deliveryId}::text))`);
  }

  async function assertValidStatusTransition(
    currentStatus: NotificationDeliveryStatus,
    nextStatus: NotificationDeliveryStatus,
    locale?: string
  ): Promise<void> {
    if (currentStatus === nextStatus) {
      return;
    }

    if (currentStatus === NotificationDeliveryStatus.FAILED) {
      const { invalidTransition } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(`Cannot transition delivery status from FAILED to ${nextStatus}. ${invalidTransition}`);
    }

    if (nextStatus === NotificationDeliveryStatus.FAILED) {
      return;
    }

    if (STATUS_ORDER[nextStatus] <= STATUS_ORDER[currentStatus]) {
      const { invalidTransition: invalidTransitionMsg } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(`${invalidTransitionMsg}: ${currentStatus} -> ${nextStatus}`);
    }
  }

  function buildStatusTimestamps(
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

  export const registerDeviceToken = async (
    userId: string,
    input: RegisterDeviceTokenInput,
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType> => {
    const runner = async (t: DBTransaction) => {
      await acquireDeviceTokenLock(t, userId);
      const now = new Date();

      const [token] = await t
        .insert(userDeviceTokens)
        .values({
          userId,
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
            userId,
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
  ): Promise<UserDeviceTokenSelectType | null> => {
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
  ): Promise<UserDeviceTokenSelectType[]> => {
    const q = queryDb(tx);
    return q
      .select()
      .from(userDeviceTokens)
      .where(and(eq(userDeviceTokens.userId, userId), eq(userDeviceTokens.isActive, true)));
  };

  export const createDelivery = async (
    input: CreateNotificationDeliveryInput,
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType> => {
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
          metadata: input.metadata ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const updateDeliveryStatus = async (
    input: UpdateDeliveryStatusInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<NotificationDeliverySelectType> => {
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
      await assertValidStatusTransition(current.status as NotificationDeliveryStatus, input.status, locale);

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
    tx?: DBTransaction,
    locale?: string
  ): Promise<NotificationDeliverySelectType> => {
    return updateDeliveryStatus(
      {
        deliveryId,
        status: NotificationDeliveryStatus.OPENED,
        webhookPayload: webhookPayload ?? null,
      },
      tx,
      locale
    );
  };

  export const getDeliveryByProviderMessageId = async (
    providerMessageId: string,
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType | null> => {
    const q = queryDb(tx);
    const results = await q
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
      .limit(1);

    return results[0] ?? null;
  };

  /**
   * Input for handling a delivery webhook
   */
  export interface DeliveryWebhookInput {
    providerMessageId: string;
    status: NotificationDeliveryStatus;
    webhookPayload?: Record<string, unknown> | null;
    failureReason?: string | null;
  }

  /**
   * Processes a webhook from a notification provider to update delivery status
   */
  export const handleDeliveryWebhook = async (
    input: DeliveryWebhookInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<NotificationDeliverySelectType> => {
    const { providerMessageId, status, webhookPayload, failureReason } = input;

    const runner = async (t: DBTransaction) => {
      const delivery = await getDeliveryByProviderMessageId(providerMessageId, t);
      if (!delivery) {
        throw new Error(`Notification delivery with provider message ID ${providerMessageId} not found`);
      }

      return updateDeliveryStatus(
        {
          deliveryId: delivery.id,
          status,
          providerMessageId,
          failureReason: failureReason ?? null,
          webhookPayload: webhookPayload ?? null,
        },
        t,
        locale
      );
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getDeliveryAnalytics = async (
    filters: NotificationDeliveryAnalyticsFilter = {},
    tx?: DBTransaction
  ): Promise<NotificationDeliveryAnalyticsResult> => {
    const q = queryDb(tx);
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

  export const getPreference = async (
    userId: string,
    channel: NotificationChannel,
    eventType: NotificationEventType,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType | null> => {
    const q = queryDb(tx);

    const results = await q
      .select()
      .from(userNotificationPreferences)
      .where(
        and(
          eq(userNotificationPreferences.userId, userId),
          eq(userNotificationPreferences.channel, channel),
          eq(userNotificationPreferences.eventType, eventType)
        )
      )
      .limit(1);

    return results[0] ?? null;
  };

  export const setPreference = async (
    userId: string,
    input: SetNotificationPreferenceInput,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType> => {
    const runner = async (t: DBTransaction) => {
      await t.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext('notification_pref_' || ${userId}::text || '_' || ${input.channel}::text || '_' || ${input.eventType}::text))`
      );

      const now = new Date();

      const [result] = await t
        .insert(userNotificationPreferences)
        .values({
          userId,
          channel: input.channel,
          eventType: input.eventType,
          enabled: input.enabled,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [
            userNotificationPreferences.userId,
            userNotificationPreferences.channel,
            userNotificationPreferences.eventType,
          ],
          set: {
            enabled: input.enabled,
            updatedAt: now,
          },
        })
        .returning();

      return result;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const createDeliveriesBatch = async (
    inputs: CreateNotificationDeliveryInput[],
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType[]> => {
    if (inputs.length === 0) return [];

    const runner = async (t: DBTransaction) => {
      const now = new Date();

      const values = inputs.map(input => ({
        userId: input.userId,
        deviceTokenId: input.deviceTokenId ?? null,
        channel: input.channel,
        eventType: input.eventType,
        status: NotificationDeliveryStatus.PENDING,
        title: input.title ?? null,
        body: input.body ?? null,
        metadata: input.metadata ?? null,
        createdAt: now,
        updatedAt: now,
      }));

      const created = await t.insert(notificationDeliveries).values(values).returning();

      return created;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const getSmsCountInLastHour = async (userId: string, tx?: DBTransaction): Promise<number> => {
    const q = queryDb(tx);

    const [result] = await q
      .select({
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(notificationDeliveries)
      .where(
        and(
          eq(notificationDeliveries.userId, userId),
          eq(notificationDeliveries.channel, NotificationChannel.SMS),
          gt(notificationDeliveries.createdAt, sql`NOW() - INTERVAL '1 hour'`)
        )
      );

    return result?.count ?? 0;
  };

  export const getDeliveriesByUser = async (
    userId: string,
    options: { limit: number; offset: number; channel?: NotificationChannel; eventType?: NotificationEventType },
    tx?: DBTransaction
  ): Promise<UserDeliveryHistoryResult> => {
    const q = queryDb(tx);

    const conditions = [eq(notificationDeliveries.userId, userId)];

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
  };
}
