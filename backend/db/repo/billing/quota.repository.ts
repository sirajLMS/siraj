import { createHash } from "node:crypto";
import { and, count, desc, eq, gt, gte, inArray, isNull, lt, or, sql } from "drizzle-orm";

import { type db, queryDb, queryWithPagination } from "@/backend/db";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { classInstances, quotaLedger, quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import {
  ConflictError,
  DomainError,
  QuotaAlreadyDeletedError,
  QuotaLedgerError,
  QuotaNotFoundError,
  ValidationError,
} from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { mapQuotaToReturnType } from "@/backend/lib/quota-mapping";
import type {
  DBTransaction,
  PaginationArgs,
  QuotaPaginatedFilter,
  QuotaReturnType,
  QuotaSelectType,
  QuotaSubmitInput,
  QuotaUpdateInput,
} from "@/backend/types";

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

  /** Maximum number of overdue quotas to expire per cron tick (unbounded SELECT guard). */
  const MAX_EXPIRING_QUOTAS_PER_RUN = 500;

  /**
   * Type guard for the rich JSONB rollover policy shape enforced by
   * `quotas_rollover_policy_valid_chk` (`maxRolloverPercent` + `accumulationCap`).
   * Returns `false` for legacy plain-string policies (`"GRANT" | "EXPIRE"`).
   */
  const isRichRolloverPolicy = (
    policy: unknown
  ): policy is { maxRolloverPercent: number | null; accumulationCap: number | null } => {
    if (typeof policy === "object" && policy !== null) {
      return "maxRolloverPercent" in policy && "accumulationCap" in policy;
    }
    return false;
  };

  /**
   * Re-fetches the live (non-deleted) quota row for a student. Used by the
   * ledger-first duplicate-skip branches inside reserve/release/redeem methods
   * to return the current row on a duplicate idempotency hit.
   */
  const fetchLiveQuota = (tx: DBTransaction, quotaId: string, studentId: string): Promise<QuotaSelectType | null> =>
    tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, quotaId), eq(quotas.studentId, studentId), isNull(quotas.deletedAt)))
      .limit(1)
      .then(([row]) => row ?? null);

  /** Handles a duplicate idempotency-key hit by logging, returning the current quota row, or throwing. */
  const handleDuplicateIdempotencyKey = async (
    tx: DBTransaction,
    operationName: string,
    input: { quotaId: string; studentId: string }
  ): Promise<QuotaSelectType> => {
    logger.info(
      `${operationName}: duplicate idempotency key, skipping (quota ${input.quotaId}, student ${input.studentId})`
    );
    const existing = await fetchLiveQuota(tx, input.quotaId, input.studentId);
    if (!existing) throw new QuotaNotFoundError("Quota not found");
    return existing;
  };

  /** Computes the period-end date from an anchor + periodDays. */
  const computePeriodEnd = (anchor: Date, periodDays: number): Date =>
    new Date(anchor.getTime() + periodDays * 24 * 60 * 60 * 1000);
  /**
   * Computes how many of `unused` classes carry over to the new period, honoring
   * both the rich JSONB rollover policy (`maxRolloverPercent` + `accumulationCap`)
   * and the legacy plain-string `"GRANT" | "EXPIRE"` policy.
   */
  const computeRolloverAmount = (rolloverPolicy: QuotaSelectType["rolloverPolicy"], unused: number): number => {
    if (isRichRolloverPolicy(rolloverPolicy)) {
      const percent = rolloverPolicy.maxRolloverPercent ?? 100;
      const raw = Math.floor(unused * (percent / 100));
      const cap = rolloverPolicy.accumulationCap;
      return Math.min(raw, cap ?? raw);
    }
    if (typeof rolloverPolicy === "string") {
      if (rolloverPolicy === "GRANT") {
        return unused;
      }
      return 0;
    }
    return unused;
  };

  /** Advances an anchor forward in whole `periodDays` increments until it sits after `now`. */
  const advancePeriodAnchor = (anchor: Date, periodDays: number, now: Date): Date => {
    let next = anchor;
    while (next <= now) {
      next = new Date(next.getTime() + periodDays * 24 * 60 * 60 * 1000);
    }
    return next;
  };

  /**
   * Returns the subset of `instanceIds` that do NOT yet have a REDEEM ledger entry
   * for the given quota (RB2-5 dedup): prevents already-redeemed instances from
   * being counted against the remaining quota in batch redeem.
   */
  const findUnredeemedInstanceIds = async (
    tx: DBTransaction,
    instanceIds: string[],
    quotaId: string
  ): Promise<string[]> => {
    const expectedKeys = instanceIds.map(instId => deriveRedeemIdempotencyKey(instId, quotaId));
    const alreadyRedeemed = await tx
      .select({ idempotencyKey: quotaLedger.idempotencyKey })
      .from(quotaLedger)
      .where(inArray(quotaLedger.idempotencyKey, expectedKeys));
    const redeemedKeySet = new Set(alreadyRedeemed.map(r => r.idempotencyKey));
    return instanceIds.filter(instId => !redeemedKeySet.has(deriveRedeemIdempotencyKey(instId, quotaId)));
  };

  /** Marks the given class instances as quota-deducted (CR-2/CR-4 fix). */
  const markInstancesQuotaDeducted = (tx: DBTransaction, instanceIds: string[], now: Date): Promise<unknown> =>
    tx
      .update(classInstances)
      .set({ quotaDeducted: true, updatedAt: now })
      .where(inArray(classInstances.id, instanceIds));

  /**
   * Guards a batch redeem: returns the active quota row only when it has at least
   * `newCount` remaining classes; otherwise returns null (caller skips redemption).
   */
  const fetchRedemptionGuardRow = (
    tx: DBTransaction,
    quotaId: string,
    studentId: string,
    newCount: number
  ): Promise<QuotaSelectType | null> =>
    tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.id, quotaId),
          eq(quotas.studentId, studentId),
          eq(quotas.status, QuotaStatus.ACTIVE),
          gte(quotas.remaining, newCount),
          isNull(quotas.deletedAt)
        )
      )
      .limit(1)
      .then(([row]) => row ?? null);

  /** Builds one REDEEM ledger row per instance id for batch insertion. */
  const buildRedeemBatchLedgerRows = (
    input: { quotaId: string; studentId: string; recurringScheduleId?: string | null; actorUserId?: string | null },
    instanceIds: string[]
  ) =>
    instanceIds.map(instId => ({
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

  /** Common ledger-row inputs shared by all single-operation quota mutations. */
  type LedgerRowInput = {
    quotaId: string;
    studentId: string;
    recurringScheduleId?: string | null;
    classInstanceId?: string | null;
    actorUserId?: string | null;
    idempotencyKey: string;
  };

  /**
   * Builds a single `quota_ledger` insert-values object for the four single-operation
   * quota mutations (reserve / release-recurring / redeem / release-instance), which
   * all share the same ledger-first structure. Consolidates the per-method ledger-row
   * builders that CodeScene flagged as duplicates (DUP-1 partial).
   */
  const buildLedgerValues = (input: LedgerRowInput, delta: number, reason: QuotaLedgerReason, reasonNote: string) => {
    const now = new Date();
    return {
      quotaId: input.quotaId,
      studentId: input.studentId,
      recurringScheduleId: input.recurringScheduleId ?? null,
      classInstanceId: input.classInstanceId ?? null,
      delta,
      reason,
      reasonNote,
      actorUserId: input.actorUserId ?? null,
      idempotencyKey: input.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    };
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

    const idempotencyKey =
      input.idempotencyKey ??
      deriveIdempotencyKey("create", input.studentId, input.kind, input.name, String(input.totalClasses));

    // Idempotent insert: ON CONFLICT (idempotency_key) DO NOTHING. If a row with
    // this key already exists (a duplicate creation attempt / retry), the insert
    // returns no rows and we fetch the existing record instead of throwing a
    // unique-constraint violation. This makes createQuota safely retriable and
    // deduplicates concurrent duplicate submission attempts (mirrors the
    // ledger repository's idempotency pattern).
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
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing({ target: quotas.idempotencyKey })
      .returning();

    if (newQuota) {
      const grantKey = deriveGrantIdempotencyKey(newQuota.id);
      // AUDIT: ledger entry required for initial GRANT tracking and balance reconstruction.
      // The grant insert is itself idempotent (ON CONFLICT DO NOTHING on its own key),
      // so a conflict here would simply return the existing ledger row.
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
    }

    // Conflict — a quota with this idempotency key already exists; fetch and return it.
    const [existing] = await tx.select().from(quotas).where(eq(quotas.idempotencyKey, idempotencyKey)).limit(1);

    if (!existing) throw new QuotaLedgerError("Quota insert returned no rows and no existing row found");
    return existing;
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

  /**
   * Returns a paginated list of non-deleted quotas with optional filtering
   * and the total count of matching rows.
   *
   * `totalCount` is computed via a **separate COUNT query** (`SELECT count(*)
   * FROM quotas WHERE …`) that runs in parallel with the paginated data query
   * via `Promise.all`. The two queries share the same `WHERE` clause but are
   * independent — the COUNT is always the full matching set regardless of
   * page offset/limit, so the caller gets an accurate total for pagination UI.
   *
   * **Pagination limitation**: The `queryWithPagination` helper applies
   * offset/limit to the data query only. The COUNT query is unbounded — it
   * scans all matching rows on every request. For very large datasets this
   * adds a second full-scan per page load. Approximate counts or cached
   * totals could mitigate this but are not currently implemented.
   *
   * **Pagination accuracy**: When `pagination` is `null`, this method
   * returns all matching rows (no LIMIT/OFFSET) with the full count.
   * The caller (`QuotaService.listQuotas`) uses this for the multi-student
   * IDOR-scoped branch to fetch all rows, filter in-memory by associated
   * student IDs, then slice for the requested page — ensuring correct
   * pagination and totalCount on the scoped set.
   */
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
      totalCount: countRow[0]?.value ?? 0,
    };
  };

  export const update = async (
    tx: DBTransaction,
    id: string,
    input: QuotaUpdateInput & { actorUserId?: string | null }
  ): Promise<QuotaSelectType> => {
    const now = new Date();
    const existing = await findById(tx, id);
    if (!existing) throw new QuotaNotFoundError("Quota not found");
    if (existing.version !== input.version) {
      throw new DomainError("CONCURRENCY_CONFLICT", "Quota version mismatch — please retry");
    }

    const updateData: Partial<QuotaSelectType> = {
      version: existing.version + 1,
      updatedAt: now,
    };

    if (input.name !== undefined && input.name != null) updateData.name = input.name;
    if (input.priority !== undefined && input.priority != null) updateData.priority = input.priority;
    if (input.status !== undefined && input.status != null) updateData.status = input.status;
    if (input.validUntil !== undefined) {
      updateData.validUntil = input.validUntil ? new Date(input.validUntil).toISOString().slice(0, 10) : null;
    }

    const [updated] = await tx
      .update(quotas)
      .set(updateData)
      .where(and(eq(quotas.id, id), eq(quotas.version, input.version)))
      .returning();

    if (!updated) throw new QuotaNotFoundError("Quota update failed due to concurrent modification");
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

    if (!row) throw new QuotaAlreadyDeletedError("Quota not found or already deleted");
    return row;
  };

  /**
   * Internal-only: selects the best quota to book against using FIFO ordering.
   *
   * **Do NOT call directly from services or GraphQL resolvers.** This method
   * is intended to be used exclusively by {@link QuotaService.selectQuotaForBooking}
   * which performs permission gating and orchestration around it.
   *
   * Uses `FOR UPDATE` row locking (`SELECT ... FOR UPDATE`) to prevent
   * concurrent reads from selecting the same quota, avoiding oversell under
   * contention.
   *
   * FIFO selection ordering:
   * 1. `priority` DESC — higher-priority quotas are consumed first.
   * 2. `validUntil` ASC — quotas expiring sooner are consumed first.
   * 3. `createdAt` ASC — older quotas are consumed first as a tiebreaker.
   *
   * Only filters ACTIVE quotas with `remaining > 0`, no soft-delete, and
   * either no expiry (`validUntil IS NULL`) or not yet expired.
   *
   * **Must be called within a transaction** (`tx`) — the `FOR UPDATE` lock
   * is only meaningful inside a transaction and the returned quota row is
   * expected to be mutated (redeem/reserve) within the same transaction.
   */
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
      .for("update")
      .limit(1);

    return quotaRow ?? null;
  };

  // NOTE(DUP-1): reserveClasses, releaseForRecurringSchedule, redeemForInstance, and
  // releaseForInstance share the same ledger-first + UPDATE-version-bump + WHERE-guard
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
    // Ledger-first pattern: Insert the ledger row BEFORE updating the balance.
    // If the idempotency key already exists (duplicate on retry), the insert affects 0 rows
    // and we return early — the operation was already applied, preventing double deduction.
    // AUDIT: ledger entry required for RESERVE tracking and balance reconstruction
    const ledgerResult = await tx
      .insert(quotaLedger)
      .values(
        buildLedgerValues(
          { ...input, classInstanceId: null },
          -input.count,
          QuotaLedgerReason.RESERVE,
          `Reserved ${input.count} classes for recurring schedule`
        )
      )
      .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

    if (ledgerResult.rowCount === 0) {
      // Duplicate idempotency key — operation already applied on a previous call
      return handleDuplicateIdempotencyKey(tx, "reserveClasses", input);
    }

    // Only update balance after successful ledger insert
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

    if (!updated) throw new QuotaLedgerError("Failed to update quota reservations");

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
    // Ledger-first pattern: Insert the ledger row BEFORE updating the balance.
    // If the idempotency key already exists (duplicate on retry), the insert affects 0 rows
    // and we return early — the operation was already applied, preventing double credit.
    // AUDIT: ledger entry required for RELEASE tracking and balance reconstruction
    const ledgerResult = await tx
      .insert(quotaLedger)
      .values(
        buildLedgerValues(
          { ...input, classInstanceId: null },
          input.count,
          QuotaLedgerReason.RELEASE,
          `Released ${input.count} reserved classes for recurring schedule`
        )
      )
      .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

    if (ledgerResult.rowCount === 0) {
      // Duplicate idempotency key — operation already applied on a previous call
      return handleDuplicateIdempotencyKey(tx, "releaseForRecurringSchedule", input);
    }

    // Only update balance after successful ledger insert
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

    if (!updated) throw new ConflictError("Failed to release quota reservation: insufficient reserved classes");

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

    if (!locked) throw new QuotaNotFoundError("Failed to redeem quota class: quota may be depleted or inactive");

    // Ledger-first pattern (V3-002): Insert the ledger row BEFORE updating the balance.
    // A duplicate idempotency key (retry) inserts 0 rows → return the locked row, preventing double deduction.
    // AUDIT: ledger entry required for REDEEM tracking and balance reconstruction
    const ledgerResult = await tx
      .insert(quotaLedger)
      .values(
        buildLedgerValues(
          { ...input, recurringScheduleId: input.recurringScheduleId ?? null },
          -1,
          QuotaLedgerReason.REDEEM,
          `Redeemed 1 class for instance ${input.classInstanceId}`
        )
      )
      .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

    if (ledgerResult.rowCount === 0) {
      logger.info(
        `redeemForInstance: duplicate idempotency key, skipping (quota ${input.quotaId}, instance ${input.classInstanceId})`
      );
      return locked;
    }

    // Only update balance after successful ledger insert
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

    if (!updated) throw new QuotaNotFoundError("Failed to redeem quota class: quota may be depleted or inactive");

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
    // V3-043: delta=0 guard — if there are no classes to release, skip both ledger
    // and balance update. The delta for a single-instance release is always 1,
    // but we use Number() so the guard type-checks and is ready for future callers
    // that might pass a dynamic count.
    const releaseCount: number = 1;
    if (releaseCount === 0) {
      logger.info(
        `releaseForInstance: delta=0, skipping ledger insert and balance update (quota ${input.quotaId}, instance ${input.classInstanceId})`
      );
      const existing = await fetchLiveQuota(tx, input.quotaId, input.studentId);
      if (!existing) throw new QuotaNotFoundError("Quota not found");
      return existing;
    }

    // Ledger-first pattern (V3-003): Insert the ledger row BEFORE updating the balance.
    // A duplicate idempotency key (retry) inserts 0 rows → return the existing row, preventing double credit.
    // AUDIT: ledger entry required for RELEASE tracking and balance reconstruction
    const ledgerResult = await tx
      .insert(quotaLedger)
      .values(
        buildLedgerValues(
          { ...input, recurringScheduleId: input.recurringScheduleId ?? null },
          1,
          QuotaLedgerReason.RELEASE,
          `Released 1 class for instance ${input.classInstanceId}`
        )
      )
      .onConflictDoNothing({ target: quotaLedger.idempotencyKey });

    if (ledgerResult.rowCount === 0) {
      logger.info(
        `releaseForInstance: duplicate idempotency key, skipping (quota ${input.quotaId}, instance ${input.classInstanceId})`
      );
      const existing = await fetchLiveQuota(tx, input.quotaId, input.studentId);
      if (!existing) throw new QuotaNotFoundError("Quota not found");
      return existing;
    }

    // Only update balance after successful ledger insert
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

    if (!updated)
      throw new QuotaNotFoundError("Failed to release quota class: quota may be inactive or no classes used");

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
    // with the same per-instance idempotency keys (RB2-5 dedup).
    const newInstanceIds = await findUnredeemedInstanceIds(tx, input.instanceIds, input.quotaId);

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
    const guardRow = await fetchRedemptionGuardRow(tx, input.quotaId, input.studentId, newCount);
    if (!guardRow) {
      return { redeemedCount: 0, quota: null };
    }

    // AUDIT: ledger entries required for REDEEM batch tracking and balance reconstruction
    const ledgerRows = buildRedeemBatchLedgerRows(input, newInstanceIds);
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
      throw new QuotaLedgerError("Quota redemption failed: insufficient remaining after concurrent deduction");
    }

    // Mark the redeemed instances as quota-deducted (CR-2/CR-4 root-cause fix):
    // without it, clearWeeklySchedule (recurring.ts) skips pool-mode instances when
    // refunding, leaking quota; and refreshPeriodic resets reservedClasses from these
    // flags, so missing flags cause a CHECK-constraint violation
    // (reservedClasses + remaining > totalClasses).
    const insertedInstanceIds = inserted.map(row => row.classInstanceId).filter((id): id is string => id !== null);
    if (insertedInstanceIds.length > 0) {
      await markInstancesQuotaDeducted(tx, insertedInstanceIds, now);
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
    // AUDIT: ledger entries required for RELEASE batch tracking and balance reconstruction
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
      throw new ConflictError("Quota release failed: quota no longer active after concurrent modification");
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
    // Defensive LIMIT: caps the number of rows locked per cron tick to avoid
    // unbounded row locking. Remaining overdue quotas are picked up on the next
    // tick (sweeper runs on a recurring schedule).
    const expiredQuotas = await tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.status, QuotaStatus.ACTIVE), lt(quotas.validUntil, checkDateStr), isNull(quotas.deletedAt)))
      .limit(MAX_EXPIRING_QUOTAS_PER_RUN)
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
  export const listPeriodicForRollover = async (tx: DBTransaction): Promise<QuotaReturnType[]> => {
    const now = new Date();
    // Period end = periodAnchor + periodDays. We want quotas where "now > periodEnd".
    const periodEndExpr = sql<Date>`${quotas.periodAnchor} + make_interval(days => ${quotas.periodDays})`;
    const rows = await tx
      .select()
      .from(quotas)
      .where(
        and(
          eq(quotas.kind, "PERIODIC"),
          eq(quotas.status, QuotaStatus.ACTIVE),
          isNull(quotas.deletedAt),
          sql`${quotas.rolloverPolicy} IS NOT NULL`,
          sql`${periodEndExpr} < ${now}`
        )
      )
      .limit(500); // Capped at 500 per cron tick
    return rows.map(mapQuotaToReturnType);
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
  ): Promise<QuotaReturnType> => {
    // Lock the quota row for the duration of this transaction to prevent TOCTOU races (RB-11).
    const [target] = await tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, quotaId), isNull(quotas.deletedAt)))
      .for("update")
      .limit(1);
    if (!target) throw new QuotaNotFoundError("Quota not found");
    if (target.kind !== "PERIODIC") throw new ValidationError("Cannot refresh non-periodic quota");
    if (!target.periodDays || target.periodDays <= 0)
      throw new ValidationError("Quota has no valid period days configured");

    const now = new Date();
    const periodAnchor = target.periodAnchor ?? target.createdAt;
    const periodEnd = computePeriodEnd(periodAnchor, target.periodDays);

    // Only refresh if the current period has expired
    if (now <= periodEnd) return mapQuotaToReturnType(target);

    const periodStr = periodEnd.toISOString().slice(0, 10);
    const unused = Math.max(target.remaining, 0);
    const rolloverAmount = computeRolloverAmount(target.rolloverPolicy, unused);

    const newRemaining = rolloverAmount + target.totalClasses;
    const expiredAmount = unused - rolloverAmount;

    // Advance the period anchor to the first future period boundary
    const newAnchor = advancePeriodAnchor(periodEnd, target.periodDays, now);

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

    if (!updated) throw new ConflictError("Failed to refresh periodic quota due to concurrent write");

    // After UPDATE succeeds: insert deferred ledger entries.
    // EXPIRE the unused classes that did not roll over from the just-ended period
    if (expiredAmount > 0) {
      const expireKey = deriveExpireIdempotencyKey(quotaId, periodStr);
      // AUDIT: ledger entry required for EXPIRE tracking and balance reconstruction
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
    // AUDIT: ledger entry required for GRANT tracking and balance reconstruction
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

    return mapQuotaToReturnType(updated);
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
      .for("update");

    // Pre-compute the per-quota deductions sequentially (no awaits) so the loop
    // can break early once the requested count is fully allocated across quotas
    // ordered by priority. The rows are already locked by `FOR UPDATE`, so the
    // subsequent writes can be dispatched in parallel without TOCTOU races.
    const plannedDeductions: Array<{ quota: (typeof activeQuotas)[number]; toTake: number; index: number }> = [];
    let remainingToDeduct = input.count;
    for (let i = 0; i < activeQuotas.length; i++) {
      const quota = activeQuotas[i];
      if (remainingToDeduct <= 0) break;
      const toTake = Math.min(remainingToDeduct, quota.remaining);
      plannedDeductions.push({ quota, toTake, index: i });
      remainingToDeduct -= toTake;
    }

    const now = new Date();

    const deductions = await Promise.all(
      plannedDeductions.map(async ({ quota, toTake, index }) => {
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

        if (!updated) return 0;

        // Deterministic idempotency key based on quota ID, period, and deduction sequence
        // index so each levy within a call produces a unique key (RBL2-6).
        // Using the quota's current periodAnchor as the period key avoids the non-deterministic
        // now.toISOString(), while the index suffix differentiates per-quota deductions within
        // the same refresh cycle, preventing ON CONFLICT DO NOTHING from swallowing audit rows.
        // AUDIT: ledger entry required for ADJUST deduction tracking and balance reconstruction
        const periodKey = (quota.periodAnchor ?? quota.createdAt).toISOString().slice(0, 10);
        await QuotaLedgerRepository.insert(tx, {
          quotaId: quota.id,
          studentId: input.studentId,
          delta: -toTake,
          reason: QuotaLedgerReason.ADJUST,
          reasonNote: `Deducted ${toTake} for on-demand refresh`,
          actorUserId: input.actorUserId ?? null,
          idempotencyKey: deriveIdempotencyKey("refresh-deduct", quota.id, periodKey, String(index)),
        });

        return toTake;
      })
    );

    return deductions.reduce((total, value) => total + value, 0);
  };

  /** @internal — Used by tests for per-period reset assertions. Production rollover uses refreshPeriodic.
   *
   * Resets `usedThisPeriod` to 0 for a single quota.
   *
   * Uses optimistic concurrency via `version`. Inserts an `ADJUST`
   * ledger entry (delta=0) for audit-trail completeness. Idempotent via
   * a deterministic SHA-256 key scoped to the quota + period string.
   */
  export const resetUsedThisPeriod = async (
    tx: DBTransaction,
    quotaId: string,
    periodStr: string,
    actorUserId?: string | null
  ): Promise<QuotaSelectType> => {
    const [existing] = await tx
      .select()
      .from(quotas)
      .where(and(eq(quotas.id, quotaId), isNull(quotas.deletedAt)))
      .for("update")
      .limit(1);
    if (!existing) throw new QuotaNotFoundError("Quota not found");

    const [updated] = await tx
      .update(quotas)
      .set({
        usedThisPeriod: 0,
        version: sql<number>`${quotas.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(quotas.id, quotaId), eq(quotas.version, existing.version)))
      .returning();

    if (!updated) throw new ConflictError("Failed to reset usedThisPeriod due to concurrent modification");

    // AUDIT: ledger entry required for ADJUST tracking and balance reconstruction
    await QuotaLedgerRepository.insert(tx, {
      quotaId,
      studentId: existing.studentId,
      delta: 0,
      reason: QuotaLedgerReason.ADJUST,
      reasonNote: `Reset usedThisPeriod for period ${periodStr}`,
      actorUserId: actorUserId ?? null,
      idempotencyKey: deriveIdempotencyKey("reset-used", quotaId, periodStr),
    });

    return updated;
  };
}
