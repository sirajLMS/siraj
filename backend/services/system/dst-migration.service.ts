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
import { AppPermission, DstMigrationResult, MigrationStatus } from "@/shared/lib/enum";

const VALID_DST_OFFSETS = [-120, -90, -60, -45, -30, 30, 45, 60, 90, 120];

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

    if (offsetMinutes === 0 || !VALID_DST_OFFSETS.includes(offsetMinutes)) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("invalidDstOffset", { offset: offsetMinutes }));
    }

    return DstMigrationRepository.runTransaction(async tx => {
      await DstMigrationRepository.acquireMigrationLock(offsetMinutes, tx);
      const recentRun = await DstMigrationRepository.getRecentMigrationRun(offsetMinutes, tx);
      if (recentRun) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(
          tFunc("dstMigrationAlreadyRun", { offset: offsetMinutes, date: recentRun.createdAt.toISOString() })
        );
      }

      const run = await DstMigrationRepository.createMigrationRun(actorUserId, offsetMinutes, description, tx);

      const schedules = await DstMigrationRepository.getActiveRecurringSchedules(tx);

      let updatedCount = 0;
      let conflictCount = 0;
      let unchangedCount = 0;

      const updatedSessions: DstUpdatedSessionReturnType[] = [];
      const checkedEmptyItems: DstCheckedEmptyItemReturnType[] = [];

      const conflictByTeacher = new Map<string, DstConflictItemReturnType[]>();

      const migrationEntries: Array<{
        runId: string;
        recurringScheduleId: string;
        result: DstMigrationResult;
        conflictDetail: string | null;
      }> = [];
      const scheduleUpdates: Array<{
        scheduleId: string;
        newStartTime: string;
        newOffset: number;
      }> = [];

      const plannedTimes = new Map<string, string>();
      for (const schedule of schedules) {
        if (schedule.utcOffsetSnapshot === null) continue;
        const [hoursStr, minutesStr] = schedule.defaultStartTime.split(":");
        const hours = Number(hoursStr);
        const minutes = Number(minutesStr);
        const totalMinutes = hours * 60 + minutes + offsetMinutes;
        const newHours = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
        const newMinutes = ((totalMinutes % 60) + 60) % 60;
        const newStartTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:00`;
        plannedTimes.set(schedule.id, newStartTime);
      }

      const finalTimeMap = new Map<string, string[]>();
      for (const schedule of schedules) {
        if (schedule.utcOffsetSnapshot === null) {
          const key = `${schedule.teacherId}:${schedule.defaultStartTime}`;
          const existing = finalTimeMap.get(key) ?? [];
          existing.push(schedule.id);
          finalTimeMap.set(key, existing);
        } else {
          const newTime = plannedTimes.get(schedule.id) ?? schedule.defaultStartTime;
          const key = `${schedule.teacherId}:${newTime}`;
          const existing = finalTimeMap.get(key) ?? [];
          existing.push(schedule.id);
          finalTimeMap.set(key, existing);
        }
      }

      for (const schedule of schedules) {
        if (schedule.utcOffsetSnapshot === null) {
          unchangedCount++;
          checkedEmptyItems.push({
            id: schedule.id,
            studentName: schedule.studentName,
            reason: `No DST offset configured for timezone ${schedule.timezone}`,
          });
          migrationEntries.push({
            runId: run.id,
            recurringScheduleId: schedule.id,
            result: DstMigrationResult.UNCHANGED,
            conflictDetail: null,
          });
          continue;
        }

        const newStartTime = plannedTimes.get(schedule.id) ?? schedule.defaultStartTime;
        const currentOffset = schedule.utcOffsetSnapshot;
        const newOffset = currentOffset + offsetMinutes;
        const mapKey = `${schedule.teacherId}:${newStartTime}`;
        const schedulesAtTime = finalTimeMap.get(mapKey) ?? [];
        const isConflict = schedulesAtTime.length > 1 && schedulesAtTime.includes(schedule.id);

        if (isConflict) {
          conflictCount++;
          const conflictDetail = `Conflict: ${schedulesAtTime.length} schedules at ${newStartTime} for same teacher`;
          const conflictItem: DstConflictItemReturnType = {
            id: schedule.id,
            studentName: schedule.studentName,
            message: conflictDetail,
          };

          const existing = conflictByTeacher.get(schedule.teacherName) ?? [];
          existing.push(conflictItem);
          conflictByTeacher.set(schedule.teacherName, existing);

          migrationEntries.push({
            runId: run.id,
            recurringScheduleId: schedule.id,
            result: DstMigrationResult.CONFLICT,
            conflictDetail,
          });
        } else {
          scheduleUpdates.push({
            scheduleId: schedule.id,
            newStartTime,
            newOffset,
          });

          updatedCount++;
          updatedSessions.push({
            id: schedule.id,
            studentName: schedule.studentName,
            teacherName: schedule.teacherName,
            fromTime: schedule.defaultStartTime,
            toTime: newStartTime,
          });
          migrationEntries.push({
            runId: run.id,
            recurringScheduleId: schedule.id,
            result: DstMigrationResult.UPDATED,
            conflictDetail: null,
          });
        }
      }

      await DstMigrationRepository.updateRecurringScheduleTimesBatch(scheduleUpdates, tx);
      await DstMigrationRepository.recordMigrationEntries(migrationEntries, tx);

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
        status: MigrationStatus.COMPLETE,
      };
    });
  }
}
