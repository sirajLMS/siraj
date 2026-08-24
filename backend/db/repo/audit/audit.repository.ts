import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/backend/db";
import { bulkInsertOnConflictDoNothing, DEFAULT_BULK_CHUNK_SIZE } from "@/backend/db/repo/shared";
import { adminAuditLogs, auditLogs } from "@/backend/db/schema";
import { sanitizeIpAddress } from "@/backend/lib/ip-utils";
import type * as Types from "@/backend/types";
import type { DBTransaction } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

/**
 * Helper to execute a function within a transaction if provided, or a new one otherwise
 */
async function runInTransaction<T>(tx: DBTransaction | undefined, fn: (t: DBTransaction) => Promise<T>): Promise<T> {
  return tx ? await fn(tx) : await db.transaction((t: DBTransaction) => fn(t));
}

export namespace AuditRepository {
  /**
   * Create an audit log entry.
   */
  export const createAuditLog = async (
    input: Types.CreateAuditLogInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType> => {
    return runInTransaction(tx, async t => {
      const [created] = await t.insert(auditLogs).values(mapSingleAuditLogRow(input)).returning();

      return created;
    });
  };

  /**
   * Maps a single CreateAuditLogInput to an insert row object.
   * Shared by `createAuditLog` (single insert) and `mapAuditLogRows` (bulk insert).
   */
  function mapSingleAuditLogRow(input: Types.CreateAuditLogInput) {
    return {
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description ?? null,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      changes: input.changes ?? null,
      ipAddress: sanitizeIpAddress(input.ipAddress),
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt ?? new Date(),
    };
  }

  /**
   * Maps CreateAuditLogInput[] to insert row objects.
   * NOTE: keep in sync with mapCreateAuditLogRow — the single-row mapper includes
   * `changes`, `userAgent`, and `metadata`; the bulk mapper must insert all fields.
   */
  function mapAuditLogRows(inputs: readonly Types.CreateAuditLogInput[]) {
    const now = new Date();
    return inputs.map(input => ({
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description ?? null,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      changes: input.changes ?? null,
      ipAddress: sanitizeIpAddress(input.ipAddress),
      userAgent: input.userAgent ?? null,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt ?? now,
    }));
  }

  /**
   * Bulk-insert audit log entries. Chunks large batches and returns inserted rows.
   */
  export const createManyAuditLogs = async (
    inputs: readonly Types.CreateAuditLogInput[],
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType[]> => {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<Types.AuditLogSelectType[]> => {
      const rows = mapAuditLogRows(inputs);

      const chunks = Array.from({ length: Math.ceil(rows.length / DEFAULT_BULK_CHUNK_SIZE) }, (_, i) =>
        rows.slice(i * DEFAULT_BULK_CHUNK_SIZE, (i + 1) * DEFAULT_BULK_CHUNK_SIZE)
      );
      const insertedChunks = await chunks.reduce<Promise<Types.AuditLogSelectType[][]>>(
        async (prev, chunk) => [...(await prev), await t.insert(auditLogs).values(chunk).returning()],
        Promise.resolve([])
      );
      return insertedChunks.flat();
    };

    return runInTransaction(tx, run);
  };

  /**
   * Idempotent bulk-insert for audit logs (conflict-safe, no returning).
   */
  export const upsertManyAuditLogs = async (
    inputs: readonly Types.CreateAuditLogInput[],
    tx?: DBTransaction
  ): Promise<void> => {
    if (inputs.length === 0) return;

    const run = async (t: DBTransaction): Promise<void> => {
      const rows = mapAuditLogRows(inputs);

      await bulkInsertOnConflictDoNothing(auditLogs, rows, { tx: t });
    };

    return runInTransaction(tx, run);
  };

  /**
   * Maps CreateAdminAuditLogInput[] to insert row objects.
   */
  function mapAdminAuditLogRows(inputs: readonly Types.CreateAdminAuditLogInput[]) {
    const now = new Date();
    return inputs.map(input => ({
      actorUserId: input.actorUserId,
      targetUserId: input.targetUserId ?? null,
      action: input.action,
      description: input.description ?? null,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      ipAddress: sanitizeIpAddress(input.ipAddress),
      createdAt: input.createdAt ?? now,
    }));
  }

  /**
   * Bulk-insert admin audit log entries.
   */
  export const createManyAdminAuditLogs = async (
    inputs: readonly Types.CreateAdminAuditLogInput[],
    tx?: DBTransaction
  ): Promise<Types.AdminAuditLogSelectType[]> => {
    if (inputs.length === 0) return [];

    const run = async (t: DBTransaction): Promise<Types.AdminAuditLogSelectType[]> => {
      const rows = mapAdminAuditLogRows(inputs);

      const chunks = Array.from({ length: Math.ceil(rows.length / DEFAULT_BULK_CHUNK_SIZE) }, (_, i) =>
        rows.slice(i * DEFAULT_BULK_CHUNK_SIZE, (i + 1) * DEFAULT_BULK_CHUNK_SIZE)
      );
      const insertedChunks = await chunks.reduce<Promise<Types.AdminAuditLogSelectType[][]>>(
        async (prev, chunk) => [...(await prev), await t.insert(adminAuditLogs).values(chunk).returning()],
        Promise.resolve([])
      );
      return insertedChunks.flat();
    };

    return runInTransaction(tx, run);
  };

  /**
   * Idempotent bulk-insert for admin audit logs (conflict-safe, no returning).
   */
  export const upsertManyAdminAuditLogs = async (
    inputs: readonly Types.CreateAdminAuditLogInput[],
    tx?: DBTransaction
  ): Promise<void> => {
    if (inputs.length === 0) return;

    const run = async (t: DBTransaction): Promise<void> => {
      const rows = mapAdminAuditLogRows(inputs);

      await bulkInsertOnConflictDoNothing(adminAuditLogs, rows, { tx: t });
    };

    return runInTransaction(tx, run);
  };

  export const countAuditLogs = async (tx?: DBTransaction): Promise<number> => {
    const client = tx ?? db;
    const [row] = await client.select({ value: count() }).from(auditLogs);
    return row?.value ?? 0;
  };

  export const countAdminAuditLogs = async (tx?: DBTransaction): Promise<number> => {
    const client = tx ?? db;
    const [row] = await client.select({ value: count() }).from(adminAuditLogs);
    return row?.value ?? 0;
  };

  export const getRecentAdminAuditLogs = async (
    limit: number = 100,
    tx?: DBTransaction
  ): Promise<Types.AdminAuditLogSelectType[]> => {
    const client = tx ?? db;
    return client.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.createdAt)).limit(limit);
  };

  /**
   * Internal helper for convenience logging methods
   */
  type TypedAuditLogInput = {
    actorUserId: string | null;
    entityType: Types.AuditEntityType;
    entityId: string;
    action: Types.AuditAction;
    description?: string | null;
    previousState?: Record<string, unknown> | null;
    newState?: Record<string, unknown> | null;
    changes?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };

  async function createTypedAuditLog(
    tx: DBTransaction | undefined,
    input: TypedAuditLogInput
  ): Promise<Types.AuditLogSelectType> {
    return await createAuditLog(
      {
        ...input,
        actorType: input.actorUserId ? "USER" : "SYSTEM",
      },
      tx
    );
  }

  /**
   * Internal helper for logging state transitions with automatic change computation
   */
  async function logStateTransition(
    tx: DBTransaction | undefined,
    input: Omit<TypedAuditLogInput, "changes"> & {
      previousState: Record<string, unknown> | null;
      newState: Record<string, unknown> | null;
    }
  ): Promise<Types.AuditLogSelectType> {
    return await createTypedAuditLog(tx, {
      ...input,
      changes: computeChanges(input.previousState, input.newState),
    });
  }

  /**
   * Internal helper for logging a change to a single field
   */
  async function logSingleFieldChange(
    tx: DBTransaction | undefined,
    input: {
      actorUserId: string | null;
      entityType: Types.AuditEntityType;
      entityId: string;
      action: Types.AuditAction;
      description: string;
      field: string;
      oldValue: unknown;
      newValue: unknown;
      metadata?: Record<string, unknown> | null;
    }
  ): Promise<Types.AuditLogSelectType> {
    return await logStateTransition(tx, {
      actorUserId: input.actorUserId,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description,
      previousState: { [input.field]: input.oldValue },
      newState: { [input.field]: input.newValue },
      metadata: input.metadata,
    });
  }

  /**
   * Query audit logs with filters and pagination.
   */
  export const queryAuditLogs = async (
    filters: Types.AuditLogFilterInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogQueryResult> => {
    return runInTransaction(tx, async t => {
      const conditions = [];

      if (filters.actorUserId) conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
      if (filters.actorType) conditions.push(eq(auditLogs.actorType, filters.actorType));
      if (filters.entityType) conditions.push(eq(auditLogs.entityType, filters.entityType));
      if (filters.entityId) conditions.push(eq(auditLogs.entityId, filters.entityId));
      if (filters.action) conditions.push(eq(auditLogs.action, filters.action));
      if (filters.startDate) conditions.push(gte(auditLogs.createdAt, filters.startDate));
      if (filters.endDate) conditions.push(lte(auditLogs.createdAt, filters.endDate));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [{ total }] = await t.select({ total: count() }).from(auditLogs).where(whereClause);

      const limit = filters.limit ?? 50;
      const offset = filters.offset ?? 0;

      const logs = await t
        .select()
        .from(auditLogs)
        .where(whereClause)
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        logs,
        total,
        hasMore: offset + logs.length < total,
      };
    });
  };

  /**
   * Get audit logs for a specific entity.
   */
  export const getEntityAuditLogs = async (
    entityType: Types.AuditEntityType,
    entityId: string,
    limit: number = 50,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType[]> => {
    const result = await queryAuditLogs({ entityType, entityId, limit }, tx);
    return result.logs;
  };

  /**
   * Get audit logs by actor (user who performed the action).
   */
  export const getActorAuditLogs = async (
    actorUserId: string,
    limit: number = 50,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType[]> => {
    const result = await queryAuditLogs({ actorUserId, limit }, tx);
    return result.logs;
  };

  /**
   * Get recent audit logs across the system.
   */
  export const getRecentAuditLogs = async (
    limit: number = 100,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType[]> => {
    const result = await queryAuditLogs({ limit }, tx);
    return result.logs;
  };

  /**
   * Get audit statistics for a time period.
   */
  export const getAuditStatistics = async (
    startDate: Date,
    endDate: Date,
    tx?: DBTransaction
  ): Promise<{ entityType: string; action: string; count: number }[]> => {
    return runInTransaction(tx, async t => {
      const results = await t
        .select({
          entityType: auditLogs.entityType,
          action: auditLogs.action,
          count: count(),
        })
        .from(auditLogs)
        .where(and(gte(auditLogs.createdAt, startDate), lte(auditLogs.createdAt, endDate)))
        .groupBy(auditLogs.entityType, auditLogs.action)
        .orderBy(desc(count()));

      return results.map(r => ({
        entityType: r.entityType,
        action: r.action,
        count: r.count,
      }));
    });
  };

  /**
   * Helper function to compute changes between old and new state.
   */
  export const computeChanges = (
    previousState: Record<string, unknown> | null,
    newState: Record<string, unknown> | null
  ): Record<string, unknown> | null => {
    if (!previousState || !newState) return null;

    const changes: Record<string, unknown> = {};

    for (const key in newState) {
      if (previousState[key] !== newState[key]) {
        changes[key] = { from: previousState[key], to: newState[key] };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  };

  /**
   * Student status change log input
   */
  export interface StudentStatusChangeInput {
    studentId: string;
    oldStatus: string;
    newStatus: string;
    actorUserId: string | null;
    description?: string;
  }

  export const logStudentStatusChange = (input: StudentStatusChangeInput, tx?: DBTransaction) =>
    logSingleFieldChange(tx, {
      actorUserId: input.actorUserId,
      entityType: "STUDENT",
      entityId: input.studentId,
      action: "STATUS_CHANGE",
      description: input.description ?? `Status changed from ${input.oldStatus} to ${input.newStatus}`,
      field: "status",
      oldValue: input.oldStatus,
      newValue: input.newStatus,
    });

  /**
   * Invoice change log input
   */
  export interface InvoiceChangeInput {
    invoiceId: string;
    action: Types.AuditAction;
    previousState: Record<string, unknown> | null;
    newState: Record<string, unknown> | null;
    actorUserId: string | null;
    description?: string;
  }

  export const logInvoiceChange = async (
    input: InvoiceChangeInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType> => {
    const { invoiceId, action, previousState, newState, actorUserId, description } = input;
    return await logStateTransition(tx, {
      actorUserId,
      entityType: "INVOICE",
      entityId: invoiceId,
      action,
      description,
      previousState,
      newState,
    });
  };

  /**
   * Payment refund log input
   */
  export interface PaymentRefundInput {
    paymentId: string;
    refundAmount: number;
    currency: CurrencyCode;
    actorUserId: string | null;
    reason?: string;
  }

  export const logPaymentRefund = async (
    input: PaymentRefundInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType> => {
    const { paymentId, refundAmount, currency, actorUserId, reason } = input;
    return await createTypedAuditLog(tx, {
      actorUserId,
      entityType: "PAYMENT",
      entityId: paymentId,
      action: "REFUND",
      description: reason ?? `Refund of ${refundAmount} ${currency}`,
      metadata: { refundAmount, currency, reason },
    });
  };

  /**
   * Permission change log input
   */
  export interface PermissionChangeInput {
    userId: string;
    action: "GRANT" | "REVOKE";
    permissionOrGroupId: string;
    permissionType: "PERMISSION" | "PERMISSION_GROUP";
    actorUserId: string | null;
    description?: string;
  }

  export const logPermissionChange = async (
    input: PermissionChangeInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType> => {
    const { userId, action, permissionOrGroupId, permissionType, actorUserId, description } = input;
    return await createTypedAuditLog(tx, {
      actorUserId,
      entityType: permissionType === "PERMISSION" ? "PERMISSION" : "PERMISSION_GROUP",
      entityId: permissionOrGroupId,
      action,
      description:
        description ?? `${action === "GRANT" ? "Granted" : "Revoked"} ${permissionType.toLowerCase()} for user`,
      metadata: { targetUserId: userId, permissionType },
    });
  };

  /**
   * Exchange rate update log input
   */
  export interface ExchangeRateUpdateInput {
    rateId: string;
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    oldRate: number | null;
    newRate: number;
    actorUserId: string | null;
    source?: string;
  }

  export const logExchangeRateUpdate = async (
    input: ExchangeRateUpdateInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogSelectType> => {
    const { rateId, fromCurrency, toCurrency, oldRate, newRate, actorUserId, source } = input;
    const rateDisplay = oldRate ? `${oldRate} → ${newRate}` : newRate;

    return await logSingleFieldChange(tx, {
      actorUserId,
      entityType: "EXCHANGE_RATE",
      entityId: rateId,
      action: oldRate ? "UPDATE" : "CREATE",
      description: `Exchange rate ${fromCurrency}/${toCurrency}: ${rateDisplay}`,
      field: "rate",
      oldValue: oldRate,
      newValue: newRate,
      metadata: { fromCurrency, toCurrency, source },
    });
  };

  /**
   * System setting change log input
   */
  export interface SystemSettingChangeInput {
    settingKey: string;
    oldValue: unknown;
    newValue: unknown;
    actorUserId: string | null;
    description?: string;
  }

  export const logSystemSettingChange = (input: SystemSettingChangeInput, tx?: DBTransaction) =>
    logSingleFieldChange(tx, {
      actorUserId: input.actorUserId,
      entityType: "SYSTEM_SETTING",
      entityId: input.settingKey,
      action: "UPDATE",
      description: input.description ?? `System setting '${input.settingKey}' changed`,
      field: "value",
      oldValue: input.oldValue,
      newValue: input.newValue,
    });
}
