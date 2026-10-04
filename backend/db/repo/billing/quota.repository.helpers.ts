import { createHash } from "node:crypto";
import { and, count, desc, eq, gte, inArray, isNull, type SQL, sql } from "drizzle-orm";

import { type db, queryDb, queryWithPagination } from "@/backend/db";
import { classInstances, quotaLedger, quotas } from "@/backend/db/schema";
import { QuotaLedgerReason, QuotaStatus } from "@/backend/enum";
import { QuotaNotFoundError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import type { DBTransaction, PaginationArgs, QuotaPaginatedFilter, QuotaSelectType } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export type ReadExecutor = DBTransaction | typeof db;

/**
 * Shared idempotency-key derivation helper.
 * Builds a SHA-256 hash from `"quota-{prefix}:{...parts}"`.
 * All quota-operation idempotency keys go through this single function
 * to avoid copy-paste drift (DUP-5).
 */
export const deriveIdempotencyKey = (prefix: string, ...parts: (string | undefined | null)[]): string => {
  const payload = `quota-${prefix}:${parts.map(p => p ?? "").join(":")}`;
  return createHash("sha256").update(payload).digest("hex");
};

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
export const MAX_EXPIRING_QUOTAS_PER_RUN = 500;

/**
 * Re-fetches the live (non-deleted) quota row for a student. Used by the
 * ledger-first duplicate-skip branches inside reserve/release/redeem methods
 * to return the current row on a duplicate idempotency hit.
 */
export const fetchLiveQuota = (
  tx: DBTransaction,
  quotaId: string,
  studentId: string
): Promise<QuotaSelectType | null> =>
  tx
    .select()
    .from(quotas)
    .where(and(eq(quotas.id, quotaId), eq(quotas.studentId, studentId), isNull(quotas.deletedAt)))
    .limit(1)
    .then(([row]) => row ?? null);

/** Handles a duplicate idempotency-key hit by logging, returning the current quota row, or throwing. */
export const handleDuplicateIdempotencyKey = async (
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

/**
 * Returns the subset of `instanceIds` that do NOT yet have a REDEEM ledger entry
 * for the given quota (RB2-5 dedup): prevents already-redeemed instances from
 * being counted against the remaining quota in batch redeem.
 */
export const findUnredeemedInstanceIds = async (
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
export const markInstancesQuotaDeducted = (tx: DBTransaction, instanceIds: string[], now: Date): Promise<unknown> =>
  tx.update(classInstances).set({ quotaDeducted: true, updatedAt: now }).where(inArray(classInstances.id, instanceIds));

/**
 * Guards a batch redeem: returns the active quota row only when it has at least
 * `newCount` remaining classes; otherwise returns null (caller skips redemption).
 */
export const fetchRedemptionGuardRow = (
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
export const buildRedeemBatchLedgerRows = (
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
export const buildLedgerValues = (
  input: LedgerRowInput,
  delta: number,
  reason: QuotaLedgerReason,
  reasonNote: string
) => {
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

/**
 * Builds the shared WHERE conditions for paginated quota list reads,
 * honoring the optional filter (studentId, status, kind, search).
 */
export const buildQuotaFilterConditions = (filter?: QuotaPaginatedFilter | null) => {
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
    const searchPattern = `%${escapeLikeWildcards(filter.search)}%`;
    conditions.push(sql`${quotas.name} ILIKE ${searchPattern}`);
  }

  return conditions;
};

/**
 * Runs the paginated quota list query for the given WHERE conditions and
 * returns the matching rows plus the total count.
 *
 * `totalCount` is computed via a **separate COUNT query** (`SELECT count(*)
 * FROM quotas WHERE …`) that runs in parallel with the paginated data query
 * via `Promise.all`. The COUNT is always the full matching set regardless
 * of page offset/limit, so the caller gets an accurate total for pagination UI.
 *
 * **Pagination limitation**: The `queryWithPagination` helper applies
 * offset/limit to the data query only. The COUNT query is unbounded — it
 * scans all matching rows on every request. For very large datasets this
 * adds a second full-scan per page load. Approximate counts or cached
 * totals could mitigate this but are not currently implemented.
 *
 * **Pagination accuracy**: When `pagination` is `null`, all matching rows
 * are returned (no LIMIT/OFFSET) with the full count.
 */
export const runPaginatedQuotaList = async (
  tx: ReadExecutor | undefined,
  conditions: SQL[],
  pagination?: PaginationArgs | null
): Promise<{ rows: QuotaSelectType[]; totalCount: number }> => {
  const q = queryDb(tx);
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
