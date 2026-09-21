import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs } from "@/backend/db/schema";
import type { DBTransaction } from "@/backend/types";

/**
 * Transaction-scoped opt-in to the audit-log maintenance mode enforced by
 * `prevent_audit_log_modification` (see
 * `backend/db/migration/audit_log_immutability_trigger.sql`). The GUC is set
 * with `is_local => true`, so the window dies with the transaction: concurrent
 * journeys and normal traffic keep the full immutability enforcement, with no
 * global trigger toggling (DDL) involved.
 */
export async function withAuditLogMaintenance(fn: (tx: DBTransaction) => Promise<unknown>): Promise<void> {
  await db.transaction(async tx => {
    await tx.execute(sql`SELECT set_config('app.audit_log_maintenance', 'on', true)`);
    await fn(tx);
  });
}

/**
 * Hard-deletes the append-only audit rows a journey's actors produced, via the
 * transaction-scoped maintenance window. Runs before cast teardown so the actors'
 * rows are gone before the users they reference are deleted.
 */
export async function deleteAuditLogsByActorIds(actorUserIds: readonly string[]): Promise<void> {
  if (actorUserIds.length === 0) return;
  await withAuditLogMaintenance(async tx => {
    await tx.delete(auditLogs).where(inArray(auditLogs.actorUserId, [...actorUserIds]));
  });
}

/** Hard-deletes the append-only audit rows recorded for one entity type's rows. */
export async function deleteAuditLogsByEntity(entityType: string, entityIds: readonly string[]): Promise<void> {
  if (entityIds.length === 0) return;
  await withAuditLogMaintenance(async tx => {
    await tx
      .delete(auditLogs)
      .where(and(eq(auditLogs.entityType, entityType), inArray(auditLogs.entityId, [...entityIds])));
  });
}
