import { db } from "@/backend/db";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { mapQuotaToReturnType } from "@/backend/lib";
import { logger } from "@/backend/lib/logger";
import { listScopedByStudent, manageAndMap, runInTx, txOp } from "@/backend/services/billing/quota.service.helpers";
import {
  getQuotaFlow,
  getQuotaLedgerFlow,
  getStudentQuotaBalanceFlow,
  listQuotasFlow,
} from "@/backend/services/billing/quota.service.reads";
import { refreshPeriodicFlow } from "@/backend/services/billing/quota.service.rollover";
import {
  redeemForInstanceFlow,
  redeemForInstancesFlow,
  refreshStudentOndemandInstancesFlow,
} from "@/backend/services/billing/quota.service.writes";
import type {
  DBTransaction,
  PaginationArgs,
  QuotaBalanceReturnType,
  QuotaLedgerPaginatedResult,
  QuotaPaginatedFilter,
  QuotaReturnType,
  QuotaSubmitInput,
  QuotaUpdateInput,
  ReadExecutor,
} from "@/backend/types";

export namespace QuotaService {
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
    return getQuotaFlow(id, locale, tx, actorUserId);
  };

  export const getQuotaLedger = async (
    quotaId: string,
    pagination: PaginationArgs | null,
    actorUserId: string,
    locale = "en",
    tx?: ReadExecutor
  ): Promise<QuotaLedgerPaginatedResult> => {
    return getQuotaLedgerFlow(quotaId, pagination, actorUserId, locale, tx);
  };

  export const listQuotas = async (
    filter?: QuotaPaginatedFilter | null,
    pagination?: PaginationArgs | null,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ) => {
    return listQuotasFlow(filter, pagination, tx, actorUserId, locale);
  };

  export const listStudentOpenQuotas = async (
    studentId: string,
    tx?: ReadExecutor,
    actorUserId?: string | null,
    locale = "en"
  ): Promise<QuotaReturnType[]> => {
    // IDOR scoping — permission + association gate shared with
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
    return getStudentQuotaBalanceFlow(studentId, tx, actorUserId, locale);
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
    return redeemForInstanceFlow(studentId, classInstanceId, quotaId, actorUserId, tx, locale);
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
    return redeemForInstancesFlow(studentId, classInstanceIds, quotaId, recurringScheduleId, actorUserId, tx, locale);
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

  export const expireOverdueQuotas = async (tx?: DBTransaction): Promise<QuotaReturnType[]> => {
    return runInTx(tx, async t => (await QuotaRepository.expireOverdue(t)).map(mapQuotaToReturnType));
  };

  export const refreshStudentOndemandInstances = async (
    studentId: string,
    tx?: DBTransaction,
    _actorUserId?: string | null,
    _locale = "en"
  ): Promise<number> => {
    return refreshStudentOndemandInstancesFlow(studentId, tx, _actorUserId, _locale);
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

  // The repository already returns QuotaReturnType[] (mapped from raw
  // QuotaSelectType), so the service boundary is type-safe without re-mapping.
  export const listPeriodicForRollover = async (tx: DBTransaction): Promise<QuotaReturnType[]> => {
    return QuotaRepository.listPeriodicForRollover(tx);
  };

  /**
   * Refresh a single PERIODIC quota for its next period. All business rules
   * (validation, period expiry, policy-based rollover computation, anchor
   * advancement) live in `quota.service.rollover.ts`; this boundary keeps the
   * public signature stable and forwards through the caller's transaction.
   */
  export const refreshPeriodic = async (
    tx: DBTransaction,
    quotaId: string,
    actorUserId?: string | null,
    locale: string = "en"
  ): Promise<QuotaReturnType> => {
    return refreshPeriodicFlow(tx, quotaId, actorUserId, locale);
  };
}
