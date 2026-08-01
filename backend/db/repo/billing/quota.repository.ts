import { createHash } from "node:crypto";
import { and, count, desc, eq, gt, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import type { db } from "@/backend/db/drizzleDb";
import { queryWithPagination } from "@/backend/db/query.extensions";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { classInstances, quotaLedger, quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  QuotaPaginatedFilter,
  QuotaSelectType,
  QuotaSubmitInput,
  QuotaUpdateType,
} from "@/backend/types/billing/quota.types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";

type ReadExecutor = DBTransaction | typeof db;

/**
 * Shared idempotency-key derivation helper.
 * Builds a SHA-256 hash from `"quota-{prefix}:{...parts}"`.
 * All quota-operation idempotency keys go through this single function
 * to avoid copy-paste drift (DUP-5).
 */
const deriveIdempotencyKey = (prefix: string, ...parts: string[]): string => {
  const payload = `quota-${prefix}:${parts.join(":")}`;
  return createHash("sha256").update(payload).digest("hex");
};

export namespace QuotaRepository {
  export const deriveGrantIdempotencyKey = (quotaId: string): string => deriveIdempotencyKey("grant", quotaId);

  export const deriveRedeemIdempotencyKey = (classInstanceId: string, quotaId: string): string =>
    deriveIdempotencyKey("redeem", classInstanceId, quotaId);

  export const deriveReserveIdempotencyKey = (recurringScheduleId: string, quotaId: string): string =>
    deriveIdempotencyKey("reserve", recurringScheduleId, quotaId);

  export const deriveReleasePoolIdempotencyKey = (classInstanceId: string, quotaId: string): string =>
    deriveIdempotencyKey("release", classInstanceId, quotaId);

  export const deriveReleaseEarmarkIdempotencyKey = (
    recurringScheduleId: string,
    classInstanceId: string,
    quotaId: string
  ): string => deriveIdempotencyKey("release", recurringScheduleId, classInstanceId, quotaId);

  export const deriveExpireIdempotencyKey = (quotaId: string, periodStr: string): string =>
    deriveIdempotencyKey("expire", quotaId, periodStr);

  /**
   * Idempotency key for a per-period GRANT issued by `refreshPeriodic`.
   * Distinct from {@link deriveGrantIdempotencyKey} (the one-time creation grant)
   * so that rollover grants for different periods never collide.
   */
  export const derivePeriodicGrantIdempotencyKey = (quotaId: string, periodStr: string): string =>
    deriveIdempotencyKey("grant:periodic", quotaId, periodStr);

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
          deriveIdempotencyKey("create", input.studentId, input.kind, input.name, String(input.totalClasses)),
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
      .orderBy(desc(quotas.priority), quotas.validUntil, quotas.createdAt)
      .limit(100); // Capped at 100 to prevent unbounded results
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
    input: QuotaUpdateType & { actorUserId?: string | null }
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

  // NOTE(DUP-1): reserveClasses, releaseForRecurringSchedule, redeemForInstance, and
  // releaseForInstance share the same UPDATE-version-bump + WHERE-guard + ledger-insert
  // structure (~10 occurrences below). A shared `applyQuotaMutation` helper accepting
  // the SET-clause, WHERE-guard, and ledger-row factory could consolidate the pattern.
  // Not refactored here because each method's WHERE-guard and SET-clause differ subtly
  // (remaining vs reservedClasses vs usedThisPeriod) and a refactor risks behavior change.
  // Atomic conditional UPDATE — surfaces as 500 under contention but prevents oversell
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

  // Atomic conditional UPDATE — surfaces as 500 under contention but prevents oversell
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
    // Lock the quota row for the duration of this transaction to prevent TOCTOU
    // races between the balance check and the deduction UPDATE below.
    const [locked] = await tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gt(quotas.remaining, 0),
          isNull(quotas.deletedAt)
        )
      )
      .for("update")
      .limit(1);

    if (!locked) throw new Error("Failed to redeem quota class: quota may be depleted or inactive");

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

    const now = new Date();

    // Determine which instances are not yet redeemed by checking existing ledger entries
    // with the same per-instance idempotency keys. This prevents the guard from counting
    // already-redeemed instances against the remaining quota (RB2-5).
    const expectedKeys = input.instanceIds.map(instId => deriveRedeemIdempotencyKey(instId, input.quotaId));
    const alreadyRedeemed = await tx
      .select({ idempotencyKey: quotaLedger.idempotencyKey })
      .from(quotaLedger)
      .where(inArray(quotaLedger.idempotencyKey, expectedKeys));
    const redeemedKeySet = new Set(alreadyRedeemed.map(r => r.idempotencyKey));
    const newInstanceIds = input.instanceIds.filter(
      instId => !redeemedKeySet.has(deriveRedeemIdempotencyKey(instId, input.quotaId))
    );

    if (newInstanceIds.length === 0) {
      // All instances were already redeemed; no deduction needed
      const [existingQuota] = await tx
        .select()
        .from(quotas)
        .where(and(eq(quotas.id, input.quotaId), eq(quotas.studentId, input.studentId)))
        .limit(1);
      return { redeemedCount: 0, quota: existingQuota ?? null };
    }

    const newCount = newInstanceIds.length;

    // Guard: ensure quota is active and has enough remaining for the not-yet-redeemed instances.
    const [guardRow] = await tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.id, input.quotaId),
          eq(quotas.studentId, input.studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gte(quotas.remaining, newCount),
          isNull(quotas.deletedAt)
        )
      )
      .limit(1);

    if (!guardRow) {
      return { redeemedCount: 0, quota: null };
    }

    // Build one ledger row per NEW instance using the same idempotency-key derivation as redeemForInstance
    const ledgerRows = newInstanceIds.map(instId => ({
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

    // Mark the redeemed instances as quota-deducted. This is the root-cause fix for CR-2/CR-4:
    // without it, clearWeeklySchedule (recurring.ts) skips pool-mode instances when deciding
    // which to refund (because it filters by instance.quotaDeducted), leaking quota; and
    // refreshPeriodic resets reservedClasses based on these flags, so missing flags cause
    // reservedClasses to never be decremented, triggering a CHECK-constraint violation
    // (reservedClasses + remaining > totalClasses).
    if (redeemedCount > 0) {
      const insertedInstanceIds = inserted.map(row => row.classInstanceId).filter((id): id is string => id !== null);
      if (insertedInstanceIds.length > 0) {
        await tx
          .update(classInstances)
          .set({ quotaDeducted: true, updatedAt: now })
          .where(inArray(classInstances.id, insertedInstanceIds));
      }
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

    // Note: First cron run mass-expires all back-dated quotas — ensure scheduled after initial migration deployment
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

    // Collect all ledger entries (EXPIRE + RELEASE-ORPHAN) and insert in a single batch (PERF-4).
    const ledgerRows: {
      quotaId: string;
      studentId: string;
      recurringScheduleId?: string | null;
      classInstanceId?: string | null;
      delta: number;
      reason: QuotaLedgerReason;
      reasonNote?: string | null;
      actorUserId?: string | null;
      idempotencyKey: string;
    }[] = [];

    for (const qRow of expiredQuotas) {
      // BL-5: Before zeroing reservedClasses, release earmarked reservations so the
      // ledger reflects the orphaned reserved classes being returned.
      if (qRow.reservedClasses > 0) {
        logger.info(
          `expireOverdue: quota ${qRow.id} has ${qRow.reservedClasses} reserved classes being released as EXPIRE_ORPHAN`
        );
        ledgerRows.push({
          quotaId: qRow.id,
          studentId: qRow.studentId,
          delta: qRow.reservedClasses,
          reason: QuotaLedgerReason.RELEASE,
          reasonNote: `Expired ${qRow.reservedClasses} orphaned reserved classes`,
          idempotencyKey: deriveIdempotencyKey("expire-orphan", qRow.id, checkDateStr),
        });
      }

      if (qRow.remaining > 0) {
        ledgerRows.push({
          quotaId: qRow.id,
          studentId: qRow.studentId,
          delta: -qRow.remaining,
          reason: QuotaLedgerReason.EXPIRE,
          reasonNote: `Expired ${qRow.remaining} unredeemed classes`,
          idempotencyKey: deriveExpireIdempotencyKey(qRow.id, checkDateStr),
        });
      }
    }

    if (ledgerRows.length > 0) {
      await QuotaLedgerRepository.insertBatch(tx, ledgerRows);
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
      )
      .limit(500); // Capped at 500 per cron tick
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
    // Lock the quota row for the duration of this transaction to prevent TOCTOU races (RB-11).
    const [target] = await tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, quotaId), isNull(quotas.deletedAt)))
      .for("update")
      .limit(1);
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

    // Version-checked UPDATE first. Ledger INSERTs are deferred to AFTER the UPDATE
    // succeeds so that a conflict (concurrent write) rolls back cleanly without
    // orphaning ledger entries (RB-11).
    const [updated] = await tx
      .update(quotas)
      .set({
        remaining: newRemaining,
        reservedClasses: 0,
        usedThisPeriod: 0,
        periodAnchor: newAnchor,
        version: target.version + 1,
        updatedAt: now,
      })
      .where(and(eq(quotas.id, quotaId), eq(quotas.version, target.version)))
      .returning();

    if (!updated) throw new Error("Failed to refresh periodic quota due to concurrent write");

    // After UPDATE succeeds: insert deferred ledger entries.
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
    // Lock quota rows for the duration of this transaction to prevent TOCTOU races (RB-10).
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
      .limit(input.count)
      .for("update");

    let remainingToDeduct = input.count;
    let deducted = 0;

    for (let i = 0; i < activeQuotas.length; i++) {
      const quota = activeQuotas[i];
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
        // Deterministic idempotency key based on quota ID, period, and deduction sequence
        // index so each levy within a call produces a unique key (RBL2-6).
        // Using the quota's current periodAnchor as the period key avoids the non-deterministic
        // now.toISOString(), while the index suffix differentiates per-quota deductions within
        // the same refresh cycle, preventing ON CONFLICT DO NOTHING from swallowing audit rows.
        const periodKey = (quota.periodAnchor ?? quota.createdAt).toISOString().slice(0, 10);
        await QuotaLedgerRepository.insert(tx, {
          quotaId: quota.id,
          studentId: input.studentId,
          delta: -toTake,
          reason: QuotaLedgerReason.ADJUST,
          reasonNote: `Deducted ${toTake} for on-demand refresh`,
          actorUserId: input.actorUserId ?? null,
          idempotencyKey: deriveIdempotencyKey("refresh-deduct", quota.id, periodKey, String(i)),
        });

        deducted += toTake;
        remainingToDeduct -= toTake;
      }
    }

    return deducted;
  };
}
