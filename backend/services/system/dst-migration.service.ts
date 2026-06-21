import { DstMigrationRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, DstMigrationResult } from "@/shared/lib/enum";

export interface DstMigrationReport {
  readonly runId: string;
  readonly updated: number;
  readonly conflicts: number;
  readonly unchanged: number;
  readonly total: number;
}

export namespace DstMigrationService {
  /**
   * Executes a global DST adjustment across all recurring schedules.
   * Requires: system.bulk_update_dst permission (System Admin only).
   */
  export async function executeBulkDstUpdate(
    actorUserId: string,
    offsetMinutes: number,
    description: string,
    locale?: string
  ): Promise<DstMigrationReport> {
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

      for (const schedule of schedules) {
        if (schedule.utcOffsetSnapshot === null) {
          unchangedCount++;
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
          await DstMigrationRepository.recordMigrationEntry(
            run.id,
            schedule.id,
            DstMigrationResult.CONFLICT,
            `Conflict with schedule ${conflictingSchedules[0].id} at ${newStartTime}`,
            tx
          );
        } else {
          await DstMigrationRepository.updateRecurringScheduleTime(schedule.id, newStartTime, newOffset, tx);

          updatedCount++;
          await DstMigrationRepository.recordMigrationEntry(run.id, schedule.id, DstMigrationResult.UPDATED, null, tx);
        }
      }

      return {
        runId: run.id,
        updated: updatedCount,
        conflicts: conflictCount,
        unchanged: unchangedCount,
        total: schedules.length,
      };
    });
  }
}
