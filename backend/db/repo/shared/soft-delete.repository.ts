import { and, eq, isNull, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { AuditRepository } from "@/backend/db/repo/audit/audit.repository";
import {
  books,
  classInstances,
  complaints,
  invoices,
  learningResources,
  recurringSchedules,
  suggestions,
  users,
} from "@/backend/db/schema";
import { NotFoundError } from "@/backend/lib";
import type * as Types from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

type SoftDeleteConfigEntry<TName extends Types.SoftDeletableTableName> = {
  table: {
    [K in TName]: Types.SoftDeletableEntityMap[K] extends infer _Row
      ? (typeof SOFT_DELETE_TABLE_RECORDS)[K]
      : never;
  }[TName];
  entityType: string;
};

const SOFT_DELETE_TABLE_RECORDS = {
  users,
  recurring_schedules: recurringSchedules,
  class_instances: classInstances,
  complaints,
  learning_resources: learningResources,
  invoices,
  suggestions,
  books,
} as const;

const SOFT_DELETE_TABLES: {
  [K in Types.SoftDeletableTableName]: {
    table: (typeof SOFT_DELETE_TABLE_RECORDS)[K];
    entityType: string;
  };
} = {
  users: { table: users, entityType: "USER" },
  recurring_schedules: { table: recurringSchedules, entityType: "RECURRING_SCHEDULE" },
  class_instances: { table: classInstances, entityType: "CLASS_INSTANCE" },
  complaints: { table: complaints, entityType: "COMPLAINT" },
  learning_resources: { table: learningResources, entityType: "LEARNING_RESOURCE" },
  invoices: { table: invoices, entityType: "INVOICE" },
  suggestions: { table: suggestions, entityType: "SUGGESTION" },
  books: { table: books, entityType: "BOOK" },
};

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
        const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new NotFoundError(
          input.tableName.toUpperCase(),
          file.recordNotFound({ tableName: input.tableName, entityId: input.entityId })
        );
      }

      const existing = results[0];
      const deletedAt = new Date();
      const updateValues: { deletedAt: Date; updatedAt?: Date } = { deletedAt };

      if ("updatedAt" in config.table) {
        updateValues.updatedAt = deletedAt;
      }

      await t.update(config.table).set(updateValues).where(eq(config.table.id, input.entityId));

      const updated: Types.SoftDeletableEntityMap[typeof input.tableName] = {
        ...existing,
        ...updateValues,
      };

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

  export const softDeleteSuggestion = async (
    suggestionId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["suggestions"]>> => {
    return softDelete({ tableName: "suggestions", entityId: suggestionId, actorUserId }, tx);
  };

  export const softDeleteBook = async (
    bookId: string,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["books"]>> => {
    return softDelete({ tableName: "books", entityId: bookId, actorUserId }, tx);
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
      const deletedResults: Types.SoftDeletableEntityMap[T][] = await t
        .delete(config.table)
        .where(eq(config.table.id, entityId))
        .returning();

      if (deletedResults.length === 0) {
        const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(file.recordNotFound({ tableName, entityId }));
      }

      return deletedResults[0];
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
