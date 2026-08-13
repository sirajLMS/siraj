import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { RecurringScheduleDetailReturnType, RecurringScheduleSelectType } from "@/backend/types";
import { parseIanaTimezone } from "@/shared/lib/enum";
import type { ErrorsLabels } from "@/shared/locale";

/**
 * Repository returns rows with studentName and teacherUserName attached via Object.assign
 * but typed as RecurringScheduleSelectType[]. This type represents the actual shape.
 */
type RecurringScheduleRepositoryRow = RecurringScheduleSelectType & {
  studentName: string;
  teacherUserName: string;
};

type RecurringScheduleListRow = RecurringScheduleSelectType & {
  studentName: string;
  teacherUserName: string;
};

/**
 * Type guard to check if a RecurringScheduleSelectType row has the extended properties
 * attached by the repository via Object.assign.
 */
function isRecurringScheduleRepositoryRow(row: RecurringScheduleSelectType): row is RecurringScheduleRepositoryRow {
  return (
    typeof row === "object" &&
    "studentName" in row &&
    "teacherUserName" in row &&
    typeof (row as Record<string, unknown>).studentName === "string" &&
    typeof (row as Record<string, unknown>).teacherUserName === "string"
  );
}

export namespace RecurringScheduleDetailService {
  async function assertViewAccess(userId: string, teacherId: string, tErrors: ErrorsLabels) {
    const canManageClass = await PermissionsService.hasPermission(userId, AppPermission.MEETING_CONFIGS_MANAGE_CLASS);
    const canViewAll = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_ALL);

    if (canManageClass || canViewAll) {
      return;
    }

    const actorTeacher = await TeacherRepository.findByUserId(userId);
    if (actorTeacher?.id === teacherId) {
      return;
    }

    throw new Error(tErrors.unauthorizedAction);
  }

  export async function getDetail(
    userId: string,
    recurringScheduleId: string,
    tErrors: ErrorsLabels
  ): Promise<RecurringScheduleDetailReturnType> {
    const row = await RecurringScheduleRepository.findById(recurringScheduleId);
    if (!row) {
      throw new Error(tErrors.notFound);
    }

    await assertViewAccess(userId, row.schedule.teacherId, tErrors);

    const dayRows = await RecurringScheduleRepository.findDaysByScheduleId(recurringScheduleId);

    return {
      id: row.schedule.id,
      studentId: row.schedule.studentId,
      studentName: row.studentName,
      teacherId: row.schedule.teacherId,
      teacherName: row.teacherUserName,
      durationMinutes: row.schedule.durationMinutes,
      defaultStartTime: row.schedule.defaultStartTime.slice(0, 5),
      timezone: parseIanaTimezone(row.schedule.timezone),
      days: dayRows.map(day => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime.slice(0, 5),
        isActive: day.isActive,
      })),
      hourlyRate: row.schedule.hourlyRate,
      rateCurrency: row.schedule.rateCurrency,
    };
  }

  export async function listAll(
    userId: string,
    tErrors: ErrorsLabels,
    options?: {
      page?: number;
      pageSize?: number;
      search?: string;
    }
  ): Promise<{ rows: RecurringScheduleListRow[]; totalCount: number }> {
    const canViewList = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_LIST);
    const canViewAll = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_VIEW_ALL);

    if (!canViewList && !canViewAll) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const result = await RecurringScheduleRepository.findAll(undefined, options);
    // Repository returns rows with studentName and teacherUserName attached via Object.assign
    // but typed as RecurringScheduleSelectType[]. Use type guard to narrow safely.
    const rows: RecurringScheduleListRow[] = result.rows.map(row => {
      if (!isRecurringScheduleRepositoryRow(row)) {
        // Should never happen if repository is correct, but fallback for safety
        return {
          ...row,
          studentName: "",
          teacherUserName: "",
        } satisfies RecurringScheduleListRow;
      }
      return {
        id: row.id,
        studentId: row.studentId,
        teacherId: row.teacherId,
        subjectId: row.subjectId,
        avatarUrl: row.avatarUrl,
        durationMinutes: row.durationMinutes,
        defaultStartTime: row.defaultStartTime,
        timezoneId: row.timezoneId,
        timezone: row.timezone,
        utcOffsetSnapshot: row.utcOffsetSnapshot,
        hourlyRate: row.hourlyRate,
        rateCurrency: row.rateCurrency,
        effectiveFrom: row.effectiveFrom,
        effectiveUntil: row.effectiveUntil,
        quotaId: row.quotaId,
        earmarkedClasses: row.earmarkedClasses,
        schedulingMode: row.schedulingMode,
        generationHorizonWeeks: row.generationHorizonWeeks,
        ondemandNoCreditsOutcome: row.ondemandNoCreditsOutcome,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        studentName: row.studentName,
        teacherUserName: row.teacherUserName,
      } satisfies RecurringScheduleListRow;
    });
    return {
      rows,
      totalCount: result.totalCount,
    };
  }
}
