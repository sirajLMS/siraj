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
import type { AuditEntityType } from "@/backend/types/audit/audit.types";
import { getServerTranslations } from "@/shared/locale";

type AllTables =
  | typeof users
  | typeof recurringSchedules
  | typeof classInstances
  | typeof complaints
  | typeof learningResources
  | typeof invoices
  | typeof suggestions
  | typeof books;

type AllRows = Types.SoftDeletableEntityMap[Types.SoftDeletableTableName];

const SOFT_DELETE_TABLES: Record<Types.SoftDeletableTableName, { table: AllTables; entityType: AuditEntityType }> = {
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

  async function doSoftDelete(
    config: { table: AllTables; entityType: AuditEntityType },
    input: Types.SoftDeleteInput,
    t: DBTransaction,
    locale?: string
  ): Promise<{ entity: AllRows; deletedAt: Date }> {
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

    const entity: AllRows = { ...existing, ...updateValues };

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

    return { entity, deletedAt };
  }

  async function doHardDelete(
    config: { table: AllTables; entityType: AuditEntityType },
    tableName: Types.SoftDeletableTableName,
    entityId: string,
    t: DBTransaction,
    locale?: string
  ): Promise<AllRows> {
    const deletedResults = await t.delete(config.table).where(eq(config.table.id, entityId)).returning();

    if (deletedResults.length === 0) {
      const { file } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(file.recordNotFound({ tableName, entityId }));
    }

    return deletedResults[0];
  }

  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "users" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["users"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "recurring_schedules" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["recurring_schedules"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "class_instances" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["class_instances"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "complaints" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["complaints"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "learning_resources" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["learning_resources"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "invoices" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["invoices"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "suggestions" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["suggestions"]>>;
  export function softDelete(
    input: Types.SoftDeleteInput & { tableName: "books" },
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeleteResult<Types.SoftDeletableEntityMap["books"]>>;
  export async function softDelete(
    input: Types.SoftDeleteInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<{ entity: AllRows; deletedAt: Date }> {
    const runner = (t: DBTransaction) => {
      const config = SOFT_DELETE_TABLES[input.tableName];
      return doSoftDelete(config, input, t, locale);
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

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
  export function hardDelete(
    tableName: "users",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["users"]>;
  export function hardDelete(
    tableName: "recurring_schedules",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["recurring_schedules"]>;
  export function hardDelete(
    tableName: "class_instances",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["class_instances"]>;
  export function hardDelete(
    tableName: "complaints",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["complaints"]>;
  export function hardDelete(
    tableName: "learning_resources",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["learning_resources"]>;
  export function hardDelete(
    tableName: "invoices",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["invoices"]>;
  export function hardDelete(
    tableName: "suggestions",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["suggestions"]>;
  export function hardDelete(
    tableName: "books",
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<Types.SoftDeletableEntityMap["books"]>;
  export async function hardDelete(
    tableName: Types.SoftDeletableTableName,
    entityId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<AllRows> {
    const runner = (t: DBTransaction) => {
      const config = SOFT_DELETE_TABLES[tableName];
      return doHardDelete(config, tableName, entityId, t, locale);
    };

    return tx ? runner(tx) : db.transaction(runner);
  }
}
