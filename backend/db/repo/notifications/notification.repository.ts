import { eq } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import {
  countSmsInLastHour,
  type DeliveryHistoryOptions,
  runDeliveryAnalytics,
  runDeliveryHistory,
} from "@/backend/db/repo/notifications/notification-analytics.helpers";
import { runWithDbTransaction } from "@/backend/db/repo/notifications/notification-db.helpers";
import {
  createDeliveryRunner,
  findDeliveriesByProviderMessageIds,
  findDeliveryByProviderMessageId,
  insertDeliveriesBatch,
  insertManyDeliveries,
  type NotificationDeliveryInsertInput,
} from "@/backend/db/repo/notifications/notification-delivery.helpers";
import {
  deactivateDeviceTokenRunner,
  getActiveDeviceTokens,
  getPreferenceByKey,
  registerDeviceTokenRunner,
  setPreferenceRunner,
} from "@/backend/db/repo/notifications/notification-settings.helpers";
import {
  type DeliveryWebhookInput,
  handleDeliveryWebhookRunner,
  updateDeliveryStatusRunner,
} from "@/backend/db/repo/notifications/notification-webhook.helpers";
import { notificationDeliveries, userDeviceTokens } from "@/backend/db/schema";
import { type NotificationChannel, NotificationDeliveryStatus, type NotificationEventType } from "@/backend/enum";
import type {
  CreateNotificationDeliveryInput,
  DBTransaction,
  NotificationDeliveryAnalyticsFilter,
  NotificationDeliveryAnalyticsResult,
  NotificationDeliverySelectType,
  NotificationPreferenceUpdateInput,
  RegisterDeviceTokenInput,
  UpdateDeliveryStatusInput,
  UserDeliveryHistoryResult,
  UserDeviceTokenSelectType,
  UserNotificationPreferenceSelectType,
} from "@/backend/types";

export namespace NotificationRepository {
  export const createManyDeliveries = async (
    inputs: NotificationDeliveryInsertInput[],
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType[]> => {
    if (inputs.length === 0) return [];
    return runWithDbTransaction(tx, t => insertManyDeliveries(t, inputs));
  };

  export const registerDeviceToken = async (
    userId: string,
    input: RegisterDeviceTokenInput,
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType> => runWithDbTransaction(tx, t => registerDeviceTokenRunner(t, userId, input));

  export const deactivateDeviceToken = async (
    userId: string,
    token: string,
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType | null> =>
    runWithDbTransaction(tx, t => deactivateDeviceTokenRunner(t, userId, token));

  export const getActiveDeviceTokensForUser = async (
    userId: string,
    tx?: DBTransaction
  ): Promise<UserDeviceTokenSelectType[]> => getActiveDeviceTokens(queryDb(tx), userId);

  export const findByProviderMessageId = async (
    providerMessageId: string,
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType | null> => findDeliveryByProviderMessageId(queryDb(tx), providerMessageId);

  export const createDelivery = async (
    input: CreateNotificationDeliveryInput,
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType> => runWithDbTransaction(tx, t => createDeliveryRunner(t, input));

  export const updateDeliveryStatus = async (
    input: UpdateDeliveryStatusInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<NotificationDeliverySelectType> =>
    runWithDbTransaction(tx, t => updateDeliveryStatusRunner(t, input, locale));

  export const recordDeliveryOpened = async (
    deliveryId: string,
    webhookPayload?: Record<string, unknown> | null,
    tx?: DBTransaction,
    locale?: string
  ): Promise<NotificationDeliverySelectType> =>
    updateDeliveryStatus(
      {
        deliveryId,
        status: NotificationDeliveryStatus.OPENED,
        webhookPayload: webhookPayload ?? null,
      },
      tx,
      locale
    );

  export const getDeliveriesByProviderMessageIds = async (
    providerMessageIds: string[],
    tx?: DBTransaction
  ): Promise<Map<string, NotificationDeliverySelectType>> => {
    if (providerMessageIds.length === 0) {
      return new Map();
    }
    return findDeliveriesByProviderMessageIds(queryDb(tx), providerMessageIds);
  };

  export const handleDeliveryWebhook = async (
    input: DeliveryWebhookInput,
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType | null> =>
    runWithDbTransaction(tx, t => handleDeliveryWebhookRunner(t, input));

  export const getDeliveryAnalytics = async (
    filters: NotificationDeliveryAnalyticsFilter = {},
    tx?: DBTransaction
  ): Promise<NotificationDeliveryAnalyticsResult> => runDeliveryAnalytics(queryDb(tx), filters);

  export const getPreference = async (
    userId: string,
    channel: NotificationChannel,
    eventType: NotificationEventType,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType | null> =>
    getPreferenceByKey(queryDb(tx), userId, channel, eventType);

  export const setPreference = async (
    userId: string,
    input: NotificationPreferenceUpdateInput,
    tx?: DBTransaction
  ): Promise<UserNotificationPreferenceSelectType> =>
    runWithDbTransaction(tx, t => setPreferenceRunner(t, userId, input));

  export const createDeliveriesBatch = async (
    inputs: CreateNotificationDeliveryInput[],
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType[]> => {
    if (inputs.length === 0) return [];
    return runWithDbTransaction(tx, t => insertDeliveriesBatch(t, inputs));
  };

  export const getSmsCountInLastHour = async (userId: string, tx?: DBTransaction): Promise<number> =>
    countSmsInLastHour(queryDb(tx), userId);

  export const getDeliveriesByUser = async (
    userId: string,
    options: DeliveryHistoryOptions,
    tx?: DBTransaction
  ): Promise<UserDeliveryHistoryResult> => runDeliveryHistory(queryDb(tx), userId, options);

  export const deleteDeviceTokensByUserId = async (userId: string, tx: DBTransaction): Promise<void> => {
    await tx.delete(userDeviceTokens).where(eq(userDeviceTokens.userId, userId));
  };

  export const scrubDeliveryContentByUserId = async (userId: string, tx: DBTransaction): Promise<void> => {
    await tx
      .update(notificationDeliveries)
      .set({ title: null, body: null, webhookPayload: null })
      .where(eq(notificationDeliveries.userId, userId));
  };
}
