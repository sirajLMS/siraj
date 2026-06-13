import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs } from "@/backend/db/schema";
import type * as Types from "@/backend/types";

// Extract the transaction type from Drizzle
type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

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
  ): Promise<Types.AuditLogEntity> => {
    return runInTransaction(tx, async t => {
      const [created] = await t
        .insert(auditLogs)
        .values({
          actorUserId: input.actorUserId ?? null,
          actorType: input.actorType,
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          description: input.description ?? null,
          previousState: input.previousState ?? null,
          newState: input.newState ?? null,
          changes: input.changes ?? null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          metadata: input.metadata ?? null,
          createdAt: new Date(),
        })
        .returning();

      return created;
    });
  };

  /**
   * Internal helper for convenience logging methods
   */
  async function createTypedAuditLog(
    tx: DBTransaction | undefined,
    input: {
      actorUserId: string | null;
      entityType: Types.AuditEntityType;
      entityId: string;
      action: Types.AuditAction;
      description?: string | null;
      previousState?: Record<string, unknown> | null;
      newState?: Record<string, unknown> | null;
      changes?: Record<string, unknown> | null;
      metadata?: Record<string, unknown> | null;
    }
  ): Promise<Types.AuditLogEntity> {
    return await createAuditLog(
      {
        ...input,
        actorType: input.actorUserId ? "USER" : "SYSTEM",
      },
      tx
    );
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
  ): Promise<Types.AuditLogEntity[]> => {
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
  ): Promise<Types.AuditLogEntity[]> => {
    const result = await queryAuditLogs({ actorUserId, limit }, tx);
    return result.logs;
  };

  /**
   * Get recent audit logs across the system.
   */
  export const getRecentAuditLogs = async (limit: number = 100, tx?: DBTransaction): Promise<Types.AuditLogEntity[]> => {
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

  export const logStudentStatusChange = async (
    input: StudentStatusChangeInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    const { studentId, oldStatus, newStatus, actorUserId, description } = input;
    return await createTypedAuditLog(tx, {
      actorUserId,
      entityType: "STUDENT",
      entityId: studentId,
      action: "STATUS_CHANGE",
      description: description ?? `Status changed from ${oldStatus} to ${newStatus}`,
      previousState: { status: oldStatus },
      newState: { status: newStatus },
      changes: { status: { from: oldStatus, to: newStatus } },
    });
  };

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

  export const logInvoiceChange = async (input: InvoiceChangeInput, tx?: DBTransaction): Promise<Types.AuditLogEntity> => {
    const { invoiceId, action, previousState, newState, actorUserId, description } = input;
    return await createTypedAuditLog(tx, {
      actorUserId,
      entityType: "INVOICE",
      entityId: invoiceId,
      action,
      description,
      previousState,
      newState,
      changes: computeChanges(previousState, newState),
    });
  };

  /**
   * Payment refund log input
   */
  export interface PaymentRefundInput {
    paymentId: string;
    refundAmount: number;
    currency: string;
    actorUserId: string | null;
    reason?: string;
  }

  export const logPaymentRefund = async (input: PaymentRefundInput, tx?: DBTransaction): Promise<Types.AuditLogEntity> => {
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
  ): Promise<Types.AuditLogEntity> => {
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
    fromCurrency: string;
    toCurrency: string;
    oldRate: number | null;
    newRate: number;
    actorUserId: string | null;
    source?: string;
  }

  export const logExchangeRateUpdate = async (
    input: ExchangeRateUpdateInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    const { rateId, fromCurrency, toCurrency, oldRate, newRate, actorUserId, source } = input;
    const rateDisplay = oldRate ? `${oldRate} → ${newRate}` : newRate;

    return await createTypedAuditLog(tx, {
      actorUserId,
      entityType: "EXCHANGE_RATE",
      entityId: rateId,
      action: oldRate ? "UPDATE" : "CREATE",
      description: `Exchange rate ${fromCurrency}/${toCurrency}: ${rateDisplay}`,
      previousState: oldRate ? { rate: oldRate } : null,
      newState: { rate: newRate },
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

  export const logSystemSettingChange = async (
    input: SystemSettingChangeInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    const { settingKey, oldValue, newValue, actorUserId, description } = input;
    return await createTypedAuditLog(tx, {
      actorUserId,
      entityType: "SYSTEM_SETTING",
      entityId: settingKey,
      action: "UPDATE",
      description: description ?? `System setting '${settingKey}' changed`,
      previousState: { value: oldValue },
      newState: { value: newValue },
      changes: { value: { from: oldValue, to: newValue } },
    });
  };
}
