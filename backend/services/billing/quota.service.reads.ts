import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { QuotaLedgerRepository } from "@/backend/db/repo/billing/quota-ledger.repository";
import { AppPermission } from "@/backend/enum";
import { mapQuotaLedgerToReturnType, mapQuotaToReturnType } from "@/backend/lib";
import { QuotaNotFoundError } from "@/backend/lib/errors";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  assertAssociatedOrManage,
  resolveAssociatedStudentIds,
  resolveAssociatedViewer,
} from "@/backend/services/billing/permission-utils";
import { requirePermission } from "@/backend/services/billing/quota.service.helpers";
import type {
  PaginationArgs,
  QuotaBalanceReturnType,
  QuotaExpirationBreakdown,
  QuotaLedgerPaginatedResult,
  QuotaPaginatedFilter,
  QuotaReturnType,
  ReadExecutor,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export async function getQuotaFlow(
  id: string,
  locale: string,
  tx?: ReadExecutor,
  actorUserId?: string | null
): Promise<QuotaReturnType> {
  await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
  const quota = await QuotaRepository.findById(tx, id);
  if (!quota) {
    const tErrors = getServerTranslations(locale).errorsTranslations;
    throw new QuotaNotFoundError(tErrors.notFound);
  }

  // IDOR scoping — verify the caller is either associated with
  // the quota's student or holds QUOTAS_MANAGE (admin/teacher override).
  const uid = actorUserId ?? "";
  await assertAssociatedOrManage(uid, quota.studentId, getServerTranslations(locale).errorsTranslations);

  return mapQuotaToReturnType(quota);
}

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
export async function getQuotaLedgerFlow(
  quotaId: string,
  pagination: PaginationArgs | null,
  actorUserId: string,
  locale: string,
  tx?: ReadExecutor
): Promise<QuotaLedgerPaginatedResult> {
  await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);

  const quota = await QuotaRepository.findById(tx, quotaId);
  if (!quota) {
    const tErrors = getServerTranslations(locale).errorsTranslations;
    throw new QuotaNotFoundError(tErrors.notFound);
  }

  // IDOR scoping — shared helper
  await assertAssociatedOrManage(actorUserId, quota.studentId, getServerTranslations(locale).errorsTranslations);

  const [rawRows, totalCount] = await Promise.all([
    QuotaLedgerRepository.findByQuotaId(tx, quotaId, pagination),
    QuotaLedgerRepository.countByQuotaId(tx, quotaId),
  ]);

  return {
    rows: rawRows.map(mapQuotaLedgerToReturnType),
    totalCount,
  };
}

export async function listQuotasFlow(
  filter: QuotaPaginatedFilter | null | undefined,
  pagination: PaginationArgs | null | undefined,
  tx: ReadExecutor | undefined,
  actorUserId: string | null | undefined,
  locale: string
): Promise<{ rows: QuotaReturnType[]; totalCount: number }> {
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
  // scope the query in SQL via the repository's student-ID list read so
  // pagination and totalCount operate on the associated-student set rather
  // than across all quotas.
  if (associatedStudentIds.length > 1 && !filter?.studentId) {
    const scopedRes = await QuotaRepository.listByStudentIdsPaginated(tx, associatedStudentIds, filter, pagination);
    return {
      rows: scopedRes.rows.map(mapQuotaToReturnType),
      totalCount: scopedRes.totalCount,
    };
  }

  // Single student or no scoping — use DB pagination directly
  const res = await QuotaRepository.listAllPaginated(tx, filter, pagination);
  return {
    rows: res.rows.map(mapQuotaToReturnType),
    totalCount: res.totalCount,
  };
}

export async function getStudentQuotaBalanceFlow(
  studentId: string,
  tx: ReadExecutor | undefined,
  actorUserId: string | null | undefined,
  locale: string
): Promise<QuotaBalanceReturnType> {
  await requirePermission(actorUserId, locale, AppPermission.QUOTAS_VIEW);
  // IDOR scoping — ensure the caller is associated with this student
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
}
