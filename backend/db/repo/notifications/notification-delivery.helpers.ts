import { eq, inArray } from "drizzle-orm";
import type { QueryDbHandle } from "@/backend/db";
import { notificationDeliveries } from "@/backend/db/schema";
import { type NotificationChannel, NotificationDeliveryStatus, type NotificationEventType } from "@/backend/enum";
import type {
  CreateNotificationDeliveryInput,
  DBTransaction,
  NotificationDeliverySelectType,
  NotificationMetadata,
} from "@/backend/types";

/** Input accepted by `createManyDeliveries` — a delivery input plus an explicit status. */
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
const mapDeliveryInput = (
  input: {
    userId?: string;
    deviceTokenId?: string | null;
    channel: NotificationChannel | string;
    eventType: NotificationEventType | string;
    title?: string | null;
    body?: string | null;
    metadata?: NotificationMetadata | null;
    providerMessageId?: string | null;
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
) => {
  return {
    userId: input.userId ?? "",
    deviceTokenId: input.deviceTokenId ?? null,
    channel: input.channel,
    eventType: input.eventType,
    status,
    title: input.title ?? null,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    providerMessageId: input.providerMessageId ?? null,
    sentAt: extras.sentAt ?? null,
    deliveredAt: extras.deliveredAt ?? null,
    failedAt: extras.failedAt ?? null,
    failureReason: extras.failureReason ?? null,
    createdAt: extras.createdAt ?? now,
    updatedAt: extras.updatedAt ?? now,
  };
};

const insertDeliveryRows = async (
  t: DBTransaction,
  values: ReturnType<typeof mapDeliveryInput>[]
): Promise<NotificationDeliverySelectType[]> => t.insert(notificationDeliveries).values(values).returning();

export async function insertManyDeliveries(
  t: DBTransaction,
  inputs: NotificationDeliveryInsertInput[]
): Promise<NotificationDeliverySelectType[]> {
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

  return insertDeliveryRows(t, values);
}

export async function insertDeliveriesBatch(
  t: DBTransaction,
  inputs: CreateNotificationDeliveryInput[]
): Promise<NotificationDeliverySelectType[]> {
  const now = new Date();
  const values = inputs.map(input => mapDeliveryInput(input, NotificationDeliveryStatus.PENDING, {}, now));

  return insertDeliveryRows(t, values);
}

export async function findDeliveryByProviderMessageId(
  q: QueryDbHandle | DBTransaction,
  providerMessageId: string
): Promise<NotificationDeliverySelectType | null> {
  const [result] = await q
    .select()
    .from(notificationDeliveries)
    .where(eq(notificationDeliveries.providerMessageId, providerMessageId))
    .limit(1);

  return result ?? null;
}

export async function findDeliveriesByProviderMessageIds(
  q: QueryDbHandle | DBTransaction,
  providerMessageIds: string[]
): Promise<Map<string, NotificationDeliverySelectType>> {
  const results = await q
    .select()
    .from(notificationDeliveries)
    .where(inArray(notificationDeliveries.providerMessageId, providerMessageIds));

  return new Map(
    results
      .filter((r): r is typeof r & { providerMessageId: string } => r.providerMessageId !== null)
      .map(r => [r.providerMessageId, r])
  );
}

export async function createDeliveryRunner(
  t: DBTransaction,
  input: CreateNotificationDeliveryInput
): Promise<NotificationDeliverySelectType> {
  const now = new Date();

  if (input.providerMessageId) {
    // Race-condition guard: if the webhook handler already created a row
    // for this provider message ID before we reached this INSERT, return
    // it so we never overwrite a newer status (e.g. DELIVERED) with PENDING.
    const existing = await findDeliveryByProviderMessageId(t, input.providerMessageId);
    if (existing) {
      return existing;
    }
  }

  const values = {
    userId: input.userId,
    deviceTokenId: input.deviceTokenId ?? null,
    channel: input.channel,
    eventType: input.eventType,
    status: NotificationDeliveryStatus.PENDING,
    title: input.title ?? null,
    body: input.body ?? null,
    metadata: input.metadata ?? null,
    providerMessageId: input.providerMessageId ?? null,
    createdAt: now,
    updatedAt: now,
  };

  if (input.providerMessageId) {
    const [created] = await t
      .insert(notificationDeliveries)
      .values(values)
      .onConflictDoNothing({
        target: notificationDeliveries.providerMessageId,
      })
      .returning();

    if (created) {
      return created;
    }

    const existing = await findDeliveryByProviderMessageId(t, input.providerMessageId);
    if (existing) {
      return existing;
    }
  }

  const [created] = await t.insert(notificationDeliveries).values(values).returning();
  return created;
}
