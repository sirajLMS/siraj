import { createHash } from "node:crypto";
import { and, count, desc, eq, gt, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import type { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import type {
  QuotaPaginatedFilter,
  QuotaSelectType,
  QuotaSubmitInput,
  QuotaUpdateInput,
} from "@/backend/types/billing/quota.types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";

type ReadExecutor = DBTransaction | typeof db;

export namespace QuotaRepository {
  export const deriveGrantIdempotencyKey = (quotaId: string): string => {
    return createHash("sha256").update(`quota-grant:${quotaId}`).digest("hex");
  };

  export const deriveRedeemIdempotencyKey = (classInstanceId: string, quotaId: string): string => {
    return createHash("sha256").update(`quota-redeem:${classInstanceId}:${quotaId}`).digest("hex");
  };

  export const deriveReserveIdempotencyKey = (recurringScheduleId: string, quotaId: string): string => {
    return createHash("sha256").update(`quota-reserve:${recurringScheduleId}:${quotaId}`).digest("hex");
  };

  export const deriveReleasePoolIdempotencyKey = (classInstanceId: string, quotaId: string): string => {
    return createHash("sha256").update(`quota-release:${classInstanceId}:${quotaId}`).digest("hex");
  };

  export const deriveReleaseEarmarkIdempotencyKey = (
    recurringScheduleId: string,
    classInstanceId: string,
    quotaId: string
  ): string => {
    return createHash("sha256")
      .update(`quota-release:${recurringScheduleId}:${classInstanceId}:${quotaId}`)
      .digest("hex");
  };

  export const deriveExpireIdempotencyKey = (quotaId: string, periodStr: string): string => {
    return createHash("sha256").update(`quota-expire:${quotaId}:${periodStr}`).digest("hex");
  };

  /**
   * Idempotency key for a per-period GRANT issued by `refreshPeriodic`.
   * Distinct from {@link deriveGrantIdempotencyKey} (the one-time creation grant)
   * so that rollover grants for different periods never collide.
   */
  export const derivePeriodicGrantIdempotencyKey = (quotaId: string, periodStr: string): string => {
    return createHash("sha256").update(`quota-grant:periodic:${quotaId}:${periodStr}`).digest("hex");
  };

  /**
   * Type guard for the rich JSONB rollover policy shape enforced by
   * `quotas_rollover_policy_valid_chk` (`maxRolloverPercent` + `accumulationCap`).
   * Returns `false` for legacy plain-string policies (`"GRANT" | "EXPIRE"`).
   */
  const isRichRolloverPolicy = (
    policy: unknown
  ): policy is { maxRolloverPercent: number | null; accumulationCap: number | null } => {
    if (typeof policy !== "object" || policy === null) return false;
    const obj = policy as Record<string, unknown>;
    return "maxRolloverPercent" in obj && "accumulationCap" in obj;
  };

  export const create = async (
    tx: DBTransaction,
    input: QuotaSubmitInput & { actorUserId?: string | null }
  ): Promise<QuotaSelectType> => {
    const now = new Date();
    const validFromDate = input.validFrom ? new Date(input.validFrom) : null;
    const validUntilDate = input.validUntil ? new Date(input.validUntil) : null;
    const validFromStr = validFromDate ? validFromDate.toISOString().slice(0, 10) : null;
    const validUntilStr = validUntilDate ? validUntilDate.toISOString().slice(0, 10) : null;

    const [newQuota] = await tx
      .insert(quotas)
      .values({
        studentId: input.studentId,
        kind: input.kind,
        name: input.name,
        totalClasses: input.totalClasses,
        remaining: input.totalClasses,
        reservedClasses: 0,
        usedThisPeriod: 0,
        periodType: input.periodType ?? null,
        periodDays: input.periodDays ?? null,
        periodAnchor: input.kind === "PERIODIC" ? now : null,
        validFrom: validFromStr,
        validUntil: validUntilStr,
        status: QuotaStatus.ACTIVE,
        priority: input.priority ?? 0,
        rolloverPolicy: input.rolloverPolicy ?? null,
        version: 1,
        idempotencyKey:
          input.idempotencyKey ??
          createHash("sha256")
            .update(`quota-create:${input.studentId}:${input.kind}:${input.name}:${input.totalClasses}`)
            .digest("hex"),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!newQuota) throw new Error("Failed to insert quota");

    const grantKey = deriveGrantIdempotencyKey(newQuota.id);
    await QuotaLedgerRepository.insert(tx, {
      quotaId: newQuota.id,
      studentId: newQuota.studentId,
      delta: input.totalClasses,
      reason: QuotaLedgerReason.GRANT,
      reasonNote: `Initial quota grant: ${input.name}`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: grantKey,
    });

    return newQuota;
  };

  export const findById = async (tx?: ReadExecutor, id?: string): Promise<QuotaSelectType | null> => {
    if (!id) return null;
    const q = queryDb(tx);
    const [row] = await q
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, id), isNull(quotas.deletedAt)))
      .limit(1);
    return row ?? null;
  };

  export const listByStudent = async (
    tx?: ReadExecutor,
    studentId?: string,
    limit = 100
  ): Promise<QuotaSelectType[]> => {
    if (!studentId) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(quotas)
      .where(and(eq(quotas.studentId, studentId), isNull(quotas.deletedAt)))
      .orderBy(desc(quotas.createdAt))
      .limit(limit);
  };

  export const listActiveByStudent = async (tx?: ReadExecutor, studentId?: string): Promise<QuotaSelectType[]> => {
    if (!studentId) return [];
    const q = queryDb(tx);
    return q
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.studentId, studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt)
        )
      )
      .orderBy(desc(quotas.priority), quotas.validUntil, quotas.createdAt);
  };

  export const listAllPaginated = async (
    tx?: ReadExecutor,
    filter?: QuotaPaginatedFilter | null,
    pagination?: PaginationArgs | null
  ): Promise<{ rows: QuotaSelectType[]; totalCount: number }> => {
    const q = queryDb(tx);
    const conditions = [isNull(quotas.deletedAt)];

    if (filter?.studentId) {
      conditions.push(eq(quotas.studentId, filter.studentId));
    }
    if (filter?.status) {
      conditions.push(eq(quotas.status, filter.status));
    }
    if (filter?.kind) {
      conditions.push(eq(quotas.kind, filter.kind));
    }
    if (filter?.search) {
      const searchPattern = `%${filter.search}%`;
      conditions.push(sql`${quotas.name} ILIKE ${searchPattern}`);
    }

    const whereClause = and(...conditions);
    const baseQuery = q.select().from(quotas).where(whereClause).orderBy(desc(quotas.createdAt)).$dynamic();

    const [rows, countRow] = await Promise.all([
      queryWithPagination(baseQuery, pagination),
      q.select({ value: count() }).from(quotas).where(whereClause),
    ]);

    return {
      rows,
      totalCount: Number(countRow[0]?.value ?? 0),
    };
  };

  export const update = async (
    tx: DBTransaction,
    id: string,
    input: QuotaUpdateInput & { actorUserId?: string | null }
  ): Promise<QuotaSelectType> => {
    const now = new Date();
    const existing = await findById(tx, id);
    if (!existing) throw new Error("Quota not found");
    if (existing.version !== input.version) {
      throw new Error("Concurrency conflict: quota version mismatch");
    }

    const updateData: Partial<QuotaSelectType> = {
      version: existing.version + 1,
      updatedAt: now,
    };

    if (input.name !== undefined && input.name !== null) updateData.name = input.name;
    if (input.priority !== undefined && input.priority !== null) updateData.priority = input.priority;
    if (input.status !== undefined && input.status !== null) updateData.status = input.status;
    if (input.validUntil !== undefined) {
      updateData.validUntil = input.validUntil ? new Date(input.validUntil).toISOString().slice(0, 10) : null;
    }

    const [updated] = await tx
      .update(quotas)
      .set(updateData)
      .where(and(eq(quotas.id, id), eq(quotas.version, input.version)))
      .returning();

    if (!updated) throw new Error("Quota update failed due to concurrent modification");
    return updated;
  };

  export const softDelete = async (tx: DBTransaction, id: string): Promise<QuotaSelectType> => {
    const now = new Date();
    const [row] = await tx
      .update(quotas)
      .set({
        deletedAt: now,
        status: QuotaStatus.ARCHIVED,
        updatedAt: now,
      })
      .where(and(eq(quotas.id, id), isNull(quotas.deletedAt)))
      .returning();

    if (!row) throw new Error("Quota not found or already deleted");
    return row;
  };

  export const selectQuotaForBookingFIFO = async (
    tx: DBTransaction,
    studentId: string
  ): Promise<QuotaSelectType | null> => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const [quotaRow] = await tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.studentId, studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt),
          or(isNull(quotas.validUntil), gte(quotas.validUntil, todayStr))
        )
      )
      .orderBy(desc(quotas.priority), quotas.validUntil, quotas.createdAt)
      .limit(1);

    return quotaRow ?? null;
  };

  export const reserveClasses = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      recurringScheduleId: string;
      count: number;
      actorUserId?: string | null;
      idempotencyKey: string;
    }
  ): Promise<QuotaSelectType> => {
    const now = new Date();
    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: sql<number>`${quotas.remaining} - ${input.count}`,
        reservedClasses: sql<number>`${quotas.reservedClasses} + ${input.count}`,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gte(quotas.remaining, input.count),
          isNull(quotas.deletedAt)
        )
      )
      .returning();

    if (!updated) throw new Error("Failed to update quota reservations: quota may be insufficient or inactive");

    await QuotaLedgerRepository.insert(tx, {
      quotaId: input.quotaId,
      studentId: input.studentId,
      recurringScheduleId: input.recurringScheduleId,
      delta: -input.count,
      reason: QuotaLedgerReason.RESERVE,
      reasonNote: `Reserved ${input.count} classes for recurring schedule`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: input.idempotencyKey,
    });

    return updated;
  };

  export const releaseForRecurringSchedule = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      recurringScheduleId: string;
      count: number;
      actorUserId?: string | null;
      idempotencyKey: string;
    }
  ): Promise<QuotaSelectType> => {
    const now = new Date();

    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: sql<number>`${quotas.remaining} + ${input.count}`,
        reservedClasses: sql<number>`${quotas.reservedClasses} - ${input.count}`,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gte(quotas.reservedClasses, input.count),
          isNull(quotas.deletedAt)
        )
      )
      .returning();

    if (!updated) throw new Error("Failed to release quota reservation: insufficient reserved classes");

    await QuotaLedgerRepository.insert(tx, {
      quotaId: input.quotaId,
      studentId: input.studentId,
      recurringScheduleId: input.recurringScheduleId,
      delta: input.count,
      reason: QuotaLedgerReason.RELEASE,
      reasonNote: `Released ${input.count} reserved classes for recurring schedule`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: input.idempotencyKey,
    });

    return updated;
  };

  export const redeemForInstance = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      classInstanceId: string;
      recurringScheduleId?: string | null;
      actorUserId?: string | null;
      idempotencyKey: string;
    }
  ): Promise<QuotaSelectType> => {
    const now = new Date();
    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: sql<number>`${quotas.remaining} - 1`,
        usedThisPeriod: sql<number>`${quotas.usedThisPeriod} + 1`,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt)
        )
      )
      .returning();

    if (!updated) throw new Error("Failed to redeem quota class: quota may be depleted or inactive");

    await QuotaLedgerRepository.insert(tx, {
      quotaId: input.quotaId,
      studentId: input.studentId,
      classInstanceId: input.classInstanceId,
      recurringScheduleId: input.recurringScheduleId ?? null,
      delta: -1,
      reason: QuotaLedgerReason.REDEEM,
      reasonNote: `Redeemed 1 class for instance ${input.classInstanceId}`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: input.idempotencyKey,
    });

    return updated;
  };

  export const releaseForInstance = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      classInstanceId: string;
      recurringScheduleId?: string | null;
      actorUserId?: string | null;
      idempotencyKey: string;
    }
  ): Promise<QuotaSelectType> => {
    const now = new Date();
    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: sql<number>`${quotas.remaining} + 1`,
        usedThisPeriod: sql<number>`GREATEST(${quotas.usedThisPeriod} - 1, 0)`,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.usedThisPeriod, 0),
          isNull(quotas.deletedAt)
        )
      )
      .returning();

    if (!updated) throw new Error("Failed to release quota class: quota may be inactive or no classes used");

    await QuotaLedgerRepository.insert(tx, {
      quotaId: input.quotaId,
      studentId: input.studentId,
      classInstanceId: input.classInstanceId,
      recurringScheduleId: input.recurringScheduleId ?? null,
      delta: 1,
      reason: QuotaLedgerReason.RELEASE,
      reasonNote: `Released 1 class for instance ${input.classInstanceId}`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: input.idempotencyKey,
    });

    return updated;
  };

  export const redeemForInstanceBatch = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      recurringScheduleId?: string | null;
      instanceIds: string[];
      actorUserId?: string | null;
    }
  ): Promise<{ redeemedCount: number; quota: QuotaSelectType | null }> => {
    if (input.instanceIds.length === 0) {
      return { redeemedCount: 0, quota: null };
    }

    const count = input.instanceIds.length;
    const now = new Date();

    // Guard: ensure quota is active and has enough remaining BEFORE inserting ledger rows.
    // We check here without deducting — the actual deduction uses inserted.length below.
    const [guardRow] = await tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gte(quotas.remaining, count),
          isNull(quotas.deletedAt)
        )
      )
      .limit(1);

    if (!guardRow) {
      return { redeemedCount: 0, quota: null };
    }

    // Build one ledger row per instance using the same idempotency-key derivation as redeemForInstance
    const ledgerRows = input.instanceIds.map(instId => ({
      quotaId: input.quotaId,
      studentId: input.studentId,
      recurringScheduleId: input.recurringScheduleId ?? null,
      classInstanceId: instId,
      delta: -1,
      reason: QuotaLedgerReason.REDEEM,
      reasonNote: `Redeemed 1 class for instance ${instId}`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: deriveRedeemIdempotencyKey(instId, input.quotaId),
    }));

    const inserted = await QuotaLedgerRepository.insertBatch(tx, ledgerRows);
    const redeemedCount = inserted.length;

    // Deduct ONLY by the actual number of newly inserted ledger rows, not the full count.
    // This prevents quota loss when some instances were already redeemed (idempotency dedup).
    if (redeemedCount === 0) {
      // Nothing newly inserted — all instances were already redeemed; no deduction needed
      return { redeemedCount: 0, quota: guardRow };
    }

    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: sql<number>`${quotas.remaining} - ${redeemedCount}`,
        usedThisPeriod: sql<number>`${quotas.usedThisPeriod} + ${redeemedCount}`,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gte(quotas.remaining, redeemedCount),
          isNull(quotas.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      // Concurrent transaction depleted remaining between guard SELECT and this UPDATE.
      // Throwing forces tx rollback, discarding the already-inserted ledger rows and
      // preventing ledger/aggregate drift.
      throw new Error("Quota redemption failed: insufficient remaining after concurrent deduction");
    }

    return { redeemedCount, quota: updated };
  };

  export const releaseForInstanceBatch = async (
    tx: DBTransaction,
    input: {
      quotaId: string;
      studentId: string;
      recurringScheduleId?: string | null;
      instanceIds: string[];
      actorUserId?: string | null;
    }
  ): Promise<{ releasedCount: number; quota: QuotaSelectType | null }> => {
    if (input.instanceIds.length === 0) {
      return { releasedCount: 0, quota: null };
    }

    const now = new Date();

    // Build one ledger row per instance using the same idempotency-key derivation as releaseForInstance
    const ledgerRows = input.instanceIds.map(instId => ({
      quotaId: input.quotaId,
      studentId: input.studentId,
      recurringScheduleId: input.recurringScheduleId ?? null,
      classInstanceId: instId,
      delta: 1,
      reason: QuotaLedgerReason.RELEASE,
      reasonNote: `Released 1 class for instance ${instId}`,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: deriveReleasePoolIdempotencyKey(instId, input.quotaId),
    }));

    const inserted = await QuotaLedgerRepository.insertBatch(tx, ledgerRows);
    const releasedCount = inserted.length;

    // Credit ONLY by the actual number of newly inserted ledger rows, not the full count.
    // This prevents over-crediting when some instances were already released (idempotency dedup).
    if (releasedCount === 0) {
      // Nothing newly inserted — all instances were already released; no credit needed
      const [existing] = await tx
        .select()
        .from(quotas)
        .where(and(eq(quotas.id, input.quotaId), eq(quotas.studentId, input.studentId), isNull(quotas.deletedAt)))
        .limit(1);
      return { releasedCount: 0, quota: existing ?? null };
    }

    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: sql<number>`${quotas.remaining} + ${releasedCount}`,
        usedThisPeriod: sql<number>`GREATEST(${quotas.usedThisPeriod} - ${releasedCount}, 0)`,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          isNull(quotas.deletedAt)
        )
      )
      .returning();

    if (!updated) {
      // Concurrent transaction archived/deleted the quota between ledger insert and this UPDATE.
      // Throwing forces tx rollback, discarding the already-inserted ledger rows and
      // preventing ledger/aggregate drift.
      throw new Error("Quota release failed: quota no longer active after concurrent modification");
    }

    return { releasedCount, quota: updated };
  };

  export const expireOverdue = async (tx: DBTransaction, asOfDate?: Date): Promise<QuotaSelectType[]> => {
    const checkDateStr = (asOfDate ?? new Date()).toISOString().slice(0, 10);
    const now = new Date();

    // SELECT ... FOR UPDATE to lock rows and capture pre-expiry remaining/reserved.
    // We cannot use UPDATE ... RETURNING because the SET clause zeros remaining,
    // so RETURNING would yield post-update (zeroed) values, not the true balances
    // needed for accurate EXPIRE ledger entries.
    const expiredQuotas = await tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.status, QuotaStatus.ACTIVE), lt(quotas.validUntil, checkDateStr), isNull(quotas.deletedAt)))
      .for("update");

    if (expiredQuotas.length === 0) return [];

    const expiredIds = expiredQuotas.map(q => q.id);

    // Zero out remaining + reserved, set status EXPIRED.
    await tx
      .update(quotas)
      .set({
        status: QuotaStatus.EXPIRED,
        remaining: 0,
        reservedClasses: 0,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: now,
      })
      .where(and(inArray(quotas.id, expiredIds), eq(quotas.status, QuotaStatus.ACTIVE)));

    // Insert EXPIRE ledger entries using the pre-expiry snapshot values.
    for (const qRow of expiredQuotas) {
      if (qRow.remaining > 0) {
        const key = deriveExpireIdempotencyKey(qRow.id, checkDateStr);
        await QuotaLedgerRepository.insert(tx, {
          quotaId: qRow.id,
          studentId: qRow.studentId,
          delta: -qRow.remaining,
          reason: QuotaLedgerReason.EXPIRE,
          reasonNote: `Expired ${qRow.remaining} unredeemed classes`,
          idempotencyKey: key,
        });
      }
    }

    // Re-select to return the updated rows.
    return tx
      .select()
      .from(quotas)
      .where(and(inArray(quotas.id, expiredIds), eq(quotas.status, QuotaStatus.EXPIRED)));
  };

  /**
   * Lists ACTIVE, non-deleted PERIODIC quotas that have a rolloverPolicy and have passed
   * their current period end — ready for sweeper to perform rollover.
   */
  export const listPeriodicForRollover = async (tx: DBTransaction): Promise<QuotaSelectType[]> => {
    const now = new Date();
    const nowTs = now.toISOString();
    // Period end = periodAnchor + periodDays. We want quotas where "now > periodEnd".
    const periodEndExpr = sql<Date>`${quotas.periodAnchor} + make_interval(days => ${quotas.periodDays})`;
    return tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.kind, "PERIODIC"),
          eq(quotas.status, QuotaStatus.ACTIVE),
          isNull(quotas.deletedAt),
          sql`${quotas.rolloverPolicy} IS NOT NULL`,
          sql`${periodEndExpr} < ${nowTs}`
        )
      );
  };

  /**
   * Reset the usedThisPeriod counter for a quota (called at the start of a new rollover period).
   */
  export const resetUsedThisPeriod = async (tx: DBTransaction, quotaId: string): Promise<void> => {
    await tx.update(quotas).set({ usedThisPeriod: 0, updatedAt: new Date() }).where(eq(quotas.id, quotaId));
  };

  /**
   * Refresh a single PERIODIC quota for its next period.
   *
   * The `rolloverPolicy` column on `quotas` is a JSONB object of shape
   * `{ maxRolloverPercent: number | null; accumulationCap: number | null }`
   * (enforced by `quotas_rollover_policy_valid_chk`). When present, the rollover
   * amount is computed as:
   *
   *   rollover = min(floor(remaining * maxRolloverPercent / 100), accumulationCap)
   *
   * The portion of `remaining` not rolled over is expired (EXPIRE ledger entry),
   * and the full `totalClasses` is replenished for the new period (GRANT ledger
   * entry). `remaining` is updated atomically to `rollover + totalClasses`,
   * `usedThisPeriod` reset to 0, and `periodAnchor` advanced past `now`.
   *
   * For backward compatibility with legacy quotas whose `rolloverPolicy` is a
   * plain `"GRANT" | "EXPIRE"` string, that policy is honored too:
   *   - "GRANT":  all unused preserved, full replenish
   *   - "EXPIRE": all unused expired, full replenish
   *
   * Idempotent: EXPIRE/GRANT keys are scoped to the ending period, and the
   * method no-ops (returns the unchanged row) when the period has not ended.
   * Optimistic concurrency: the `UPDATE` carries `version = ?` to detect
   * concurrent refreshes.
   */
  export const refreshPeriodic = async (
    tx: DBTransaction,
    quotaId: string,
    actorUserId?: string | null
  ): Promise<QuotaSelectType> => {
    const target = await findById(tx, quotaId);
    if (!target) throw new Error("Quota not found");
    if (target.kind !== "PERIODIC") throw new Error("Cannot refresh non-periodic quota");
    if (!target.periodDays || target.periodDays <= 0) throw new Error("Quota has no valid period days configured");

    const now = new Date();
    const periodAnchor = target.periodAnchor ?? target.createdAt;
    const periodEnd = new Date(periodAnchor.getTime() + target.periodDays * 24 * 60 * 60 * 1000);

    // Only refresh if the current period has expired
    if (now <= periodEnd) return target;

    const periodStr = periodEnd.toISOString().slice(0, 10);
    const unused = target.remaining > 0 ? target.remaining : 0;

    // Determine how many of the unused classes carry over into the new period.
    let rolloverAmount: number;
    if (isRichRolloverPolicy(target.rolloverPolicy)) {
      const percent = target.rolloverPolicy.maxRolloverPercent ?? 100;
      const raw = Math.floor(unused * (percent / 100));
      const cap = target.rolloverPolicy.accumulationCap ?? null;
      rolloverAmount = cap !== null ? Math.min(raw, cap) : raw;
    } else {
      // Legacy string policy: "GRANT" preserves all unused, "EXPIRE" discards all.
      const policyStr = (target.rolloverPolicy as string | null) ?? "GRANT";
      rolloverAmount = policyStr === "GRANT" ? unused : 0;
    }

    const newRemaining = rolloverAmount + target.totalClasses;
    const expiredAmount = unused - rolloverAmount;

    // Advance the period anchor to the first future period boundary
    let newAnchor = periodEnd;
    while (newAnchor <= now) {
      newAnchor = new Date(newAnchor.getTime() + target.periodDays * 24 * 60 * 60 * 1000);
    }

    // EXPIRE the unused classes that did not roll over from the just-ended period
    if (expiredAmount > 0) {
      const expireKey = deriveExpireIdempotencyKey(quotaId, periodStr);
      await QuotaLedgerRepository.insert(tx, {
        quotaId,
        studentId: target.studentId,
        delta: -expiredAmount,
        reason: QuotaLedgerReason.EXPIRE,
        reasonNote: `Periodic refresh: expired ${expiredAmount} unused classes (period ending ${periodStr})`,
        actorUserId: actorUserId ?? null,
        idempotencyKey: expireKey,
      });
    }

    // GRANT the full replenishment for the new period (per-period idempotency key
    // so grants from different periods never collide).
    const grantKey = derivePeriodicGrantIdempotencyKey(quotaId, periodStr);
    await QuotaLedgerRepository.insert(tx, {
      quotaId,
      studentId: target.studentId,
      delta: target.totalClasses,
      reason: QuotaLedgerReason.GRANT,
      reasonNote: `Periodic refresh: granted ${target.totalClasses} classes for new period`,
      actorUserId: actorUserId ?? null,
      idempotencyKey: grantKey,
    });

    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: newRemaining,
        usedThisPeriod: 0,
        periodAnchor: newAnchor,
        version: target.version + 1,
        updatedAt: now,
      })
      .where(and(eq(quotas.id, quotaId), eq(quotas.version, target.version)))
      .returning();

    if (!updated) throw new Error("Failed to refresh periodic quota due to concurrent write");

    return updated;
  };

  /**
   * Deducts from the highest-priority active quota(s) up to the given count.
   * Used during on-demand instance refresh to prevent double-counting credits.
   * Deducts atomically (remaining >= 1 check in WHERE) across quotas ordered by priority.
   */
  export const deductPendingRefresh = async (
    tx: DBTransaction,
    input: {
      studentId: string;
      count: number;
      actorUserId?: string | null;
    }
  ): Promise<number> => {
    const activeQuotas = await tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt)
        )
      )
      .orderBy(desc(quotas.priority))
      .limit(input.count);

    let remainingToDeduct = input.count;
    let deducted = 0;

    for (const quota of activeQuotas) {
      if (remainingToDeduct <= 0) break;
      const toTake = Math.min(remainingToDeduct, quota.remaining);
      const now = new Date();

      const [updated] = await tx
        .update(quotas)
        .set({
          remaining: sql<number>`${quotas.remaining} - ${toTake}`,
          usedThisPeriod: sql<number>`${quotas.usedThisPeriod} + ${toTake}`,
          version: sql<number>`${quotas.version} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(quotas.id, quota.id),
            eq(quotas.status, QuotaStatus.ACTIVE),
            gte(quotas.remaining, toTake),
            isNull(quotas.deletedAt)
          )
        )
        .returning();

      if (updated) {
        await QuotaLedgerRepository.insert(tx, {
          quotaId: quota.id,
          studentId: input.studentId,
          delta: -toTake,
          reason: QuotaLedgerReason.ADJUST,
          reasonNote: `Deducted ${toTake} for on-demand refresh`,
          actorUserId: input.actorUserId ?? null,
          idempotencyKey: createHash("sha256")
            .update(`quota-refresh-deduct:${quota.id}:${now.toISOString()}:${toTake}`)
            .digest("hex"),
        });

        deducted += toTake;
        remainingToDeduct -= toTake;
      }
    }

    return deducted;
  };
}
