import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SystemSettingsRepository } from "@/backend/db/repo/shared/system-settings.repository";
import { StaffProfileRepository } from "@/backend/db/repo/teachers/staff-profile.repository";
import { AppPermission } from "@/backend/enum";
import { resolveClassAvatarUrl } from "@/backend/lib/avatar";
import { UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { resolveTeacherId } from "@/backend/services/schedule/__shared__/resolveTeacherId";
import { resolveViewerTimezone } from "@/backend/services/schedule/resolve-viewer-timezone";
import { ClassInstanceExpiryService } from "@/backend/services/session/class-instance-expiry.service";
import { TeacherNotesService } from "@/backend/services/subject/teacher-notes.service";
import type {
  DailyScheduleResult,
  FutureClassRow,
  PaginationArgs,
  RescheduleTrackingInput,
  SupportContactReturnType,
  TeacherFutureScheduleReturnType,
  TeacherImportantNoteReturnType,
} from "@/backend/types";
import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
import { parseClassExecutionState, parseClassOutcome, parseClassTypeOrNull } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export namespace ScheduleService {
  async function mapDailyScheduleListItem(item: DailyScheduleResult, tErrors: ErrorsLabels) {
    const unknownName = tErrors.unknownName;
    const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(item.id, tErrors);
    return {
      id: item.id,
      studentTime: item.scheduledStartAt.toISOString(),
      teacherTime: item.scheduledStartAt.toISOString(),
      yourTime: item.yourTimeFormatted ?? item.scheduledStartAt.toISOString(),
      duration: item.durationMinutes,
      scheduledStartAt: item.scheduledStartAt,
      scheduledEndAt: item.scheduledEndAt,
      status: parseClassExecutionState(item.outcome || item.executionState),
      outcome: parseClassOutcome(item.outcome) ?? ClassOutcome.PENDING,
      executionState: parseClassExecutionState(item.executionState),
      isFrozen: item.isFrozen,
      student: {
        id: item.studentId,
        name: item.student?.name ?? unknownName,
        avatarUrl: item.student?.avatarUrl ?? null,
      },
      teacher: {
        id: item.teacherId,
        name: item.teacher?.user?.name ?? unknownName,
        avatarUrl: item.teacher?.user?.avatarUrl ?? null,
      },
      courseName: item.courseName ?? null,
      avatarUrl: item.avatarUrl ?? null,
      teacherTimezone: item.teacherTimezone ?? null,
      studentTimezone: item.studentTimezone ?? null,
      meetingJoinUrl: effectiveMeeting.joinUrl,
      effectiveMeeting,
    };
  }

  async function assertDailyScheduleListAccess(
    userId: string,
    options: { search?: string; metricFilter?: string },
    tErrors: ErrorsLabels
  ) {
    const isAuthorized = await PermissionsService.hasAnyPermission(userId, [
      AppPermission.SCHEDULE_VIEW_LIST,
      AppPermission.SCHEDULE_VIEW_ALL,
    ]);
    if (!isAuthorized) {
      logger.warn("Unauthorized access to daily schedule", { userId });
      throw new UnauthorizedError(tErrors.unauthorizedViewList);
    }

    if (options.search) {
      const canSearch = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_SEARCH);
      if (!canSearch) {
        logger.warn("Unauthorized search access to daily schedule", { userId });
        throw new UnauthorizedError(tErrors.unauthorizedSearch);
      }
    }

    if (options.metricFilter && options.metricFilter !== "total") {
      const canFilter = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_FILTER_METRICS);
      if (!canFilter) {
        logger.warn("Unauthorized metric filter access to daily schedule", {
          userId,
          metricFilter: options.metricFilter,
        });
        throw new UnauthorizedError(tErrors.unauthorizedAction);
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
    tErrors: ErrorsLabels,
    locale: string
  ) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_VIEW_METRICS);
      if (!isAuthorized) {
        logger.warn("Unauthorized access to daily metrics", { userId });
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
      logger.error("Error fetching admin dashboard schedule", { userId, error });
      throw error;
    }
  }

  export async function getDailyMetrics(userId: string, targetDate: Date, tErrors: ErrorsLabels, teacherId?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.DASHBOARD_VIEW_METRICS);
      if (!isAuthorized) {
        logger.warn("Unauthorized access to daily metrics", { userId });
        throw new UnauthorizedError(tErrors.unauthorizedViewMetrics);
      }

      const viewerTimezone = await resolveViewerTimezone(userId);
      const metrics = await SchedulingRepository.getDailyMetrics(targetDate, teacherId, undefined, viewerTimezone);

      return {
        id: `metrics-${targetDate.toISOString()}-${teacherId ?? "all"}`,
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
      logger.error("Error fetching daily schedule", { userId, error });
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

  async function resolveSupportContact(): Promise<SupportContactReturnType | null> {
    const staffProfileId = await SystemSettingsRepository.getStringValue(
      "teacher_support_contact_staff_profile_id",
      ""
    );
    if (!staffProfileId) return null;
    const staffRow = await StaffProfileRepository.findByStaffProfileId(staffProfileId);
    if (!staffRow) return null;
    return {
      id: staffRow.staffProfileId,
      name: staffRow.name,
      role: staffRow.roleName,
      avatarUrl: staffRow.avatarUrl,
      phone: staffRow.phone,
    };
  }

  async function mapFutureClassItem(
    cls: FutureClassRow,
    now: Date,
    usedLeaves: number,
    maxLeaves: number,
    tErrors: ErrorsLabels
  ) {
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

    const resolvedClassType = parseClassTypeOrNull(cls.classType);
    const effectiveMeeting = await EffectiveMeetingService.resolveForClassInstance(cls.id, tErrors);

    return {
      id: cls.id,
      courseName: cls.subjectName ?? cls.studentName,
      scheduledDate: cls.scheduledStartAt.toISOString().split("T")[0],
      startTime: formatTime(cls.scheduledStartAt),
      endTime: formatTime(cls.scheduledEndAt),
      durationMinutes: cls.durationMinutes,
      isRescheduled: cls.isRescheduled,
      leaveRequestDisabled,
      leaveRequestDisabledReason,
      studentCount: 1,
      location: effectiveMeeting.joinUrl ?? "Virtual",
      subjectId: cls.subjectId,
      subjectName: cls.subjectName,
      classType: resolvedClassType,
      meetingJoinUrl: effectiveMeeting.joinUrl ?? null,
      effectiveMeeting,
      executionState: cls.executionState ?? null,
      outcome: cls.outcome ?? null,
      avatarUrl: resolveClassAvatarUrl(cls.recurringAvatarUrl, cls.subjectAvatarUrl),
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
