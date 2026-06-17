import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { AuditRepository } from "@/backend/db/repo/audit.repository";
import {
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  users,
} from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import type * as Types from "@/backend/types";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

const SOFT_DELETE_TABLES = {
  users: {
    table: users,
    entityType: "USER" as const,
  },
  recurring_schedules: {
    table: recurringSchedules,
    entityType: "RECURRING_SCHEDULE" as const,
  },
  class_instances: {
    table: classInstances,
    entityType: "CLASS_INSTANCE" as const,
  },
  complaints: {
    table: complaints,
    entityType: "COMPLAINT" as const,
  },
  learning_resources: {
    table: learningResources,
    entityType: "LEARNING_RESOURCE" as const,
  },
  invoices: {
    table: invoices,
    entityType: "INVOICE" as const,
  },
} as const;

export namespace SoftDeleteRepository {
  async function acquireSoftDeleteLock(
    tx: DBTransaction,
    tableName: Types.SoftDeletableTableName,
    entityId: string
  ): Promise<void> {
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext('soft_delete_' || ${tableName}::text || '_' || ${entityId}::text))`
    );
  }

  async function enableSoftDeleteSession(tx: DBTransaction): Promise<void> {
    await tx.execute(sql`SELECT set_config('app.soft_delete', 'true', true)`);
  }

  export const softDelete = async <T extends Types.SoftDeletableTableName>(
    input: Types.SoftDeleteInput & { tableName: T },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap[T]>> => {
    const runner = async (t: DBTransaction) => {
      const config = SOFT_DELETE_TABLES[input.tableName];
      await acquireSoftDeleteLock(t, input.tableName, input.entityId);
      await enableSoftDeleteSession(t);

      const results = await t
        .select()
        .from(config.table)
        .where(and(eq(config.table.id, input.entityId), isNull(config.table.deletedAt)))
        .limit(1);

      if (results.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("activeRecordNotFound", { tableName: input.tableName, entityId: input.entityId }));
      }

      const existing = results[0];
      const deletedAt = new Date();
      const updateValues: { deletedAt: Date; updatedAt?: Date } = { deletedAt };

      if ("updatedAt" in config.table) {
        updateValues.updatedAt = deletedAt;
      }

      await t.update(config.table).set(updateValues).where(eq(config.table.id, input.entityId));

      const updated = {
        ...existing,
        ...updateValues,
      } as Types.SoftDeletableEntityMap[typeof input.tableName];

      await AuditRepository.createAuditLog(
        {
          actorUserId: input.actorUserId ?? null,
          actorType: input.actorUserId ? "USER" : "SYSTEM",
          entityType: config.entityType,
          entityId: input.entityId,
          action: "DELETE",
          description: input.description ?? `Soft deleted ${input.tableName} record`,
          previousState: { deletedAt: null },
          newState: { deletedAt: deletedAt.toISOString() },
          changes: { deletedAt: { from: null, to: deletedAt.toISOString() } },
          metadata: {
            tableName: input.tableName,
            softDelete: true,
            ...input.metadata,
          },
        },
        t
      );

      return { entity: updated, deletedAt };
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const softDeleteUser = async (
    userId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["users"]>> => {
    return softDelete({ tableName: "users", entityId: userId, actorUserId }, tx);
  };

  export const softDeleteRecurringSchedule = async (
    scheduleId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["recurring_schedules"]>> => {
    return softDelete({ tableName: "recurring_schedules", entityId: scheduleId, actorUserId }, tx);
  };

  export const softDeleteClassInstance = async (
    classInstanceId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["class_instances"]>> => {
    return softDelete({ tableName: "class_instances", entityId: classInstanceId, actorUserId }, tx);
  };

  export const softDeleteComplaint = async (
    complaintId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["complaints"]>> => {
    return softDelete({ tableName: "complaints", entityId: complaintId, actorUserId }, tx);
  };

  export const softDeleteLearningResource = async (
    resourceId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["learning_resources"]>> => {
    return softDelete({ tableName: "learning_resources", entityId: resourceId, actorUserId }, tx);
  };

  export const softDeleteInvoice = async (
    invoiceId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["invoices"]>> => {
    return softDelete({ tableName: "invoices", entityId: invoiceId, actorUserId }, tx);
  };

  /**
   * Hard-deletes a record. Intended for superuser cleanup of already soft-deleted rows.
   */
  export const hardDelete = async <T extends Types.SoftDeletableTableName>(
    tableName: T,
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap[T]> => {
    const runner = async (t: DBTransaction) => {
      const config = SOFT_DELETE_TABLES[tableName];
      const deletedResults = await t.delete(config.table).where(eq(config.table.id, entityId)).returning();

      if (deletedResults.length === 0) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("recordNotFound", { tableName, entityId }));
      }

      return deletedResults[0] as Types.SoftDeletableEntityMap[T];
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
