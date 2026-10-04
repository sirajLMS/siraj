import { eq, sql } from "drizzle-orm";
import { withForUpdate } from "@/backend/db";
import { acquireDeliveryLock } from "@/backend/db/repo/notifications/notification-db.helpers";
import { isValidStatusTransition } from "@/backend/db/repo/notifications/notification-status.constants";
import {
  buildIncomingStatusRankSql,
  buildStatusRankSql,
  buildStatusTimestamps,
  toDeliveryStatus,
} from "@/backend/db/repo/notifications/notification-status.helpers";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { notificationDeliveries } from "@/backend/db/schema";
import type { NotificationChannel, NotificationDeliveryStatus, NotificationEventType } from "@/backend/enum";
import { NotFoundError } from "@/backend/lib/errors";
import type { DBTransaction, NotificationDeliverySelectType, UpdateDeliveryStatusInput } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

/**
 * Input for handling a delivery webhook.
 * `userId`, `channel`, and `eventType` are required when the delivery row
 * doesn't exist yet (webhook arrives before adapter creates it) — they're
 * used for the INSERT path of the upsert. If any are missing, only UPDATE
 * is attempted and the method returns null when no row matches.
 */
export interface DeliveryWebhookInput {
  providerMessageId: string;
  status: NotificationDeliveryStatus;
  webhookPayload?: Record<string, unknown> | null;
  failureReason?: string | null;
  userId?: string;
  channel?: NotificationChannel;
  eventType?: NotificationEventType;
}

type StatusTimestampColumns = Pick<NotificationDeliverySelectType, "sentAt" | "deliveredAt" | "openedAt" | "failedAt">;

/**
 * Preserves any already-recorded lifecycle timestamp and only fills the ones
 * still missing from the incoming transition. Shared by every status UPDATE
 * path so a late/stale webhook can never erase an earlier timestamp.
 */
function mergeStatusTimestamps(current: StatusTimestampColumns, next: StatusTimestampColumns): StatusTimestampColumns {
  return {
    sentAt: current.sentAt ?? next.sentAt,
    deliveredAt: current.deliveredAt ?? next.deliveredAt,
    openedAt: current.openedAt ?? next.openedAt,
    failedAt: current.failedAt ?? next.failedAt,
  };
}

const updateConflictingWebhookRow = async (
  t: DBTransaction,
  webhookRow: NotificationDeliverySelectType,
  input: UpdateDeliveryStatusInput,
  statusTimestamps: ReturnType<typeof buildStatusTimestamps>,
  now: Date
): Promise<NotificationDeliverySelectType> => {
  const webhookStatus = toDeliveryStatus(webhookRow.status);

  // Only update if the new status represents a valid forward transition
  // for the webhook-created row (B3 forward-only guard).
  if (!isValidStatusTransition(webhookStatus, input.status)) {
    return webhookRow;
  }

  const [updated] = await t
    .update(notificationDeliveries)
    .set({
      status: input.status,
      failureReason: input.failureReason ?? webhookRow.failureReason,
      webhookPayload: input.webhookPayload ?? webhookRow.webhookPayload,
      ...mergeStatusTimestamps(webhookRow, statusTimestamps),
      updatedAt: now,
    })
    .where(eq(notificationDeliveries.id, webhookRow.id))
    .returning();

  return updated;
};

const tryUpdateConflictingWebhookRow = async (
  t: DBTransaction,
  incomingProviderMessageId: string | null,
  current: NotificationDeliverySelectType,
  input: UpdateDeliveryStatusInput,
  statusTimestamps: ReturnType<typeof buildStatusTimestamps>,
  now: Date
): Promise<NotificationDeliverySelectType | null> => {
  // r10-015: Dual-lock strategy — the advisory lock on deliveryId alone is
  // insufficient when two concurrent adapter calls target DIFFERENT
  // deliveryIds but both assign the SAME providerMessageId. Each would
  // pass the conflicting-row check since neither blocks the other on
  // deliveryId. To close this race, we acquire a SECOND advisory lock
  // keyed on the incoming providerMessageId when it differs from the
  // current row's providerMessageId. This serializes concurrent updates
  // that are assigning the same providerMessageId regardless of which
  // deliveryId they target, preventing a unique-constraint violation.
  if (incomingProviderMessageId && incomingProviderMessageId !== current.providerMessageId) {
    await acquireAdvisoryLock(t, incomingProviderMessageId);
  }

  // Fix 3: Race-condition guard — if the webhook handler already created a
  // row with the same providerMessageId (webhook won the race), the adapter's
  // UPDATE would violate the unique constraint. When the adapter is setting a
  // new providerMessageId, check whether a webhook-created row already owns
  // it. If so, merge the status transition into THAT row instead of failing.
  if (incomingProviderMessageId && incomingProviderMessageId !== current.providerMessageId) {
    const conflicting = await withForUpdate(
      t
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.providerMessageId, incomingProviderMessageId))
        .limit(1)
    );

    if (conflicting.length > 0) {
      return updateConflictingWebhookRow(t, conflicting[0], input, statusTimestamps, now);
    }
  }

  return null;
};

const updateExistingWebhookDelivery = async (
  t: DBTransaction,
  current: NotificationDeliverySelectType,
  status: NotificationDeliveryStatus,
  webhookPayload: Record<string, unknown> | null | undefined,
  failureReason: string | null | undefined,
  now: Date
): Promise<NotificationDeliverySelectType> => {
  const currentStatus = toDeliveryStatus(current.status);

  // Same-status webhook — no-op, return current row.
  if (currentStatus === status) {
    return current;
  }

  // B3: Forward-only rank guard.
  // Uses the repo-local `isValidStatusTransition` helper to silently
  // skip stale/duplicate events instead of throwing (webhooks are idempotent).
  if (!isValidStatusTransition(currentStatus, status)) {
    // Stale/duplicate webhook that would downgrade status — skip.
    return current;
  }

  const statusTimestamps = buildStatusTimestamps(status, now);

  const [updated] = await t
    .update(notificationDeliveries)
    .set({
      status,
      failureReason: failureReason ?? null,
      webhookPayload: webhookPayload ?? null,
      ...mergeStatusTimestamps(current, statusTimestamps),
      updatedAt: now,
    })
    .where(eq(notificationDeliveries.id, current.id))
    .returning();

  return updated;
};

const insertWebhookDelivery = async (
  t: DBTransaction,
  input: {
    providerMessageId: string;
    status: NotificationDeliveryStatus;
    webhookPayload: Record<string, unknown> | null | undefined;
    failureReason: string | null | undefined;
    userId?: string;
    channel?: NotificationChannel;
    eventType?: NotificationEventType;
  },
  now: Date
): Promise<NotificationDeliverySelectType | null> => {
  const { providerMessageId, status, webhookPayload, failureReason, userId, channel, eventType } = input;

  // P3: Row not found — attempt INSERT with ON CONFLICT DO UPDATE if we have required fields.
  if (!userId || !channel || !eventType) {
    // Cannot INSERT without required NOT NULL fields — graceful skip.
    return null;
  }

  const statusTimestamps = buildStatusTimestamps(status, now);

  const currentRankSql = buildStatusRankSql(notificationDeliveries.status);
  const incomingRankSql = buildIncomingStatusRankSql(status);
  const rankGuardSql = sql`(${incomingRankSql} > ${currentRankSql} OR ${incomingRankSql} = -1 OR (${currentRankSql} = -1 AND ${incomingRankSql} > 0))`;

  const [inserted] = await t
    .insert(notificationDeliveries)
    .values({
      userId,
      channel,
      eventType,
      providerMessageId,
      status,
      failureReason: failureReason ?? null,
      webhookPayload: webhookPayload ?? null,
      sentAt: statusTimestamps.sentAt,
      deliveredAt: statusTimestamps.deliveredAt,
      openedAt: statusTimestamps.openedAt,
      failedAt: statusTimestamps.failedAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: notificationDeliveries.providerMessageId,
      targetWhere: sql`${notificationDeliveries.providerMessageId} IS NOT NULL`,
      set: {
        status,
        eventType,
        failureReason: failureReason ?? null,
        webhookPayload: webhookPayload ?? null,
        sentAt: statusTimestamps.sentAt,
        deliveredAt: statusTimestamps.deliveredAt,
        openedAt: statusTimestamps.openedAt,
        failedAt: statusTimestamps.failedAt,
        updatedAt: now,
      },
      setWhere: rankGuardSql,
    })
    .returning();

  // r10-038: When `inserted` is undefined here, it has a DUAL meaning:
  //   1. The INSERT found no existing row AND no conflict occurred — the
  //      row genuinely does not exist (e.g., INSERT failed for other
  //      reasons). This is the "no existing delivery" case.
  //   2. The INSERT hit an ON CONFLICT (row already exists with the same
  //      providerMessageId) AND the rank guard (setWhere) evaluated to
  //      false, meaning the incoming status is stale/lower-rank. In this
  //      case RETURNING yields nothing, so `inserted` is undefined — but
  //      the row DOES exist; it was simply skipped by the rank guard.
  //
  // The caller's "no existing delivery" log is misleading in case 2
  // (the actual scenario is a rank-guard rejection on concurrent insert).
  return inserted;
};

/**
 * Processes a webhook from a notification provider to update delivery status.
 * P3: Uses UPDATE → INSERT-with-ON-CONFLICT upsert by providerMessageId.
 * B3: Forward-only rank guard — stale/duplicate webhooks that would downgrade
 * the status (e.g. a late `failed` arriving after `delivered`) are silently
 * skipped by returning the current row unchanged.
 */
export const handleDeliveryWebhookRunner = async (
  t: DBTransaction,
  input: DeliveryWebhookInput
): Promise<NotificationDeliverySelectType | null> => {
  const { providerMessageId, status, webhookPayload, failureReason, userId, channel, eventType } = input;
  const now = new Date();

  // B3: Fetch the current row first to enforce forward-only rank guard.
  // TOCTOU fix: acquire FOR UPDATE row lock so concurrent webhooks for the
  // same providerMessageId serialize — preventing double-apply or downgrade
  // via interleaved read-then-write.
  const existing = await withForUpdate(
    t
      .select()
      .from(notificationDeliveries)
      .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
      .limit(1)
  );

  if (existing.length > 0) {
    return updateExistingWebhookDelivery(t, existing[0], status, webhookPayload, failureReason, now);
  }

  return insertWebhookDelivery(
    t,
    { providerMessageId, status, webhookPayload, failureReason, userId, channel, eventType },
    now
  );
};

/**
 * Applies a validated adapter-driven status update to a delivery row.
 * Acquires the delivery advisory lock, enforces the forward-only rank guard
 * (throwing on an invalid transition), and hands off to the webhook-conflict
 * merge path when the incoming providerMessageId is already owned by another row.
 */
export const updateDeliveryStatusRunner = async (
  t: DBTransaction,
  input: UpdateDeliveryStatusInput,
  locale: string | undefined
): Promise<NotificationDeliverySelectType> => {
  await acquireDeliveryLock(t, input.deliveryId);
  const now = new Date();

  const results = await t
    .select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.id, input.deliveryId))
    .limit(1);

  if (results.length === 0) {
    const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new NotFoundError("NOTIFICATION_DELIVERY", tErrors.notification.deliveryNotFound(input.deliveryId));
  }

  const current = results[0];

  const currentStatus = toDeliveryStatus(current.status);

  // B3 forward-only rank guard: reject invalid transitions.
  // Mirrors the service-layer assertValidStatusTransition but inlined
  // here to avoid a repo→service dependency. The rank lookup and
  // transition logic are data-level concerns (which statuses can
  // overwrite which in the DB), not business orchestration.
  if (!isValidStatusTransition(currentStatus, input.status)) {
    const { invalidTransition: invalidTransitionMsg } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(`${invalidTransitionMsg}: ${currentStatus} -> ${input.status}`);
  }

  const statusTimestamps = buildStatusTimestamps(input.status, now);

  const incomingProviderMessageId = input.providerMessageId ?? current.providerMessageId;

  const conflictResult = await tryUpdateConflictingWebhookRow(
    t,
    incomingProviderMessageId,
    current,
    input,
    statusTimestamps,
    now
  );
  if (conflictResult) {
    return conflictResult;
  }

  const [updated] = await t
    .update(notificationDeliveries)
    .set({
      status: input.status,
      providerMessageId: input.providerMessageId ?? current.providerMessageId,
      failureReason: input.failureReason ?? current.failureReason,
      webhookPayload: input.webhookPayload ?? current.webhookPayload,
      ...mergeStatusTimestamps(current, statusTimestamps),
      updatedAt: now,
    })
    .where(eq(notificationDeliveries.id, input.deliveryId))
    .returning();

  return updated;
};
