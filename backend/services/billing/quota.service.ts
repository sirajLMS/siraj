import type { DBTransaction } from "@/backend/types";
import { db } from "@/backend/db/drizzleDb";
import { StudentRepository } from "@/backend/db/repo/students";
import { CreditRepository } from "@/backend/db/repo/billing/credit.repository";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { AppPermission, OnDemandStatus } from "@/backend/enum";
import { QuotaNotFoundError, UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  assertAssociatedOrManage,
  resolveAssociatedStudentIds,
  resolveAssociatedViewer,
  requirePermission as sharedRequirePermission,
} from "@/backend/services/billing/permission-utils";
import {
  mapQuotaLedgerToReturnType,
  mapQuotaToReturnType,
  type QuotaBalanceReturnType,
  type QuotaExpirationBreakdown,
  type QuotaLedgerPaginatedResult,
  type QuotaPaginatedFilter,
  type QuotaReturnType,
  type QuotaSubmitInput,
  type QuotaUpdateInput,
} from "@/backend/types/billing/quota.types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

type ReadExecutor = DBTransaction | typeof db;

export namespace QuotaService {
  /**
   * V3-011: Thin wrapper around the shared `requirePermission` from
   * `permission-utils.ts`. Resolves `tErrors` from the locale and
   * delegates to the shared helper to avoid duplicating the permission
   * check logic across services.
   */
  async function requirePermission(
    actorUserId: string | null | undefined,
    locale: string,
    permission: AppPermission
  ): Promise<void> {
    if (!actorUserId) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }
    const tErrors = getServerTranslations(locale).errorsTranslations;
    await sharedRequirePermission(actorUserId, permission, tErrors);
  }

  /**
   * Shared transaction executor: runs `runner` against `tx` when provided,
   * otherwise against a fresh `db.transaction`. Eliminates the repeating
   * `return tx ? runner(tx) : db.transaction(runner);` boilerplate across
   * every write method in this service.
   */
  async function runInTx<T>(tx: DBTransaction | undefined, runner: (t: DBTransaction) => Promise<T>): Promise<T> {
    return tx ? runner(tx) : db.transaction(runner);
  }

  /**
   * Shared permission + IDOR-scoping gate for student-scoped list reads.
   * Applies the QUOTAS_VIEW permission check, then verifies the caller is
   * associated with `studentId` (or holds QUOTAS_MANAGE) before delegating
   * to `listFn` and mapping the rows. Used by `listStudentOpenQuotas` and
   * `listStudentQuotas`.
   */
  async function listScopedByStudent<T extends Parameters<typeof mapQuotaToReturnType>[0]>(
    studentId: string,
    tx: ReadExecutor | undefined,
    actorUserId: string | null | undefined,
    locale: string,
    listFn: (tx: ReadExecutor | undefined, studentId: string) => Promise<T[]>
  ): Promise<QuotaReturnType[]> {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
    const uid = actorUserId ?? "";
    await assertAssociatedOrManage(uid, studentId, getServerTranslations(locale).errorsTranslations);
    const rows = await listFn(tx, studentId);
    return rows.map(row => mapQuotaToReturnType(row));
  }

  /**
   * Shared QUOTAS_MANAGE write helper: permission gate + transaction + map.
   * Used by the CRUD write methods (`createQuota`, `updateQuota`,
   * `deleteQuota`) to collapse their identical scaffolding into a single
   * call site.
   */
  async function manageAndMap(
    locale: string,
    actorUserId: string | null | undefined,
    tx: DBTransaction | undefined,
    op: (t: DBTransaction) => Promise<Parameters<typeof mapQuotaToReturnType>[0]>
  ): Promise<QuotaReturnType> {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_MANAGE);
    return runInTx(tx, async t => mapQuotaToReturnType(await op(t)));
  }

  /**
   * Shared transactional idempotent-write helper. Runs an idempotency-keyed
   * ledger mutation (reserve/release/redeem) inside `runInTx` and casts the
   * repository result to `QuotaReturnType`. Collapses the repeated
   * derive-key → repo-op → cast body shared by the recurring-schedule and
   * per-instance reserve/release methods.
   */
  async function txOp(
    tx: DBTransaction | undefined,
    op: (t: DBTransaction) => Promise<QuotaReturnType>
  ): Promise<QuotaReturnType> {
    return runInTx(tx, op);
  }

  export const createQuota = async (
    input: QuotaSubmitInput,
    actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    return manageAndMap(_locale, actorUserId, tx, async t => QuotaRepository.create(t, { ...input, actorUserId }));
  };

  export const getQuota = async (
    id: string,
    locale = "en",
    tx?: ReadExecutor,
    actorUserId?: string | null
  ): Promise<QuotaReturnType> => {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
    const quota = await QuotaRepository.findById(tx, id);
    if (!quota) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new QuotaNotFoundError(tErrors.notFound);
    }

    // V3-013: IDOR scoping — verify the caller is either associated with
    // the quota's student or holds QUOTAS_MANAGE (admin/teacher override).
    const uid = actorUserId ?? "";
    await assertAssociatedOrManage(uid, quota.studentId, getServerTranslations(locale).errorsTranslations);

    return mapQuotaToReturnType(quota);
  };

  /**
   * Fetches the paginated ledger entries for a quota, with IDOR scoping.
   * After the QUOTAS_VIEW permission gate, the calling user must either:
   *  - be associated with the quota's student via {@link resolveAssociatedViewer}
   *    (i.e. the student's parent or primary teacher), OR
   *  - hold `QUOTAS_MANAGE`, which acts as an admin/teacher override.
   * This prevents a user with QUOTAS_VIEW from reading any quota's ledger
   * by id alone, closing the insecure-direct-object-reference gap on the
   * `quotaLedger` GraphQL query.
   */
  export const getQuotaLedger = async (
    quotaId: string,
    pagination: PaginationArgs | null,
    actorUserId: string,
    locale = "en",
    tx?: ReadExecutor
  ): Promise<QuotaLedgerPaginatedResult> => {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);

    const quota = await QuotaRepository.findById(tx, quotaId);
    if (!quota) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new QuotaNotFoundError(tErrors.notFound);
    }

    // V3-013: IDOR scoping — shared helper
    await assertAssociatedOrManage(actorUserId, quota.studentId, getServerTranslations(locale).errorsTranslations);

    const [rawRows, totalCount] = await Promise.all([
      QuotaLedgerRepository.findByQuotaId(tx, quotaId, pagination),
      QuotaLedgerRepository.countByQuotaId(tx, quotaId),
    ]);

    return {
      rows: rawRows.map(mapQuotaLedgerToReturnType),
      totalCount,
    };
  };

  export const listQuotas = async (
    filter?: QuotaPaginatedFilter | null,
    pagination?: PaginationArgs | null,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ) => {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);

    // IDOR scoping: if the caller holds QUOTAS_MANAGE, return all quotas
    // (admin override). Otherwise, scope results to students the caller is
    // associated with (parent or primary teacher). This prevents a user with
    // QUOTAS_VIEW from listing all quotas via the GraphQL query.
    const uid = actorUserId ?? "";
    const hasManage = await PermissionsService.hasPermission(uid, AppPermission.QUOTAS_MANAGE);
    if (hasManage) {
      const res = await QuotaRepository.listAllPaginated(tx, filter, pagination);
      return {
        ...res,
        rows: res.rows.map(mapQuotaToReturnType),
      };
    }

    const associatedStudentIds = await resolveAssociatedStudentIds(uid);
    if (associatedStudentIds.length === 0) {
      return { rows: [], totalCount: 0 };
    }

    // If the filter already specifies a studentId, ensure it belongs to the
    // caller's associated students; otherwise deny.
    if (filter?.studentId) {
      const allowed = await resolveAssociatedViewer(uid, filter.studentId);
      if (!allowed) {
        return { rows: [], totalCount: 0 };
      }
    } else if (associatedStudentIds.length === 1) {
      // Single associated student — scope the filter directly for efficiency.
      filter = { ...filter, studentId: associatedStudentIds[0] };
    }

    // For multiple associated students without a single-studentId filter,
    // fetch all quotas (no pagination) then filter+paginate in-memory so that
    // pagination operates on the scoped set rather than across all students.
    if (associatedStudentIds.length > 1 && !filter?.studentId) {
      const allRes = await QuotaRepository.listAllPaginated(tx, filter, null);
      const idSet = new Set(associatedStudentIds);
      const filteredRows = allRes.rows.filter(q => idSet.has(q.studentId));
      const total = filteredRows.length;
      const page = pagination
        ? filteredRows.slice(pagination.offset, pagination.offset + pagination.perPage)
        : filteredRows;
      return {
        rows: page.map(mapQuotaToReturnType),
        totalCount: total,
      };
    }

    // Single student or no scoping — use DB pagination directly
    const res = await QuotaRepository.listAllPaginated(tx, filter, pagination);
    return {
      rows: res.rows.map(mapQuotaToReturnType),
      totalCount: res.totalCount,
    };
  };

  export const listStudentOpenQuotas = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaReturnType[]> => {
    // V3-036: IDOR scoping — permission + association gate shared with
    // `listStudentQuotas` via `listScopedByStudent`.
    return listScopedByStudent(studentId, tx, actorUserId, locale, QuotaRepository.listActiveByStudent);
  };

  export const listStudentQuotas = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaReturnType[]> => {
    // IDOR scoping — permission + association gate shared with
    // `listStudentOpenQuotas` via `listScopedByStudent`.
    return listScopedByStudent(studentId, tx, actorUserId, locale, QuotaRepository.listByStudent);
  };

  export const getStudentQuotaBalance = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaBalanceReturnType> => {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
    // V3-035: IDOR scoping — ensure the caller is associated with this student
    // or holds QUOTAS_MANAGE before returning their balance.
    const uid = actorUserId ?? "";
    await assertAssociatedOrManage(uid, studentId, getServerTranslations(locale).errorsTranslations);
    const activeQuotas = await QuotaRepository.listActiveByStudent(tx, studentId);

    let totalActiveClasses = 0;
    let totalRemaining = 0;
    let totalReserved = 0;
    const breakdownByExpiration: QuotaExpirationBreakdown[] = [];

    for (const q of activeQuotas) {
      totalActiveClasses += q.totalClasses;
      totalRemaining += q.remaining;
      totalReserved += q.reservedClasses;

      breakdownByExpiration.push({
        quotaId: q.id,
        quotaName: q.name,
        validUntil: q.validUntil ? new Date(q.validUntil) : null,
        remaining: q.remaining,
      });
    }

    return {
      studentId,
      totalActiveClasses,
      totalRemaining,
      totalReserved,
      breakdownByExpiration,
    };
  };

  /**
   * Recompute a single quota's live balance directly from the immutable
   * `quota_ledger` rows (the single source of truth for quota mutations).
   * Delegates to {@link QuotaLedgerRepository.computeBalance} so the service
   * layer never reads ledger rows directly — keeping the ledger repo the
   * sole reader of its own schema (mirrors the single-writer invariant).
   *
   * Permission check is intentionally shared with `getStudentQuotaBalance`
   * via the caller; this low-level computation is invoked from internal flows
   * (sweepers, reconcilers) that already hold an admin context, so it does not
   * re-run `requirePermission`. Callers exposing this to end users must scope
   * the result by `assertAssociatedOrManage` first.
   *
   * @returns The ledger-derived `{ remaining, reservedClasses }` for the quota.
   */
  export const computeBalance = async (
    quotaId: string,
    tx?: ReadExecutor
  ): Promise<{ remaining: number; reservedClasses: number }> => {
    return QuotaLedgerRepository.computeBalance(tx ?? db, quotaId);
  };

  export const updateQuota = async (
    id: string,
    input: QuotaUpdateInput,
    actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    return manageAndMap(_locale, actorUserId, tx, async t => QuotaRepository.update(t, id, { ...input, actorUserId }));
  };

  export const deleteQuota = async (
    id: string,
    _actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    return manageAndMap(_locale, _actorUserId, tx, async t => QuotaRepository.softDelete(t, id));
  };

  export const reserveForRecurringSchedule = async (
    studentId: string,
    recurringScheduleId: string,
    quotaId: string,
    count: number,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    return txOp(tx, async t => {
      const idempotencyKey = QuotaRepository.deriveReserveIdempotencyKey(recurringScheduleId, quotaId);
      const updated = await QuotaRepository.reserveClasses(t, {
        quotaId,
        studentId,
        recurringScheduleId,
        count,
        actorUserId,
        idempotencyKey,
      });
      return mapQuotaToReturnType(updated);
    });
  };

  export const releaseForRecurringSchedule = async (
    studentId: string,
    recurringScheduleId: string,
    quotaId: string,
    count: number,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    return runInTx(tx, async t => {
      // Deterministic operation identifier: hashing recurringScheduleId +
      // quotaId (NOT count) produces a stable key across retries of the same
      // release. Count is intentionally excluded because a partial release
      // with a different count would produce a *different* key, allowing a
      // second ledger RELEASE row → quota released twice. If the same schedule
      // is cancelled and re-created, the new schedule will have a different
      // recurringScheduleId so the keys won't collide.
      const operationId = `${recurringScheduleId}:${quotaId}`;
      const idempotencyKey = QuotaRepository.deriveReleaseEarmarkIdempotencyKey(
        recurringScheduleId,
        operationId,
        quotaId
      );
      const updated = await QuotaRepository.releaseForRecurringSchedule(t, {
        quotaId,
        studentId,
        recurringScheduleId,
        count,
        actorUserId,
        idempotencyKey,
      });
      return mapQuotaToReturnType(updated);
    });
  };

  export const selectQuotaForBooking = async (
    studentId: string,
    tx?: DBTransaction,
    _actorUserId?: string | null,
    _locale = "en"
  ): Promise<QuotaReturnType | null> => {
    // Permission check intentionally omitted: this method is called from
    // internal flows (CreditService, scripts, class-session service) where
    // no user session exists. Read access to quota selection is safe — the
    // result is only used to decide booking backing, not to expose data.
    return runInTx(tx, async t => {
      const quotaRow = await QuotaRepository.selectQuotaForBookingFIFO(t, studentId);
      return quotaRow ? mapQuotaToReturnType(quotaRow) : null;
    });
  };

  export const redeemForInstance = async (
    studentId: string,
    classInstanceId: string,
    quotaId?: string | null,
    actorUserId?: string | null,
    tx?: DBTransaction,
    locale = "en"
  ): Promise<QuotaReturnType> => {
    return runInTx(tx, async t => {
      let targetQuotaId = quotaId;
      if (!targetQuotaId) {
        const fifoQuota = await QuotaRepository.selectQuotaForBookingFIFO(t, studentId);
        if (!fifoQuota) {
          const tErrors = getServerTranslations(locale).errorsTranslations;
          throw new QuotaNotFoundError(tErrors.quotaNotFound);
        }
        targetQuotaId = fifoQuota.id;
      }

      const idempotencyKey = QuotaRepository.deriveRedeemIdempotencyKey(classInstanceId, targetQuotaId);
      const updated = await QuotaRepository.redeemForInstance(t, {
        quotaId: targetQuotaId,
        studentId,
        classInstanceId,
        actorUserId,
        idempotencyKey,
      });
      return mapQuotaToReturnType(updated);
    });
  };

  export const redeemForInstances = async (
    studentId: string,
    classInstanceIds: string[],
    quotaId: string,
    recurringScheduleId: string | null,
    actorUserId: string | null | undefined,
    tx: DBTransaction,
    locale = "en"
  ): Promise<{ redeemedCount: number; quota: QuotaReturnType | null }> => {
    return runInTx(tx, async t => {
      if (classInstanceIds.length === 0) {
        return { redeemedCount: 0, quota: null };
      }

      const result = await QuotaRepository.redeemForInstanceBatch(t, {
        quotaId,
        studentId,
        recurringScheduleId,
        instanceIds: classInstanceIds,
        actorUserId,
      });

      if (result.redeemedCount === 0 && !result.quota) {
        const tErrors = getServerTranslations(locale).errorsTranslations;
        throw new QuotaNotFoundError(tErrors.quotaNotFound);
      }

      // If redeemedCount === 0 but quota IS present, all instances were
      // already redeemed (idempotent dedup) — return gracefully.

      return {
        redeemedCount: result.redeemedCount,
        quota: result.quota ? mapQuotaToReturnType(result.quota) : null,
      };
    });
  };

  export const releaseForInstance = async (
    studentId: string,
    classInstanceId: string,
    quotaId: string,
    actorUserId?: string | null,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<QuotaReturnType> => {
    return txOp(tx, async t => {
      const idempotencyKey = QuotaRepository.deriveReleasePoolIdempotencyKey(classInstanceId, quotaId);
      const updated = await QuotaRepository.releaseForInstance(t, {
        quotaId,
        studentId,
        classInstanceId,
        actorUserId,
        idempotencyKey,
      });
      return mapQuotaToReturnType(updated);
    });
  };

  /**
   * Try to release quota for a single instance. Returns `{ ok: true }` on
   * success or `{ ok: false, error }` on failure — does NOT throw. Callers
   * are responsible for checking the result and surfacing partial-failure
   * status to their callers so the quota imbalance is visible rather than
   * silently swallowed.
   */
  export const tryReleaseForInstance = async (
    studentId: string,
    classInstanceId: string,
    quotaId: string,
    actorUserId?: string | null,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<{ ok: true } | { ok: false; error: unknown }> => {
    try {
      await releaseForInstance(studentId, classInstanceId, quotaId, actorUserId, tx, _locale);
      return { ok: true };
    } catch (error) {
      logger.warn("Quota release failed — manual retry required", {
        classInstanceId,
        quotaId,
        studentId,
        actorUserId,
        error: error instanceof Error ? error.message : String(error),
        action: "manual_retry_needed",
      });
      return { ok: false, error };
    }
  };

  export const releaseForInstances = async (
    studentId: string,
    classInstanceIds: string[],
    quotaId: string,
    recurringScheduleId: string,
    actorUserId: string | null | undefined,
    tx: DBTransaction
  ): Promise<{ releasedCount: number; quota: QuotaReturnType | null }> => {
    return runInTx(tx, async t => {
      const result = await QuotaRepository.releaseForInstanceBatch(t, {
        quotaId,
        studentId,
        recurringScheduleId,
        instanceIds: classInstanceIds,
        actorUserId,
      });
      return {
        releasedCount: result.releasedCount,
        quota: result.quota ? mapQuotaToReturnType(result.quota) : null,
      };
    });
  };

  export const expireOverdueQuotas = async (tx?: DBTransaction): Promise<QuotaReturnType[]> => {
    return runInTx(tx, async t => (await QuotaRepository.expireOverdue(t)).map(mapQuotaToReturnType));
  };

  export const refreshStudentOndemandInstances = async (
    studentId: string,
    tx?: DBTransaction,
    _actorUserId?: string | null,
    _locale = "en"
  ): Promise<number> => {
    // Permission check intentionally omitted: this method is called from
    // internal flows (CreditService, on-demand instance generator, class
    // lifecycle) where no user session exists. It mutates on-demand instance
    // states only, not quota data directly.
    return runInTx(tx, async t => {
      const creditBalance = await CreditRepository.getBalance(t, studentId);
      const openQuotas = await QuotaRepository.listActiveByStudent(t, studentId);
      const totalQuotaRemaining = openQuotas.reduce((sum, q) => sum + q.remaining, 0);

      const availableCredits = creditBalance.classesRemaining + totalQuotaRemaining;
      if (availableCredits <= 0) return 0;

      const pendingInstances = await SchedulingRepository.getOndemandPendingInstances(t, studentId, availableCredits);

      let flippedCount = 0;
      const now = new Date();

      // Single batched UPDATE for all pending instances (via repository).
      // The WHERE clause also guards on ondemandStatus = PENDING_CREDIT to
      // prevent a TOCTOU race: between the SELECT and UPDATE, a concurrent
      // transaction (e.g. session start) may have flipped an instance to
      // AVAILABLE. Without the guard, we'd overwrite it back to AVAILABLE and
      // over-count the flip, causing a credit leak.
      if (pendingInstances.length > 0) {
        const instanceIds = pendingInstances.map(inst => inst.id);
        flippedCount = await SchedulingRepository.updateOndemandStatusBatch(
          instanceIds,
          {
            executionState: "NOT_ACTIVATED",
            ondemandStatus: OnDemandStatus.AVAILABLE,
            updatedAt: now,
          },
          OnDemandStatus.PENDING_CREDIT,
          t
        );
      }

      // Deduct from quota for flipped instances to prevent double-counting on refresh.
      // `deductPendingRefresh` returns the number of classes it actually deducted from
      // quota. The remainder must come from the student's credit balance — otherwise
      // credit-only students get free classes (credit leak CR-1).
      if (flippedCount > 0) {
        const quotaDeducted = await QuotaRepository.deductPendingRefresh(t, {
          studentId,
          count: flippedCount,
          actorUserId: _actorUserId ?? null,
        });

        const creditPortion = flippedCount - quotaDeducted;
        if (creditPortion > 0) {
          const tErrors = getServerTranslations(_locale).errorsTranslations;
          await StudentRepository.deductClasses(studentId, tErrors, creditPortion, undefined, t);
        }
      }

      logger.info({ studentId, flippedCount }, "Refreshed student on-demand instances");
      return flippedCount;
    });
  };

  /**
   * Seed-only bootstrap method: atomically checks if any quotas already exist
   * and creates a demo quota if none are found, all within a single transaction.
   * This eliminates the race condition in the seeder's check-then-create pattern.
   * Permission checks are intentionally omitted — this runs in trusted seed context.
   */
  export const seedOrGetQuota = async (input: QuotaSubmitInput): Promise<QuotaReturnType[]> => {
    return db.transaction(async t => {
      const res = await QuotaRepository.listAllPaginated(t, null, null);
      if (res.rows.length > 0) {
        return res.rows.map(mapQuotaToReturnType);
      }
      const created = await QuotaRepository.create(t, { ...input });
      return [mapQuotaToReturnType(created)];
    });
  };

  /**
   * Seed-only bootstrap method: atomically checks if any quotas already exist
   * (returning all existing rows if so) and creates ALL provided inputs in batch
   * if none are found, all within a single transaction. Permission checks are
   * intentionally omitted — this runs in trusted seed context.
   */
  export const seedOrGetQuotaBatch = async (inputs: readonly QuotaSubmitInput[]): Promise<QuotaReturnType[]> => {
    if (inputs.length === 0) return [];
    return db.transaction(async t => {
      const res = await QuotaRepository.listAllPaginated(t, null, null);
      if (res.rows.length > 0) {
        return res.rows.map(mapQuotaToReturnType);
      }
      const created: QuotaReturnType[] = [];
      await inputs.reduce(async (prev, input) => {
        await prev;
        const row = await QuotaRepository.create(t, { ...input });
        created.push(mapQuotaToReturnType(row));
      }, Promise.resolve());
      return created;
    });
  };

  // V3-028: Repository already returns QuotaReturnType[] (mapped from raw
  // QuotaSelectType), so the service boundary is type-safe without re-mapping.
  export const listPeriodicForRollover = async (tx: DBTransaction): Promise<QuotaReturnType[]> => {
    return QuotaRepository.listPeriodicForRollover(tx);
  };

  // V3-029: Repository already returns QuotaReturnType (mapped from raw
  // QuotaSelectType), so the service boundary is type-safe without re-mapping.
  export const refreshPeriodic = async (
    tx: DBTransaction,
    quotaId: string,
    actorUserId?: string | null
  ): Promise<QuotaReturnType> => {
    return QuotaRepository.refreshPeriodic(tx, quotaId, actorUserId ?? null);
  };
}
