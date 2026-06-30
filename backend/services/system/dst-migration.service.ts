import { DstMigrationRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  DstCheckedEmptyItemReturnType,
  DstConflictGroupReturnType,
  DstConflictItemReturnType,
  DstMigrationReportReturnType,
  DstUpdatedSessionReturnType,
} from "@/backend/types";
import { AppPermission, DstMigrationResult, type MigrationStatus } from "@/shared/lib/enum";

export namespace DstMigrationService {
  export async function executeBulkDstUpdate(
    actorUserId: string,
    offsetMinutes: number,
    description: string,
    locale?: string
  ): Promise<DstMigrationReportReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SYSTEM_BULK_UPDATE_DST);
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    return DstMigrationRepository.runTransaction(async tx => {
      const run = await DstMigrationRepository.createMigrationRun(actorUserId, offsetMinutes, description, tx);

      const schedules = await DstMigrationRepository.getActiveRecurringSchedules(tx);

      let updatedCount = 0;
      let conflictCount = 0;
      let unchangedCount = 0;

      const updatedSessions: DstUpdatedSessionReturnType[] = [];
      const checkedEmptyItems: DstCheckedEmptyItemReturnType[] = [];

      const conflictByTeacher = new Map<string, DstConflictItemReturnType[]>();

      for (const schedule of schedules) {
        if (schedule.utcOffsetSnapshot === null) {
          unchangedCount++;
          checkedEmptyItems.push({
            id: schedule.id,
            studentName: schedule.studentName,
            reason: `No DST offset configured for timezone ${schedule.timezone}`,
          });
          await DstMigrationRepository.recordMigrationEntry(
            run.id,
            schedule.id,
            DstMigrationResult.UNCHANGED,
            null,
            tx
          );
          continue;
        }

        const currentOffset = schedule.utcOffsetSnapshot;
        const newOffset = currentOffset + offsetMinutes;

        const [hoursStr, minutesStr] = schedule.defaultStartTime.split(":");
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const totalMinutes = hours * 60 + minutes + offsetMinutes;
        const newHours = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
        const newMinutes = ((totalMinutes % 60) + 60) % 60;
        const newStartTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:00`;

        const conflictingSchedules = await DstMigrationRepository.checkConflictingSchedules(
          schedule.teacherId,
          newStartTime,
          tx
        );

        if (conflictingSchedules.length > 0 && conflictingSchedules[0].id !== schedule.id) {
          conflictCount++;
          const conflictDetail = `Conflict with schedule ${conflictingSchedules[0].id} at ${newStartTime}`;
          const conflictItem: DstConflictItemReturnType = {
            id: schedule.id,
            studentName: schedule.studentName,
            message: conflictDetail,
          };

          const existing = conflictByTeacher.get(schedule.teacherName) ?? [];
          existing.push(conflictItem);
          conflictByTeacher.set(schedule.teacherName, existing);

          await DstMigrationRepository.recordMigrationEntry(
            run.id,
            schedule.id,
            DstMigrationResult.CONFLICT,
            conflictDetail,
            tx
          );
        } else {
          await DstMigrationRepository.updateRecurringScheduleTime(schedule.id, newStartTime, newOffset, tx);

          updatedCount++;
          updatedSessions.push({
            id: schedule.id,
            studentName: schedule.studentName,
            teacherName: schedule.teacherName,
            fromTime: schedule.defaultStartTime,
            toTime: newStartTime,
          });
          await DstMigrationRepository.recordMigrationEntry(run.id, schedule.id, DstMigrationResult.UPDATED, null, tx);
        }
      }

      const conflictGroups: DstConflictGroupReturnType[] = Array.from(conflictByTeacher.entries()).map(
        ([teacherName, conflicts], index) => ({
          id: `conflict-group-${index}`,
          teacherName,
          conflicts,
        })
      );

      return {
        id: run.id,
        runId: run.id,
        updated: updatedCount,
        conflicts: conflictCount,
        unchanged: unchangedCount,
        total: schedules.length,
        updatedSessions,
        conflictGroups,
        checkedEmptyItems,
        status: "complete" as MigrationStatus,
      };
    });
  }
}
