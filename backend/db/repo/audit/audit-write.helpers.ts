import { db } from "@/backend/db";
import { maskAuditPayload } from "@/backend/db/repo/audit/audit-masking.helpers";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";

/**
 * Helper to execute a function within a transaction if provided, or a new one otherwise
 */
export async function runInTransaction<T>(
  tx: DBTransaction | undefined,
  fn: (t: DBTransaction) => Promise<T>
): Promise<T> {
  return tx ? await fn(tx) : await db.transaction((t: DBTransaction) => fn(t));
}

/**
 * Maps a single CreateAuditLogInput to an insert row object.
 * Shared by `createAuditLog` (single insert) and `mapAuditLogRows` (bulk insert).
 */
export function mapSingleAuditLogRow(input: Types.CreateAuditLogInput, defaultDate?: Date) {
  return {
    actorUserId: input.actorUserId ?? null,
    actorType: input.actorType,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    description: input.description ?? null,
    previousState: maskAuditPayload(input.previousState),
    newState: maskAuditPayload(input.newState),
    changes: maskAuditPayload(input.changes),
    ipAddress: sanitizeIpAddress(input.ipAddress),
    userAgent: input.userAgent ?? null,
    metadata: input.metadata ?? null,
    createdAt: input.createdAt ?? defaultDate ?? new Date(),
  };
}

/**
 * Maps CreateAuditLogInput[] to insert row objects.
 */
export function mapAuditLogRows(inputs: readonly Types.CreateAuditLogInput[]) {
  const now = new Date();
  return inputs.map(input => mapSingleAuditLogRow(input, now));
}

/**
 * Maps CreateAdminAuditLogInput[] to insert row objects.
 */
export function mapAdminAuditLogRows(inputs: readonly Types.CreateAdminAuditLogInput[]) {
  const now = new Date();
  return inputs.map(input => ({
    actorUserId: input.actorUserId,
    targetUserId: input.targetUserId ?? null,
    action: input.action,
    description: input.description ?? null,
    previousState: maskAuditPayload(input.previousState),
    newState: maskAuditPayload(input.newState),
    ipAddress: sanitizeIpAddress(input.ipAddress),
    createdAt: input.createdAt ?? now,
  }));
}
