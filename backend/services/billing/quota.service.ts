import { inArray } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { CreditRepository } from "@/backend/db/repo/billing/credit.repository";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, OnDemandStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
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
   * Unified permission guard. Checks that `actorUserId` is present and holds
   * the given `AppPermission`. Throws a localized error on failure.
   *
   * This is the single canonical permission guard for the quota service. It
   * replaces the previous duplicated `requireManagePermission` /
   * `requireViewPermission` helpers.
   */
  async function requirePermission(
    actorUserId: string | null | undefined,
    locale: string,
    permission: AppPermission
  ): Promise<void> {
    if (!actorUserId) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.unauthorizedAction);
    }
    const hasPermission = await PermissionsService.hasPermission(actorUserId, permission);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  /**
   * Resolves whether the calling user is associated with the given student as
   * the student's parent or primary teacher. Used to scope IDOR-vulnerable
   * reads so a caller with QUOTAS_VIEW can only access their own students'
   * data; admins/teachers with QUOTAS_MANAGE bypass via the permission check.
   */
  async function resolveAssociatedViewer(actorUserId: string, studentId: string): Promise<boolean> {
    const profile = await StudentRepository.findProfileById(studentId);
    if (!profile) return false;

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (parent?.id === profile?.parentId) return true;

    const teacher = await TeacherRepository.findByUserId(actorUserId);
    if (teacher?.id === profile?.primaryTeacherId) return true;

    return false;
  }

  export const createQuota = async (
    input: QuotaSubmitInput,
    actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    await requirePermission(actorUserId, _locale, AppPermission.QUOTAS_MANAGE);
    const runner = async (t: DBTransaction) => {
      const created = await QuotaRepository.create(t, { ...input, actorUserId });
      return mapQuotaToReturnType(created);
    };
    return tx ? runner(tx) : db.transaction(runner);
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
      throw new Error(tErrors.notFound);
    }
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
      throw new Error(tErrors.notFound);
    }

    const isAssociated = await resolveAssociatedViewer(actorUserId, quota.studentId);
    const hasManage = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_MANAGE);
    if (!isAssociated && !hasManage) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }

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
    const res = await QuotaRepository.listAllPaginated(tx, filter, pagination);
    return {
      ...res,
      rows: res.rows.map(mapQuotaToReturnType),
    };
  };

  export const listStudentOpenQuotas = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaReturnType[]> => {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
    const rows = await QuotaRepository.listActiveByStudent(tx, studentId);
    return rows.map(mapQuotaToReturnType);
  };

  export const getStudentQuotaBalance = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaBalanceReturnType> => {
    await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
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

  export const updateQuota = async (
    id: string,
    input: QuotaUpdateInput,
    actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    await requirePermission(actorUserId, _locale, AppPermission.QUOTAS_MANAGE);
    const runner = async (t: DBTransaction) => {
      const updated = await QuotaRepository.update(t, id, { ...input, actorUserId });
      return mapQuotaToReturnType(updated);
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const deleteQuota = async (
    id: string,
    _actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    await requirePermission(_actorUserId, _locale, AppPermission.QUOTAS_MANAGE);
    const runner = async (t: DBTransaction) => {
      const deleted = await QuotaRepository.softDelete(t, id);
      return mapQuotaToReturnType(deleted);
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const reserveForRecurringSchedule = async (
    studentId: string,
    recurringScheduleId: string,
    quotaId: string,
    count: number,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    const runner = async (t: DBTransaction) => {
      const idempotencyKey = QuotaRepository.deriveReserveIdempotencyKey(recurringScheduleId, quotaId);
      const updated = await QuotaRepository.reserveClasses(t, {
        quotaId,
        studentId,
        recurringScheduleId,
        count,
        actorUserId,
        idempotencyKey,
      });
      return updated as QuotaReturnType;
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const releaseForRecurringSchedule = async (
    studentId: string,
    recurringScheduleId: string,
    quotaId: string,
    count: number,
    actorUserId?: string | null,
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    const runner = async (t: DBTransaction) => {
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
      return updated as QuotaReturnType;
    };
    return tx ? runner(tx) : db.transaction(runner);
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
    const runner = async (t: DBTransaction) => {
      return (await QuotaRepository.selectQuotaForBookingFIFO(t, studentId)) as QuotaReturnType | null;
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const redeemForInstance = async (
    studentId: string,
    classInstanceId: string,
    quotaId?: string | null,
    actorUserId?: string | null,
    tx?: DBTransaction,
    locale = "en"
  ): Promise<QuotaReturnType> => {
    const runner = async (t: DBTransaction) => {
      let targetQuotaId = quotaId;
      if (!targetQuotaId) {
        const fifoQuota = await QuotaRepository.selectQuotaForBookingFIFO(t, studentId);
        if (!fifoQuota) {
          const tErrors = getServerTranslations(locale).errorsTranslations;
          throw new Error(tErrors.quotaNotFound);
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
      return updated as QuotaReturnType;
    };
    return tx ? runner(tx) : db.transaction(runner);
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
    const runner = async (t: DBTransaction) => {
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
        throw new Error(tErrors.quotaNotFound);
      }

      // If redeemedCount === 0 but quota IS present, all instances were
      // already redeemed (idempotent dedup) — return gracefully.

      return {
        redeemedCount: result.redeemedCount,
        quota: result.quota ? (result.quota as QuotaReturnType) : null,
      };
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const releaseForInstance = async (
    studentId: string,
    classInstanceId: string,
    quotaId: string,
    actorUserId?: string | null,
    tx?: DBTransaction,
    _locale?: string
  ): Promise<QuotaReturnType> => {
    const runner = async (t: DBTransaction) => {
      const idempotencyKey = QuotaRepository.deriveReleasePoolIdempotencyKey(classInstanceId, quotaId);
      const updated = await QuotaRepository.releaseForInstance(t, {
        quotaId,
        studentId,
        classInstanceId,
        actorUserId,
        idempotencyKey,
      });
      return updated as QuotaReturnType;
    };
    return tx ? runner(tx) : db.transaction(runner);
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
    const runner = async (t: DBTransaction) => {
      const result = await QuotaRepository.releaseForInstanceBatch(t, {
        quotaId,
        studentId,
        recurringScheduleId,
        instanceIds: classInstanceIds,
        actorUserId,
      });
      return {
        releasedCount: result.releasedCount,
        quota: result.quota ? (result.quota as QuotaReturnType) : null,
      };
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const expireOverdueQuotas = async (tx?: DBTransaction): Promise<QuotaReturnType[]> => {
    const runner = async (t: DBTransaction) => {
      const expired = await QuotaRepository.expireOverdue(t);
      return expired as QuotaReturnType[];
    };
    return tx ? runner(tx) : db.transaction(runner);
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
    const runner = async (t: DBTransaction) => {
      const creditBalance = await CreditRepository.getBalance(t, studentId);
      const openQuotas = await QuotaRepository.listActiveByStudent(t, studentId);
      const totalQuotaRemaining = openQuotas.reduce((sum, q) => sum + q.remaining, 0);

      const availableCredits = creditBalance.classesRemaining + totalQuotaRemaining;
      if (availableCredits <= 0) return 0;

      const pendingInstances = await SchedulingRepository.getOndemandPendingInstances(t, studentId, availableCredits);

      let flippedCount = 0;
      const now = new Date();

      // Single batched UPDATE for all pending instances instead of N sequential writes.
      // All instances get the same set of values, so one inArray UPDATE suffices.
      if (pendingInstances.length > 0) {
        const instanceIds = pendingInstances.map(inst => inst.id);
        await t
          .update(classInstances)
          .set({
            executionState: "NOT_ACTIVATED",
            ondemandStatus: OnDemandStatus.AVAILABLE,
            updatedAt: now,
          })
          .where(inArray(classInstances.id, instanceIds));

        flippedCount = pendingInstances.length;
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
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
