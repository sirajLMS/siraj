import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { auditLogs } from "@/backend/db/schema";
import type * as Types from "@/backend/types";

// Extract the transaction type from Drizzle
type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export namespace AuditRepository {
  /**
   * Create an audit log entry.
   * Supports both standalone and transactional usage.
   */
  export const createAuditLog = async (
    input: Types.CreateAuditLogInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    const runner = async (t: DBTransaction) => {
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
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Query audit logs with filters and pagination.
   */
  export const queryAuditLogs = async (
    filters: Types.AuditLogFilterInput,
    tx?: DBTransaction
  ): Promise<Types.AuditLogQueryResult> => {
    const runner = async (t: DBTransaction) => {
      const conditions = [];

      if (filters.actorUserId) {
        conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
      }

      if (filters.actorType) {
        conditions.push(eq(auditLogs.actorType, filters.actorType));
      }

      if (filters.entityType) {
        conditions.push(eq(auditLogs.entityType, filters.entityType));
      }

      if (filters.entityId) {
        conditions.push(eq(auditLogs.entityId, filters.entityId));
      }

      if (filters.action) {
        conditions.push(eq(auditLogs.action, filters.action));
      }

      if (filters.startDate) {
        conditions.push(gte(auditLogs.createdAt, filters.startDate));
      }

      if (filters.endDate) {
        conditions.push(lte(auditLogs.createdAt, filters.endDate));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ total }] = await t.select({ total: count() }).from(auditLogs).where(whereClause);

      // Get logs with pagination
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
        total: total,
        hasMore: offset + logs.length < total,
      };
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
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
    const runner = async (t: DBTransaction) => {
      return await t
        .select()
        .from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Get audit logs by actor (user who performed the action).
   */
  export const getActorAuditLogs = async (
    actorUserId: string,
    limit: number = 50,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity[]> => {
    const runner = async (t: DBTransaction) => {
      return await t
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.actorUserId, actorUserId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit);
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Get recent audit logs across the system.
   */
  export const getRecentAuditLogs = async (
    limit: number = 100,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity[]> => {
    const runner = async (t: DBTransaction) => {
      return await t.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Get audit statistics for a time period.
   */
  export const getAuditStatistics = async (
    startDate: Date,
    endDate: Date,
    tx?: DBTransaction
  ): Promise<{ entityType: string; action: string; count: number }[]> => {
    const runner = async (t: DBTransaction) => {
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
    };

    return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
  };

  /**
   * Helper function to compute changes between old and new state.
   * Returns an object with only the fields that changed.
   */
  export const computeChanges = (
    previousState: Record<string, unknown> | null,
    newState: Record<string, unknown> | null
  ): Record<string, unknown> | null => {
    if (!previousState || !newState) {
      return null;
    }

    const changes: Record<string, unknown> = {};

    for (const key in newState) {
      if (previousState[key] !== newState[key]) {
        changes[key] = {
          from: previousState[key],
          to: newState[key],
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : null;
  };

  /**
   * Convenience method to log student status changes.
   */
  export const logStudentStatusChange = async (
    studentId: string,
    oldStatus: string,
    newStatus: string,
    actorUserId: string | null,
    description?: string,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    return await createAuditLog(
      {
        actorUserId,
        actorType: actorUserId ? "USER" : "SYSTEM",
        entityType: "STUDENT",
        entityId: studentId,
        action: "STATUS_CHANGE",
        description: description ?? `Status changed from ${oldStatus} to ${newStatus}`,
        previousState: { status: oldStatus },
        newState: { status: newStatus },
        changes: { status: { from: oldStatus, to: newStatus } },
      },
      tx
    );
  };

  /**
   * Convenience method to log invoice modifications.
   */
  export const logInvoiceChange = async (
    invoiceId: string,
    action: Types.AuditAction,
    previousState: Record<string, unknown> | null,
    newState: Record<string, unknown> | null,
    actorUserId: string | null,
    description?: string,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    return await createAuditLog(
      {
        actorUserId,
        actorType: actorUserId ? "USER" : "SYSTEM",
        entityType: "INVOICE",
        entityId: invoiceId,
        action,
        description,
        previousState,
        newState,
        changes: computeChanges(previousState, newState),
      },
      tx
    );
  };

  /**
   * Convenience method to log payment refunds.
   */
  export const logPaymentRefund = async (
    paymentId: string,
    refundAmount: number,
    currency: string,
    actorUserId: string | null,
    reason?: string,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    return await createAuditLog(
      {
        actorUserId,
        actorType: actorUserId ? "USER" : "SYSTEM",
        entityType: "PAYMENT",
        entityId: paymentId,
        action: "REFUND",
        description: reason ?? `Refund of ${refundAmount} ${currency}`,
        metadata: {
          refundAmount,
          currency,
          reason,
        },
      },
      tx
    );
  };

  /**
   * Convenience method to log permission changes.
   */
  export const logPermissionChange = async (
    userId: string,
    action: "GRANT" | "REVOKE",
    permissionOrGroupId: string,
    permissionType: "PERMISSION" | "PERMISSION_GROUP",
    actorUserId: string | null,
    description?: string,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    return await createAuditLog(
      {
        actorUserId,
        actorType: actorUserId ? "USER" : "SYSTEM",
        entityType: permissionType === "PERMISSION" ? "PERMISSION" : "PERMISSION_GROUP",
        entityId: permissionOrGroupId,
        action,
        description:
          description ?? `${action === "GRANT" ? "Granted" : "Revoked"} ${permissionType.toLowerCase()} for user`,
        metadata: {
          targetUserId: userId,
          permissionType,
        },
      },
      tx
    );
  };

  /**
   * Convenience method to log exchange rate updates.
   */
  export const logExchangeRateUpdate = async (
    rateId: string,
    fromCurrency: string,
    toCurrency: string,
    oldRate: number | null,
    newRate: number,
    actorUserId: string | null,
    source?: string,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    // 1. Extract the rate display text to avoid nested template literals
    const rateDisplay = oldRate ? `${oldRate} → ${newRate}` : newRate;

    return await createAuditLog(
      {
        actorUserId,
        actorType: actorUserId ? "USER" : "SYSTEM",
        entityType: "EXCHANGE_RATE",
        entityId: rateId,
        action: oldRate ? "UPDATE" : "CREATE",
        // 2. Use the clean variable here
        description: `Exchange rate ${fromCurrency}/${toCurrency}: ${rateDisplay}`,
        previousState: oldRate ? { rate: oldRate } : null,
        newState: { rate: newRate },
        metadata: {
          fromCurrency,
          toCurrency,
          source,
        },
      },
      tx
    );
  };

  /**
   * Convenience method to log system settings changes.
   */
  export const logSystemSettingChange = async (
    settingKey: string,
    oldValue: unknown,
    newValue: unknown,
    actorUserId: string | null,
    description?: string,
    tx?: DBTransaction
  ): Promise<Types.AuditLogEntity> => {
    return await createAuditLog(
      {
        actorUserId,
        actorType: actorUserId ? "USER" : "SYSTEM",
        entityType: "SYSTEM_SETTING",
        entityId: settingKey,
        action: "UPDATE",
        description: description ?? `System setting '${settingKey}' changed`,
        previousState: { value: oldValue },
        newState: { value: newValue },
        changes: { value: { from: oldValue, to: newValue } },
      },
      tx
    );
  };
}
