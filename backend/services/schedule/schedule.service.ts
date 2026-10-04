import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { AppPermission } from "@/backend/enum";
import { DomainError, UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { resolveTeacherId } from "@/backend/services/schedule/__shared__/resolveTeacherId";
import { resolveViewerTimezone } from "@/backend/services/schedule/resolve-viewer-timezone";
import { assertDailyScheduleListAccess } from "@/backend/services/schedule/schedule.access.helpers";
import {
  mapDailyScheduleListItem,
  mapFutureClassItem,
  resolveSupportContact,
} from "@/backend/services/schedule/schedule.mappers.helpers";
import { ClassInstanceExpiryService } from "@/backend/services/session/class-instance-expiry.service";
import { TeacherNotesService } from "@/backend/services/subject/teacher-notes.service";
import type {
  PaginationArgs,
  RescheduleTrackingInput,
  TeacherFutureScheduleReturnType,
  TeacherImportantNoteReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ScheduleService {
  export async function getAdminDashboardSchedule(
    userId: string,
    input: {
      date: string;
      teacherId?: string | null;
      search?: string | null;
      metricFilter?: string | null;
      paginationArgs?: PaginationArgs | null;
    },
    tErrors: ErrorsLabels,
    locale: string
  ) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_VIEW_METRICS);
      if (!isAuthorized) {
        logger.logDomainError("Unauthorized access to daily metrics", { userId });
        throw new UnauthorizedError(tErrors.unauthorizedViewMetrics);
      }

      await assertDailyScheduleListAccess(
        userId,
        {
          search: input.search ?? undefined,
          metricFilter: input.metricFilter ?? undefined,
        },
        tErrors
      );

      const viewerTimezone = await resolveViewerTimezone(userId);
      const parsedDate = new Date(input.date);
      const targetDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      const teacherId = input.teacherId ?? undefined;
      const search = input.search ?? undefined;
      const metricFilter = input.metricFilter ?? undefined;

      await ClassInstanceExpiryService.processExpiredInstances({ locale });
      const { metrics, rows, totalCount, pageInfo } = await SchedulingRepository.getAdminDashboardSchedule({
        date: targetDate,
        teacherId,
        search,
        viewerTimezone,
        metricFilter,
        pagination: input.paginationArgs ?? null,
        locale,
      });

      const mappedRows = await Promise.all(rows.map(row => mapDailyScheduleListItem(row, tErrors)));

      // Include metricFilter + pagination in the cache id so Apollo does not collide
      // distinct query results (e.g. page/filter changes that return empty rows).
      const page = input.paginationArgs?.page ?? 1;
      const first = input.paginationArgs?.first ?? "default";
      const resultKey = [
        input.date,
        teacherId ?? "all",
        search ?? "",
        metricFilter ?? "all",
        `p${page}`,
        `f${first}`,
      ].join("-");

      return {
        id: `admin-dashboard-${resultKey}`,
        metrics: {
          id: `metrics-${targetDate.toISOString()}-${teacherId ?? "all"}-${search ?? ""}`,
          ...metrics,
        },
        rows: mappedRows,
        totalCount,
        pageInfo,
      };
    } catch (error) {
      if (error instanceof DomainError) {
        logger.logDomainError("Admin dashboard schedule access issue", { userId, error: error.message });
      } else {
        logger.error("Error fetching admin dashboard schedule", { userId, error });
      }
      throw error;
    }
  }

  export async function getDailySchedule(
    userId: string,
    targetDate: Date,
    tErrors: ErrorsLabels,
    teacherId?: string,
    search?: string,
    metricFilter?: string
  ) {
    try {
      await assertDailyScheduleListAccess(userId, { search, metricFilter }, tErrors);

      const viewerTimezone = await resolveViewerTimezone(userId);

      const list = await SchedulingRepository.getDailySchedule(targetDate, {
        teacherId,
        search,
        viewerTimezone,
        metricFilter,
      });

      return await Promise.all(list.map(item => mapDailyScheduleListItem(item, tErrors)));
    } catch (error) {
      if (error instanceof DomainError) {
        logger.warn("Daily schedule access issue", { userId, error: error.message });
      } else {
        logger.error("Error fetching daily schedule", { userId, error });
      }
      throw error;
    }
  }

  export async function getRescheduleTracking(
    userId: string,
    input: RescheduleTrackingInput,
    tErrors: ErrorsLabels,
    pagination: PaginationArgs | null = null
  ) {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SESSION_RESCHEDULE);
    if (!isAuthorized) {
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }

    return SchedulingRepository.getRescheduleTrackingRows(input, pagination);
  }

  export async function getRescheduleTrackingMetrics(userId: string, tErrors: ErrorsLabels) {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SESSION_RESCHEDULE);
    if (!isAuthorized) {
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }

    const metrics = await SchedulingRepository.getRescheduleTrackingMetrics();
    return {
      id: "reschedule-tracking-metrics",
      ...metrics,
    };
  }

  export async function getTeacherFutureSchedule(
    userId: string,
    tErrors: ErrorsLabels,
    teacherId?: string
  ): Promise<TeacherFutureScheduleReturnType> {
    const resolvedTeacherId = await resolveTeacherId(userId, teacherId ?? null, tErrors);

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = new Date(now);
    toDate.setDate(toDate.getDate() + 30);

    const periodYear = now.getUTCFullYear();
    const periodMonth = now.getUTCMonth() + 1;

    const maxLeaves = await SystemSettingsRepository.getIntValue("teacher_max_leaves", 2);
    const usedLeaves = await SchedulingRepository.getTeacherLeaveQuotaUsage(resolvedTeacherId, periodYear, periodMonth);

    const futureClasses = await SchedulingRepository.getTeacherFutureClasses(resolvedTeacherId, fromDate, toDate);

    const classes = await Promise.all(
      futureClasses.map(cls => mapFutureClassItem(cls, now, usedLeaves, maxLeaves, tErrors))
    );

    const [importantNotes, supportContact] = await Promise.all([
      TeacherNotesService.getActiveNotes(userId, tErrors, resolvedTeacherId).catch(
        (): TeacherImportantNoteReturnType[] => []
      ),
      resolveSupportContact(),
    ]);

    return {
      id: `future-schedule-${resolvedTeacherId}-${periodYear}-${periodMonth}`,
      leaveQuotaUsed: usedLeaves,
      leaveQuotaTotal: maxLeaves,
      totalClasses: classes.length,
      classes,
      importantNotes,
      supportContact,
    };
  }
}
