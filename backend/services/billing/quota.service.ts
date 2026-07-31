import { and, eq, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing/credit.repository";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, OnDemandStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  mapQuotaToReturnType,
  type QuotaBalanceReturnType,
  type QuotaExpirationBreakdown,
  type QuotaPaginatedFilter,
  type QuotaReturnType,
  type QuotaSubmitInput,
  type QuotaUpdateInput,
} from "@/backend/types/billing/quota.types";
import type { PaginationArgs } from "@/backend/types/shared/pagination.types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

type ReadExecutor = DBTransaction | typeof db;

export namespace QuotaService {
  // Permission check helper functions
  async function requireManagePermission(actorUserId: string | null | undefined, locale: string): Promise<void> {
    if (!actorUserId) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.unauthorizedAction);
    }
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_MANAGE);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  async function requireViewPermission(actorUserId: string | null | undefined, locale: string): Promise<void> {
    if (!actorUserId) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.unauthorizedAction);
    }
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.QUOTAS_VIEW);
    if (!hasPermission) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  export const createQuota = async (
    input: QuotaSubmitInput,
    actorUserId?: string | null,
    _locale = "en",
    tx?: DBTransaction
  ): Promise<QuotaReturnType> => {
    await requireManagePermission(actorUserId, _locale);
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
    await requireViewPermission(actorUserId, locale);
    const quota = await QuotaRepository.findById(tx, id);
    if (!quota) {
      const tErrors = getServerTranslations(locale).errorsTranslations;
      throw new Error(tErrors.notFound);
    }
    return mapQuotaToReturnType(quota);
  };

  export const listQuotas = async (
    filter?: QuotaPaginatedFilter | null,
    pagination?: PaginationArgs | null,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ) => {
    await requireViewPermission(actorUserId, locale);
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
    await requireViewPermission(actorUserId, locale);
    const rows = await QuotaRepository.listActiveByStudent(tx, studentId);
    return rows.map(mapQuotaToReturnType);
  };

  export const getStudentQuotaBalance = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaBalanceReturnType> => {
    await requireViewPermission(actorUserId, locale);
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
    await requireManagePermission(actorUserId, _locale);
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
    await requireManagePermission(_actorUserId, _locale);
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
      // Use a per-operation unique segment (epoch timestamp) instead of `count`
      // to prevent idempotency-key collisions across repeated releases of the
      // same schedule+quota with the same count (e.g. cancel → re-cancel cycles).
      const operationId = String(Date.now());
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
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaReturnType | null> => {
    await requireViewPermission(actorUserId, locale);
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

      if (result.redeemedCount === 0) {
        const tErrors = getServerTranslations(locale).errorsTranslations;
        throw new Error(tErrors.quotaNotFound);
      }

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

  export const refreshPeriodicQuotas = async (tx?: DBTransaction): Promise<void> => {
    const runner = async (t: DBTransaction) => {
      await QuotaRepository.expireOverdue(t);
      // Sweeper handles periodic grants
    };
    return tx ? runner(tx) : db.transaction(runner);
  };

  export const refreshStudentOndemandInstances = async (
    studentId: string,
    tx?: DBTransaction,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<number> => {
    await requireViewPermission(actorUserId, locale);
    const runner = async (t: DBTransaction) => {
      const creditBalance = await CreditRepository.getBalance(t, studentId);
      const openQuotas = await QuotaRepository.listActiveByStudent(t, studentId);
      const totalQuotaRemaining = openQuotas.reduce((sum, q) => sum + q.remaining, 0);

      const availableCredits = creditBalance.classesRemaining + totalQuotaRemaining;
      if (availableCredits <= 0) return 0;

      const pendingInstances = await t
        .select()
        .from(classInstances)
        .where(
          and(
            eq(classInstances.studentId, studentId),
            isNull(classInstances.deletedAt),
            eq(classInstances.ondemandStatus, OnDemandStatus.PENDING_CREDIT)
          )
        )
        .orderBy(classInstances.scheduledStartAt)
        .limit(availableCredits);

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

      // Deduct from quota for flipped instances to prevent double-counting on refresh
      if (flippedCount > 0) {
        await QuotaRepository.deductPendingRefresh(t, {
          studentId,
          count: flippedCount,
          actorUserId: actorUserId ?? null,
        });
      }

      logger.info({ studentId, flippedCount }, "Refreshed student on-demand instances");
      return flippedCount;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };
}
