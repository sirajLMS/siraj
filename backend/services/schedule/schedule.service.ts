import { ParentRepository } from "@/backend/db/repo/parent.repository";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import type { DailyScheduleResult } from "@/backend/db/repo/scheduling/scheduling-queries.repository";
import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";
import { SystemSettingsRepository } from "@/backend/db/repo/system-settings.repository";
import { TeacherRepository } from "@/backend/db/repo/teacher.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { TeacherNotesService } from "@/backend/services/subject/teacher-notes.service";
import type {
  PaginationArgs,
  RescheduleTrackingInput,
  SupportContactReturnType,
  TeacherFutureScheduleReturnType,
  TeacherImportantNoteReturnType,
} from "@/backend/types";
import { AppPermission, type ClassExecutionState, type ClassOutcome, type ClassType } from "@/shared/lib/enum";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export namespace ScheduleService {
  async function resolveViewerTimezone(userId: string): Promise<string> {
    const teacher = await TeacherRepository.findByUserId(userId);
    if (teacher?.timezone) return teacher.timezone;

    const parent = await ParentRepository.findByUserId(userId);
    if (parent?.timezone) return parent.timezone;

    return await SystemSettingsRepository.getStringValue("default_timezone", "UTC");
  }

  async function mapDailyScheduleListItem(item: DailyScheduleResult, locale?: string) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    const unknownName = t("unknownName");
    return {
      id: item.id,
      studentTime: item.scheduledStartAt.toISOString(),
      teacherTime: item.scheduledStartAt.toISOString(),
      yourTime: item.yourTimeFormatted || item.scheduledStartAt.toISOString(),
      duration: item.durationMinutes,
      scheduledStartAt: item.scheduledStartAt,
      scheduledEndAt: item.scheduledEndAt,
      status: (item.outcome || item.executionState) as ClassExecutionState,
      outcome: item.outcome as ClassOutcome,
      executionState: item.executionState as ClassExecutionState,
      student: { id: item.studentId, name: item.student?.name || unknownName },
      teacher: { id: item.teacherId, name: item.teacher?.user?.name || unknownName },
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
        locale,
      });

      const mappedRows = await Promise.all(rows.map(row => mapDailyScheduleListItem(row, locale)));

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

      return await Promise.all(list.map(item => mapDailyScheduleListItem(item, locale)));
    } catch (error) {
      logger.error("Error fetching daily schedule", { userId, error });
      throw error;
    }
  }

  export async function getRescheduleTracking(
    userId: string,
    input: RescheduleTrackingInput,
    pagination: PaginationArgs | null = null,
    locale?: string
  ) {
    const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SESSION_RESCHEDULE);
    if (!isAuthorized) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return SchedulingRepository.getRescheduleTrackingRows(input, pagination);
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

  async function resolveTeacherId(
    userId: string,
    requestedTeacherId: string | null | undefined,
    locale?: string
  ): Promise<string> {
    const isAdmin = await PermissionsService.hasAnyPermission(userId, [
      AppPermission.STAFF_VIEW_DIRECTORY,
      AppPermission.SCHEDULE_VIEW_ALL,
    ]);

    if (isAdmin && requestedTeacherId) {
      return requestedTeacherId;
    }

    const actorTeacher = await TeacherRepository.findByUserId(userId);
    if (actorTeacher) {
      return actorTeacher.id;
    }

    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  export async function getTeacherFutureSchedule(
    userId: string,
    teacherId?: string,
    locale?: string
  ): Promise<TeacherFutureScheduleReturnType> {
    const resolvedTeacherId = await resolveTeacherId(userId, teacherId ?? null, locale);

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
        date.toLocaleTimeString(locale ? getLatnLocaleTag(locale) : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });

      return {
        id: cls.id,
        courseName: cls.subjectName || cls.studentName,
        scheduledDate: cls.scheduledStartAt.toISOString().split("T")[0],
        startTime: formatTime(cls.scheduledStartAt),
        endTime: formatTime(cls.scheduledEndAt),
        durationMinutes: cls.durationMinutes,
        isRescheduled: cls.isRescheduled,
        leaveRequestDisabled,
        leaveRequestDisabledReason,
        studentCount: 1,
        location: cls.zoomMeetingUrl || "Virtual",
        subjectId: cls.subjectId,
        subjectName: cls.subjectName,
        classType: cls.classType as ClassType | null | undefined,
        zoomMeetingUrl: cls.zoomMeetingUrl ?? null,
      };
    });

    const [importantNotes, supportContact] = await Promise.all([
      TeacherNotesService.getActiveNotes(userId, resolvedTeacherId, locale).catch(
        (): TeacherImportantNoteReturnType[] => []
      ),
      (async (): Promise<SupportContactReturnType | null> => {
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
          skypeId: staffRow.skypeId,
        };
      })(),
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
