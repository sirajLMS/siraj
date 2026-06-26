import { ParentRepository } from "@/backend/db/repo/parent.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import type { DailyScheduleResult } from "@/backend/db/repo/scheduling/scheduling-queries.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { PaginationArgs } from "@/backend/types";
import { AppPermission, type ClassExecutionState, type ClassOutcome } from "@/shared/lib/enum";

export namespace ScheduleService {
  async function resolveViewerTimezone(userId: string): Promise<string> {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (teacher?.timezone) return teacher.timezone;

    const parent = await ParentRepository.findByUserId(userId);
    if (parent?.timezone) return parent.timezone;

    return await SystemSettingsRepository.getStringValue("default_timezone", "UTC");
  }

  function mapDailyScheduleListItem(item: DailyScheduleResult) {
    return {
      id: item.id,
      studentTime: item.scheduledStartAt.toISOString(),
      teacherTime: item.scheduledStartAt.toISOString(),
      yourTime: item.yourTimeFormatted || item.scheduledStartAt.toISOString(),
      duration: item.durationMinutes,
      status: item.outcome || item.executionState,
      outcome: item.outcome as ClassOutcome,
      executionState: item.executionState as ClassExecutionState,
      student: { id: item.studentId, name: item.student?.name || "Unknown" },
      teacher: { id: item.teacherId, name: item.teacher?.user?.name || "Unknown" },
    };
  }

  async function assertDailyScheduleListAccess(
    userId: string,
    options: { search?: string; metricFilter?: string },
    locale?: string
  ) {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_LIST);
    if (!isAuthorized) {
      logger.warn("Unauthorized access to daily schedule", { userId });
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedViewList"));
    }

    if (options.search) {
      const canSearch = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_SEARCH);
      if (!canSearch) {
        logger.warn("Unauthorized search access to daily schedule", { userId });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedSearch"));
      }
    }

    if (options.metricFilter && options.metricFilter !== "total") {
      const canFilter = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_FILTER_METRICS);
      if (!canFilter) {
        logger.warn("Unauthorized metric filter access to daily schedule", {
          userId,
          metricFilter: options.metricFilter,
        });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }
    }
  }

  export async function getAdminDashboardSchedule(
    userId: string,
    input: {
      date: string;
      teacherId?: string | null;
      search?: string | null;
      metricFilter?: string | null;
      paginationArgs?: PaginationArgs | null;
    },
    locale?: string
  ) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_VIEW_METRICS);
      if (!isAuthorized) {
        logger.warn("Unauthorized access to daily metrics", { userId });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedViewMetrics"));
      }

      await assertDailyScheduleListAccess(
        userId,
        {
          search: input.search || undefined,
          metricFilter: input.metricFilter || undefined,
        },
        locale
      );

      const viewerTimezone = await resolveViewerTimezone(userId);
      const targetDate = new Date(input.date);
      const teacherId = input.teacherId || undefined;
      const search = input.search || undefined;
      const metricFilter = input.metricFilter || undefined;

      const { metrics, rows, totalCount, pageInfo } = await SchedulingRepository.getAdminDashboardSchedule({
        date: targetDate,
        teacherId,
        search,
        viewerTimezone,
        metricFilter,
        pagination: input.paginationArgs ?? null,
      });

      const mappedRows = rows.map(mapDailyScheduleListItem);

      return {
        id: `admin-dashboard-${input.date}-${teacherId || "all"}-${search || ""}`,
        metrics: {
          id: `metrics-${targetDate.toISOString()}-${teacherId || "all"}-${search || ""}`,
          ...metrics,
        },
        rows: mappedRows,
        totalCount,
        pageInfo,
      };
    } catch (error) {
      logger.error("Error fetching admin dashboard schedule", { userId, error });
      throw error;
    }
  }

  export async function getDailyMetrics(userId: string, targetDate: Date, teacherId?: string, locale?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_VIEW_METRICS);
      if (!isAuthorized) {
        logger.warn("Unauthorized access to daily metrics", { userId });
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedViewMetrics"));
      }

      const viewerTimezone = await resolveViewerTimezone(userId);
      const metrics = await SchedulingRepository.getDailyMetrics(targetDate, teacherId, undefined, viewerTimezone);

      return {
        id: `metrics-${targetDate.toISOString()}-${teacherId || "all"}`,
        ...metrics,
      };
    } catch (error) {
      logger.error("Error fetching daily metrics", { userId, error });
      throw error;
    }
  }

  export async function getDailySchedule(
    userId: string,
    targetDate: Date,
    teacherId?: string,
    search?: string,
    metricFilter?: string,
    locale?: string
  ) {
    try {
      await assertDailyScheduleListAccess(userId, { search, metricFilter }, locale);

      const viewerTimezone = await resolveViewerTimezone(userId);

      const list = await SchedulingRepository.getDailySchedule(targetDate, {
        teacherId,
        search,
        viewerTimezone,
        metricFilter,
      });

      return list.map(item => mapDailyScheduleListItem(item));
    } catch (error) {
      logger.error("Error fetching daily schedule", { userId, error });
      throw error;
    }
  }

  export async function getRescheduleTracking(
    userId: string,
    input: { search?: string | null; status?: string | null; limit?: number | null; offset?: number | null },
    locale?: string
  ) {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SESSION_RESCHEDULE);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return SchedulingRepository.getRescheduleTrackingRows(input);
  }

  export async function getRescheduleTrackingMetrics(userId: string, locale?: string) {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SESSION_RESCHEDULE);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const metrics = await SchedulingRepository.getRescheduleTrackingMetrics();
    return {
      id: "reschedule-tracking-metrics",
      ...metrics,
    };
  }

  export async function getTeacherFutureSchedule(userId: string, locale?: string) {
    const teacherRecord = await SchedulingRepository.getTeacherByUserId(userId);
    if (!teacherRecord) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = new Date(now);
    toDate.setDate(toDate.getDate() + 30);

    const periodYear = now.getUTCFullYear();
    const periodMonth = now.getUTCMonth() + 1;

    const maxLeaves = await SystemSettingsRepository.getIntValue("teacher_max_leaves", 2);
    const usedLeaves = await SchedulingRepository.getTeacherLeaveQuotaUsage(teacherRecord.id, periodYear, periodMonth);

    const futureClasses = await SchedulingRepository.getTeacherFutureClasses(teacherRecord.id, fromDate, toDate);

    const classes = futureClasses.map(cls => {
      const classStart = new Date(cls.scheduledStartAt);
      const isPast = classStart < now;
      const isQuotaExhausted = usedLeaves >= maxLeaves;

      let leaveRequestDisabled = false;
      let leaveRequestDisabledReason: string | null = null;

      if (isPast) {
        leaveRequestDisabled = true;
        leaveRequestDisabledReason = "time";
      } else if (isQuotaExhausted) {
        leaveRequestDisabled = true;
        leaveRequestDisabledReason = "quota";
      }

      const formatTime = (date: Date): string =>
        date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

      return {
        id: cls.id,
        courseName: cls.studentName,
        scheduledDate: cls.scheduledStartAt.toISOString().split("T")[0],
        startTime: formatTime(cls.scheduledStartAt),
        endTime: formatTime(cls.scheduledEndAt),
        durationMinutes: cls.durationMinutes,
        isRescheduled: cls.isRescheduled,
        leaveRequestDisabled,
        leaveRequestDisabledReason,
        studentCount: 1,
        location: "Virtual",
      };
    });

    return {
      id: `future-schedule-${teacherRecord.id}-${periodYear}-${periodMonth}`,
      leaveQuotaUsed: usedLeaves,
      leaveQuotaTotal: maxLeaves,
      totalClasses: classes.length,
      classes,
    };
  }
}
