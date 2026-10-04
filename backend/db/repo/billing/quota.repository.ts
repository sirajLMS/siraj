import { expireOverdueImpl, redeemForInstanceBatchImpl } from "@/backend/db/repo/billing/quota.repository.batch-expire";
import {
  deriveRedeemIdempotencyKey as deriveRedeemIdempotencyKeyHelper,
  deriveReleaseEarmarkIdempotencyKey as deriveReleaseEarmarkIdempotencyKeyHelper,
  deriveReleasePoolIdempotencyKey as deriveReleasePoolIdempotencyKeyHelper,
  deriveReserveIdempotencyKey as deriveReserveIdempotencyKeyHelper,
} from "@/backend/db/repo/billing/quota.repository.helpers";
import { createImpl, softDeleteImpl, updateImpl } from "@/backend/db/repo/billing/quota.repository.mutations";
import {
  applyRefreshPeriodicImpl,
  deductPendingRefreshImpl,
  resetUsedThisPeriodImpl,
} from "@/backend/db/repo/billing/quota.repository.periodic";
import {
  findByIdImpl,
  listActiveByStudentImpl,
  listAllPaginatedImpl,
  listByStudentIdsPaginatedImpl,
  listByStudentImpl,
  listPeriodicForRolloverImpl,
  selectQuotaForBookingFIFOImpl,
} from "@/backend/db/repo/billing/quota.repository.reads";
import {
  redeemForInstanceImpl,
  releaseForInstanceImpl,
  releaseForRecurringScheduleImpl,
  reserveClassesImpl,
} from "@/backend/db/repo/billing/quota.repository.reserve-release";

export namespace QuotaRepository {
  export const deriveRedeemIdempotencyKey = deriveRedeemIdempotencyKeyHelper;
  export const deriveReserveIdempotencyKey = deriveReserveIdempotencyKeyHelper;
  export const deriveReleasePoolIdempotencyKey = deriveReleasePoolIdempotencyKeyHelper;
  export const deriveReleaseEarmarkIdempotencyKey = deriveReleaseEarmarkIdempotencyKeyHelper;

  export const create = createImpl;
  export const findById = findByIdImpl;
  export const listByStudent = listByStudentImpl;
  export const listActiveByStudent = listActiveByStudentImpl;
  export const listAllPaginated = listAllPaginatedImpl;
  export const listByStudentIdsPaginated = listByStudentIdsPaginatedImpl;
  export const update = updateImpl;
  export const softDelete = softDeleteImpl;
  export const selectQuotaForBookingFIFO = selectQuotaForBookingFIFOImpl;
  export const reserveClasses = reserveClassesImpl;
  export const releaseForRecurringSchedule = releaseForRecurringScheduleImpl;
  export const redeemForInstance = redeemForInstanceImpl;
  export const releaseForInstance = releaseForInstanceImpl;
  export const redeemForInstanceBatch = redeemForInstanceBatchImpl;
  export const expireOverdue = expireOverdueImpl;
  export const listPeriodicForRollover = listPeriodicForRolloverImpl;
  export const applyRefreshPeriodic = applyRefreshPeriodicImpl;
  export const deductPendingRefresh = deductPendingRefreshImpl;
  export const resetUsedThisPeriod = resetUsedThisPeriodImpl;
}
