import { db } from "@/backend/db";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import type { NotificationChannel, NotificationEventType } from "@/backend/enum";
import type { DBTransaction } from "@/backend/types";

/**
 * Runs `fn` inside the caller-supplied transaction when one exists, otherwise
 * opens a fresh transaction. Centralizes the transaction-or-passthrough branch
 * used by every write method in this domain.
 */
export function runWithDbTransaction<T>(
  tx: DBTransaction | undefined,
  fn: (t: DBTransaction) => Promise<T>
): Promise<T> {
  return tx ? fn(tx) : db.transaction(fn);
}

/** Serializes device-token writes for a single user. */
export async function acquireDeviceTokenLock(tx: DBTransaction, userId: string): Promise<void> {
  await acquireAdvisoryLock(tx, `device_token_user_${userId}`);
}

/** Serializes concurrent delivery-status writes for a single delivery row. */
export async function acquireDeliveryLock(tx: DBTransaction, deliveryId: string): Promise<void> {
  await acquireAdvisoryLock(tx, `notification_delivery_${deliveryId}`);
}

/** Serializes concurrent preference upserts for a single user/channel/event key. */
export async function acquirePreferenceLock(
  tx: DBTransaction,
  userId: string,
  channel: NotificationChannel,
  eventType: NotificationEventType
): Promise<void> {
  await acquireAdvisoryLock(tx, `notification_pref_${userId}_${channel}_${eventType}`);
}
