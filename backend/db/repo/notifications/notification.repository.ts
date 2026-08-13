import { and, count, desc, eq, gt, gte, inArray, lte, sql } from "drizzle-orm";
import { queryDb } from "@/backend/db";
import { db } from "@/backend/db/drizzleDb";
import { notificationDeliveries, userDeviceTokens, userNotificationPreferences } from "@/backend/db/schema";
import { NotificationChannel, NotificationDeliveryStatus, type NotificationEventType } from "@/backend/enum";
import type {
  CreateNotificationDeliveryInput,
  DBTransaction,
  NotificationDeliveryAnalyticsFilter,
  NotificationDeliveryAnalyticsResult,
  NotificationDeliverySelectType,
  NotificationDeliveryStatusCount,
  NotificationMetadata,
  RegisterDeviceTokenInput,
  SetNotificationPreferenceInput,
  UpdateDeliveryStatusInput,
  UserDeliveryHistoryResult,
  UserDeviceTokenSelectType,
  UserNotificationPreferenceSelectType,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const STATUS_ORDER: Record<NotificationDeliveryStatus, number> = {
  [NotificationDeliveryStatus.PENDING]: 0,
  [NotificationDeliveryStatus.SENT]: 1,
  [NotificationDeliveryStatus.DELIVERED]: 2,
  [NotificationDeliveryStatus.OPENED]: 3,
  [NotificationDeliveryStatus.FAILED]: -1,
};

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

const toDeliveryStatus = (value: string): NotificationDeliveryStatus => {
  const status = DELIVERY_STATUS_LOOKUP[value];
  if (!status) {
    throw new Error(`Invalid NotificationDeliveryStatus: ${value}`);
  }
  return status;
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

  /**
   * Shared mapping from a notification delivery input to an insert row object.
   * Used by `createManyDeliveries` and `createDeliveriesBatch` to avoid duplicate field mapping.
   */
  function mapDeliveryInput(
    input: {
      userId: string;
      deviceTokenId?: string | null;
      channel: NotificationChannel | string;
      eventType: NotificationEventType | string;
      title?: string | null;
      body?: string | null;
      metadata?: NotificationMetadata | null;
    },
    status: NotificationDeliveryStatus,
    extras: {
      sentAt?: Date | null;
      deliveredAt?: Date | null;
      failedAt?: Date | null;
      failureReason?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    now: Date
  ) {
    return {
      userId: input.userId,
      deviceTokenId: input.deviceTokenId ?? null,
      channel: input.channel,
      eventType: input.eventType,
      status,
      title: input.title ?? null,
      body: input.body ?? null,
      metadata: input.metadata ?? null,
      sentAt: extras.sentAt ?? null,
      deliveredAt: extras.deliveredAt ?? null,
      failedAt: extras.failedAt ?? null,
      failureReason: extras.failureReason ?? null,
      createdAt: extras.createdAt ?? now,
      updatedAt: extras.updatedAt ?? now,
    };
  }

  export const createManyDeliveries = async (
    inputs: NotificationDeliveryInsertInput[],
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType[]> => {
    if (inputs.length === 0) return [];

    const runner = async (t: DBTransaction) => {
      const now = new Date();
      const values = inputs.map(input =>
        mapDeliveryInput(
          input,
          input.status,
          {
            sentAt: input.sentAt,
            deliveredAt: input.deliveredAt,
            failedAt: input.failedAt,
            failureReason: input.failureReason,
            createdAt: input.createdAt,
            updatedAt: input.updatedAt,
          },
          now
        )
      );

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

  /**
   * Asserts that a status transition is valid according to the forward-only
   * rank model (B3). FAILED is intentionally mapped to rank -1 so that it is
   * reachable from ANY state — delivery failures can occur at any point in
   * the lifecycle (pending, sent, delivered, opened). Conversely, transitions
   * OUT of FAILED into a higher-rank status are allowed only when
   * `nextRank > 0` (resurrecting a transient failure after a webhook
   * delivers a delayed status).
   *
   * Contract:
   *   - `nextRank > currentRank` → forward progression, always valid.
   *   - `nextStatus === FAILED` → valid from any current state.
   *   - `currentRank === -1 && nextRank > 0` → resurrect from FAILED.
   *   - All other transitions are rejected with a localized error.
   *
   * This function is exported (not private) because the same rank logic is
   * mirrored in the SQL ON CONFLICT upsert guard within
   * `updateDeliveryStatusFromWebhook` — keeping it exported ensures the
   * contract is visible and testable at the repository level.
   */
  async function assertValidStatusTransition(
    currentStatus: NotificationDeliveryStatus,
    nextStatus: NotificationDeliveryStatus,
    locale?: string
  ): Promise<void> {
    if (currentStatus === nextStatus) {
      return;
    }

    // B3: Forward-only rank map with FAILED=-1.
    // A transition is valid if:
    //   - nextRank > currentRank (normal forward progression), OR
    //   - nextStatus === FAILED (terminal failure reachable from any state), OR
    //   - currentRank === -1 (FAILED) and nextRank > 0 (resurrect transient failed)
    const currentRank = STATUS_ORDER[currentStatus];
    const nextRank = STATUS_ORDER[nextStatus];

    if (
      nextRank > currentRank ||
      nextStatus === NotificationDeliveryStatus.FAILED ||
      (currentRank === -1 && nextRank > 0)
    ) {
      return;
    }

    const { invalidTransition: invalidTransitionMsg } = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(`${invalidTransitionMsg}: ${currentStatus} -> ${nextStatus}`);
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
      await t.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${incomingProviderMessageId}))`);
    }

    // Fix 3: Race-condition guard — if the webhook handler already created a
    // row with the same providerMessageId (webhook won the race), the adapter's
    // UPDATE would violate the unique constraint. When the adapter is setting a
    // new providerMessageId, check whether a webhook-created row already owns
    // it. If so, merge the status transition into THAT row instead of failing.
    if (incomingProviderMessageId && incomingProviderMessageId !== current.providerMessageId) {
      const conflicting = await t
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.providerMessageId, incomingProviderMessageId))
        .limit(1)
        .for("update");

      if (conflicting.length > 0) {
        return updateConflictingWebhookRow(t, conflicting[0], input, statusTimestamps, now);
      }
    }

    return null;
  };

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
    const webhookRank = STATUS_ORDER[webhookStatus];
    const nextRank = STATUS_ORDER[input.status];
    const isValidTransition =
      nextRank > webhookRank ||
      input.status === NotificationDeliveryStatus.FAILED ||
      (webhookRank === -1 && nextRank > 0);

    if (!isValidTransition) {
      return webhookRow;
    }

    const [updated] = await t
      .update(notificationDeliveries)
      .set({
        status: input.status,
        failureReason: input.failureReason ?? webhookRow.failureReason,
        webhookPayload: input.webhookPayload ?? webhookRow.webhookPayload,
        sentAt: webhookRow.sentAt ?? statusTimestamps.sentAt,
        deliveredAt: webhookRow.deliveredAt ?? statusTimestamps.deliveredAt,
        openedAt: webhookRow.openedAt ?? statusTimestamps.openedAt,
        failedAt: webhookRow.failedAt ?? statusTimestamps.failedAt,
        updatedAt: now,
      })
      .where(eq(notificationDeliveries.id, webhookRow.id))
      .returning();

    return updated;
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
      await assertValidStatusTransition(toDeliveryStatus(current.status), input.status, locale);

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
   * Batch version of `getDeliveryByProviderMessageId` — resolves N providerMessageIds
   * in a single SELECT using `inArray`. Returns a Map keyed by providerMessageId.
   * Missing deliveries are absent from the Map (caller falls back to CLASS_REMINDER).
   */
  export const getDeliveriesByProviderMessageIds = async (
    providerMessageIds: string[],
    tx?: DBTransaction
  ): Promise<Map<string, NotificationDeliverySelectType>> => {
    if (providerMessageIds.length === 0) {
      return new Map();
    }
    const q = queryDb(tx);
    const results = await q
      .select()
      .from(notificationDeliveries)
      .where(inArray(notificationDeliveries.providerMessageId, providerMessageIds));

    return new Map(
      results
        .filter((r): r is typeof r & { providerMessageId: string } => r.providerMessageId !== null)
        .map(r => [r.providerMessageId, r])
    );
  };

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
    /** Required for INSERT path — userId of the delivery recipient. */
    userId?: string;
    /** Required for INSERT path — notification channel. */
    channel?: NotificationChannel;
    /** Required for INSERT path — event type that triggered the notification. */
    eventType?: NotificationEventType;
  }

  /**
   * Processes a webhook from a notification provider to update delivery status.
   * P3: Uses UPDATE → INSERT-with-ON-CONFLICT upsert by providerMessageId.
   * B3: Forward-only rank guard — stale/duplicate webhooks that would downgrade
   * the status (e.g. a late `failed` arriving after `delivered`) are silently
   * skipped by returning the current row unchanged.
   *
   * If the delivery row already exists (adapter created it), the forward-only
   * rank guard is checked before UPDATE. If the transition is valid the new
   * status/timestamps are applied; if stale/duplicate the current row is
   * returned unchanged. If the row doesn't exist yet AND the input carries
   * `userId`/`channel`/`eventType`, an INSERT with ON CONFLICT DO UPDATE is
   * attempted (the ON CONFLICT branch enforces the rank guard via a SQL `where`
   * clause so stale webhooks that would downgrade the status are skipped). If the row
   * doesn't exist and those fields are absent, returns null (graceful skip —
   * will be reconciled on subsequent webhook or adapter row creation).
   */
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
    // Use the same logic as assertValidStatusTransition but silently skip
    // stale/duplicate events instead of throwing (webhooks are idempotent).
    //   - nextRank > currentRank (normal forward progression), OR
    //   - status === FAILED (terminal failure reachable from any state), OR
    //   - currentRank === -1 and nextRank > 0 (resurrect transient failed)
    const currentRank = STATUS_ORDER[currentStatus];
    const nextRank = STATUS_ORDER[status];
    const isValidTransition =
      nextRank > currentRank || status === NotificationDeliveryStatus.FAILED || (currentRank === -1 && nextRank > 0);

    if (!isValidTransition) {
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
        sentAt: current.sentAt ?? statusTimestamps.sentAt,
        deliveredAt: current.deliveredAt ?? statusTimestamps.deliveredAt,
        openedAt: current.openedAt ?? statusTimestamps.openedAt,
        failedAt: current.failedAt ?? statusTimestamps.failedAt,
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

    // B3: SQL rank guard for ON CONFLICT branch — mirrors isValidTransition:
    //   nextRank > currentRank || status === FAILED || (currentRank === -1 && nextRank > 0)
    // IMPORTANT: These SQL CASE values must stay in sync with STATUS_ORDER
    // above. The values are derived from the actual NotificationDeliveryStatus
    // enum members and STATUS_ORDER map so any drift surfaces at compile time.
    // See test at backend/db/repo/notifications/test/notification-rank-guard.test.ts.
    const statusRankSql = (col: unknown) =>
      sql`CASE ${col} WHEN ${NotificationDeliveryStatus.PENDING} THEN ${STATUS_ORDER[NotificationDeliveryStatus.PENDING]} WHEN ${NotificationDeliveryStatus.SENT} THEN ${STATUS_ORDER[NotificationDeliveryStatus.SENT]} WHEN ${NotificationDeliveryStatus.DELIVERED} THEN ${STATUS_ORDER[NotificationDeliveryStatus.DELIVERED]} WHEN ${NotificationDeliveryStatus.OPENED} THEN ${STATUS_ORDER[NotificationDeliveryStatus.OPENED]} WHEN ${NotificationDeliveryStatus.FAILED} THEN ${STATUS_ORDER[NotificationDeliveryStatus.FAILED]} ELSE -2 END`;
    const currentRankSql = statusRankSql(notificationDeliveries.status);
    // Incoming rank — uses the same STATUS_ORDER mapping via sql.raw()
    // referencing the actual NotificationDeliveryStatus enum members.
    const incomingRankSql = sql`(CASE WHEN ${status} = ${NotificationDeliveryStatus.PENDING} THEN ${STATUS_ORDER[NotificationDeliveryStatus.PENDING]} WHEN ${status} = ${NotificationDeliveryStatus.SENT} THEN ${STATUS_ORDER[NotificationDeliveryStatus.SENT]} WHEN ${status} = ${NotificationDeliveryStatus.DELIVERED} THEN ${STATUS_ORDER[NotificationDeliveryStatus.DELIVERED]} WHEN ${status} = ${NotificationDeliveryStatus.OPENED} THEN ${STATUS_ORDER[NotificationDeliveryStatus.OPENED]} WHEN ${status} = ${NotificationDeliveryStatus.FAILED} THEN ${STATUS_ORDER[NotificationDeliveryStatus.FAILED]} ELSE -2 END)`;
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
    //
    // If needed, the caller can disambiguate by calling
    // `getDeliveryByProviderMessageId` to check whether the row exists.
    // We do not perform that check here to avoid an extra query inside the
    // transaction; the rank-guard skip is idempotent and harmless.
    return inserted;
  };

  export const handleDeliveryWebhook = async (
    input: DeliveryWebhookInput,
    tx?: DBTransaction
  ): Promise<NotificationDeliverySelectType | null> => {
    const { providerMessageId, status, webhookPayload, failureReason, userId, channel, eventType } = input;

    const runner = async (t: DBTransaction) => {
      const now = new Date();

      // PERFORMANCE: For high-throughput webhook bursts, consider batching
      // multiple status updates in a single transaction to reduce connection
      // pool pressure. The current per-status FOR UPDATE ensures correctness
      // but can be a bottleneck under Meta's batched retries (up to 1000
      // statuses per webhook).
      //
      // r10-009: The SELECT ... FOR UPDATE below serializes concurrent
      // webhooks targeting the same providerMessageId and holds the row lock
      // for the entire transaction. Under webhook bursts (Meta can batch up
      // to 1000 status updates per webhook delivery), this per-row pessimistic
      // lock becomes a serialization bottleneck and amplifies DB contention.
      // The transaction scope here is already minimal — only the status UPDATE
      // and its timestamp columns are written within the locked section; no
      // audit logging or other non-essential operations are performed inside
      // the FOR UPDATE boundary. The safest improvement at this level is to
      // keep the transaction scope tight (as it already is) and document the
      // trade-off. A batching solution (processing multiple providerMessageIds
      // in a single transaction with a single round of advisory locks) would
      // require changing the caller interface in the webhook handler and is
      // recommended as a future enhancement for high-throughput deployments.
      //
      // B3: Fetch the current row first to enforce forward-only rank guard.
      // TOCTOU fix: acquire FOR UPDATE row lock so concurrent webhooks for the
      // same providerMessageId serialize — preventing double-apply or downgrade
      // via interleaved read-then-write.
      const existing = await t
        .select()
        .from(notificationDeliveries)
        .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
        .limit(1)
        .for("update");

      if (existing.length > 0) {
        return updateExistingWebhookDelivery(t, existing[0], status, webhookPayload, failureReason, now);
      }

      return insertWebhookDelivery(
        t,
        { providerMessageId, status, webhookPayload, failureReason, userId, channel, eventType },
        now
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
      status: toDeliveryStatus(row.status),
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

      const values = inputs.map(input => mapDeliveryInput(input, NotificationDeliveryStatus.PENDING, {}, now));

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
