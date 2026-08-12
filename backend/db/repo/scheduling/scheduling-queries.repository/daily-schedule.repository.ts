import { db } from "@/backend/db/drizzleDb";
import {
  applyViewerTimezoneFormatting,
  fetchDailyScheduleBaseRows,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository/daily-schedule.utils";
import type { DBTransaction } from "@/backend/types";
import type {
  AdminDashboardScheduleRepoInput,
  AdminDashboardScheduleResult,
  DailyScheduleResult,
} from "@/backend/types/scheduling/scheduling.types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { parseIanaTimezone } from "@/shared/lib/enum";
import {
  computeDailyScheduleMetricsFromRows,
  matchesDashboardMetricFilter,
} from "@/shared/lib/schedule/schedule-instance-dashboard-status";

export const getAdminDashboardSchedule = async (
  input: AdminDashboardScheduleRepoInput,
  tx?: DBTransaction
): Promise<AdminDashboardScheduleResult> => {
  if (!tx) {
    const { ClassInstanceExpiryService } = await import("@/backend/services/session/class-instance-expiry.service");
    await ClassInstanceExpiryService.processExpiredInstances({ locale: input.locale });
  }

  const runner = async (t: DBTransaction): Promise<AdminDashboardScheduleResult> => {
    const { SystemSettingsRepository } = await import("@/backend/db/repo/shared/system-settings.repository");
    const { DEFAULT_MISSED_GRACE_MINUTES } = await import("@/shared/lib/schedule/schedule-instance-dashboard-status");
    const missedGraceMinutes = await SystemSettingsRepository.getIntValue(
      "session_missed_grace_minutes",
      DEFAULT_MISSED_GRACE_MINUTES,
      t
    );

    const baseRows = await fetchDailyScheduleBaseRows(
      t,
      input.date,
      input.viewerTimezone,
      input.teacherId,
      input.search
    );

    const metricsOptions = { missedGraceMinutes };
    const metrics = computeDailyScheduleMetricsFromRows(baseRows, metricsOptions);

    const filteredRows = input.metricFilter
      ? baseRows.filter(row => matchesDashboardMetricFilter(row, input.metricFilter, metricsOptions))
      : baseRows;

    const totalCount = filteredRows.length;

    const paginatedRows = input.pagination
      ? filteredRows.slice(input.pagination.offset, input.pagination.offset + input.pagination.perPage)
      : filteredRows;

    const pageInfo = input.pagination
      ? {
          count: paginatedRows.length,
          currentPage: input.pagination.currentPage,
          firstItem: paginatedRows.length > 0 ? input.pagination.offset + 1 : null,
          hasMorePages: input.pagination.offset + input.pagination.perPage < totalCount,
          lastItem: paginatedRows.length > 0 ? input.pagination.offset + paginatedRows.length : null,
          lastPage: Math.max(1, Math.ceil(totalCount / input.pagination.perPage)),
          perPage: input.pagination.perPage,
          total: totalCount,
        }
      : null;

    return {
      metrics,
      rows: await applyViewerTimezoneFormatting(paginatedRows, input.viewerTimezone, input.locale),
      totalCount,
      pageInfo,
    };
  };

  return tx ? await runner(tx) : await db.transaction((t: DBTransaction) => runner(t));
};

export const getDailyMetrics = async (
  date: Date,
  teacherId?: string,
  tx?: DBTransaction,
  viewerTimezone: IanaTimezone = IanaTimezone.UTC
) => {
  const { metrics } = await getAdminDashboardSchedule({ date, teacherId, viewerTimezone }, tx);
  return metrics;
};

export const getDailySchedule = async (
  date: Date,
  options?: string | { teacherId?: string; search?: string; viewerTimezone?: string; metricFilter?: string },
  tx?: DBTransaction
): Promise<DailyScheduleResult[]> => {
  const teacherId = typeof options === "string" ? options : options?.teacherId;
  const search = typeof options === "object" ? options?.search : undefined;
  const viewerTimezone = typeof options === "object" ? options?.viewerTimezone : undefined;
  const metricFilter = typeof options === "object" ? options?.metricFilter : undefined;

  const { rows } = await getAdminDashboardSchedule(
    {
      date,
      teacherId,
      search,
      viewerTimezone: parseIanaTimezone(viewerTimezone),
      metricFilter,
    },
    tx
  );

  return rows;
};
