import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { AppPermission } from "@/backend/enum";
import { parseIanaTimezone } from "@/backend/lib/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { RecurringScheduleSelectType } from "@/backend/types";
import type { RecurringScheduleDetailReturnType } from "@/backend/types/scheduling/recurring-schedule-detail.types";
import type { ErrorsLabels } from "@/shared/locale";

type RecurringScheduleListRow = RecurringScheduleSelectType & {
  studentName: string;
  teacherUserName: string;
};

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
      defaultStartTime: String(row.schedule.defaultStartTime).slice(0, 5),
      timezone: parseIanaTimezone(row.schedule.timezone),
      days: dayRows.map(day => ({
        id: day.id,
        dayOfWeek: day.dayOfWeek,
        startTime: String(day.startTime).slice(0, 5),
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

    return RecurringScheduleRepository.findAll(undefined, options) as Promise<{
      rows: RecurringScheduleListRow[];
      totalCount: number;
    }>;
  }
}
