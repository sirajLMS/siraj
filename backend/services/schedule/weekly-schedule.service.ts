import {
  getWeeklyScheduleGrid,
  getWeeklyWorkloadMetrics,
} from "@/backend/db/repo/scheduling/scheduling-queries.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { parseClassExecutionState, parseClassOutcome, parseClassType } from "@/backend/lib/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export namespace WeeklyScheduleService {
  function getWeekBoundaries(date: Date): { weekStart: Date; weekEnd: Date } {
    const d = new Date(date);
    const day = d.getUTCDay();
    // Monday is start of week in UTC
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const weekStart = new Date(d);
    weekStart.setUTCDate(d.getUTCDate() + diffToMonday);
    weekStart.setUTCHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 7);
    return { weekStart, weekEnd };
  }

  async function resolveTeacherId(userId: string, requestedTeacherId: string | null, locale?: string): Promise<string> {
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

  export async function getWeeklySchedule(userId: string, teacherId: string | null, weekDate: string, locale?: string) {
    try {
      const hasWeeklyAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_WEEKLY);
      if (!hasWeeklyAccess) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      const resolvedTeacherId = await resolveTeacherId(userId, teacherId, locale);
      const targetDate = new Date(weekDate);
      const { weekStart, weekEnd } = getWeekBoundaries(targetDate);

      const rows = await getWeeklyScheduleGrid(resolvedTeacherId, weekStart, weekEnd);

      return {
        id: `weekly-schedule-${resolvedTeacherId}-${weekStart.toISOString()}`,
        teacherId: resolvedTeacherId,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        classes: rows.map(row => ({
          id: row.id,
          studentName: row.studentName,
          studentId: row.studentId,
          duration: row.durationMinutes,
          startTime: row.scheduledStartAt.toLocaleTimeString(locale ? getLatnLocaleTag(locale) : "en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: IanaTimezone.UTC,
          }),
          day: row.dayOfWeek,
          executionState: parseClassExecutionState(row.executionState),
          outcome: parseClassOutcome(row.outcome),
          subjectId: row.subjectId,
          subjectName: row.subjectName,
          classType: parseClassType(row.classType),
        })),
      };
    } catch (error) {
      logger.error("Error fetching weekly schedule", { userId, teacherId, error });
      throw error;
    }
  }

  export async function getWorkloadMetrics(
    userId: string,
    teacherId: string | null,
    weekDate: string,
    locale?: string
  ) {
    try {
      const hasWorkloadAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_WORKLOAD);
      if (!hasWorkloadAccess) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedViewMetrics"));
      }

      const resolvedTeacherId = await resolveTeacherId(userId, teacherId, locale);
      const targetDate = new Date(weekDate);
      const { weekStart, weekEnd } = getWeekBoundaries(targetDate);

      const metrics = await getWeeklyWorkloadMetrics(resolvedTeacherId, weekStart, weekEnd);

      return {
        id: `workload-${resolvedTeacherId}-${weekStart.toISOString()}`,
        weeklyHoursWorked: metrics.totalHoursFormatted,
        totalMinutes: metrics.totalMinutes,
        classCount: metrics.classCount,
      };
    } catch (error) {
      logger.error("Error fetching workload metrics", { userId, teacherId, error });
      throw error;
    }
  }
}
