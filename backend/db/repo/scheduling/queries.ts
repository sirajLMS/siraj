import {
  bulkFreezeStudentClasses as bulkFreezeStudentClassesFn,
  bulkUnfreezeStudentClasses as bulkUnfreezeStudentClassesFn,
  type DailyScheduleResult as DailyScheduleResultType,
  type FutureClassRow as FutureClassRowType,
  getClassStatusEvents as getClassStatusEventsFn,
  getDailyMetrics as getDailyMetricsFn,
  getDailySchedule as getDailyScheduleFn,
  getRescheduleTrackingMetrics as getRescheduleTrackingMetricsFn,
  getRescheduleTrackingRows as getRescheduleTrackingRowsFn,
  getStatusTrackingRows as getStatusTrackingRowsFn,
  getStudentFutureClasses as getStudentFutureClassesFn,
  getTeacherByUserId as getTeacherByUserIdFn,
  getTeacherFutureClasses as getTeacherFutureClassesFn,
  getTeacherLeaveQuotaUsage as getTeacherLeaveQuotaUsageFn,
  getTeacherProgressFeed as getTeacherProgressFeedFn,
  incrementTeacherLeaveQuota as incrementTeacherLeaveQuotaFn,
  type StatusTrackingRow as StatusTrackingRowType,
} from "./scheduling-queries.repository";

export type DailyScheduleResult = DailyScheduleResultType;
export type FutureClassRow = FutureClassRowType;
export type StatusTrackingRow = StatusTrackingRowType;
export const getDailyMetrics = getDailyMetricsFn;
export const getDailySchedule = getDailyScheduleFn;
export const getClassStatusEvents = getClassStatusEventsFn;
export const getTeacherProgressFeed = getTeacherProgressFeedFn;
export const getRescheduleTrackingRows = getRescheduleTrackingRowsFn;
export const getRescheduleTrackingMetrics = getRescheduleTrackingMetricsFn;
export const getTeacherLeaveQuotaUsage = getTeacherLeaveQuotaUsageFn;
export const incrementTeacherLeaveQuota = incrementTeacherLeaveQuotaFn;
export const getTeacherByUserId = getTeacherByUserIdFn;
export const getTeacherFutureClasses = getTeacherFutureClassesFn;
export const getStatusTrackingRows = getStatusTrackingRowsFn;
export const bulkFreezeStudentClasses = bulkFreezeStudentClassesFn;
export const bulkUnfreezeStudentClasses = bulkUnfreezeStudentClassesFn;
export const getStudentFutureClasses = getStudentFutureClassesFn;
