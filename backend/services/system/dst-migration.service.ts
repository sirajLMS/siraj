import type { DBTransaction } from "@/backend/db/db.types";
import { DstMigrationRepository } from "@/backend/db/repo";
import { AppPermission, DstMigrationResult, MigrationStatus } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  DstCheckedEmptyItemReturnType,
  DstConflictGroupReturnType,
  DstConflictItemReturnType,
  DstMigrationEntrySelectType,
  DstMigrationReportReturnType,
  DstMigrationRunSelectType,
  DstUpdatedSessionReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace DstMigrationService {
  async function ensurePermission(actorUserId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SYSTEM_BULK_UPDATE_DST);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }
  }

  function computeNewStartTime(defaultStartTime: string, offsetMinutes: number): string {
    const [hoursStr, minutesStr] = defaultStartTime.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    const totalMinutes = hours * 60 + minutes + offsetMinutes;
    const newHours = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
    const newMinutes = ((totalMinutes % 60) + 60) % 60;
    return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:00`;
  }

  async function processSchedule(
    schedule: Awaited<ReturnType<typeof DstMigrationRepository.getActiveRecurringSchedules>>[number],
    runId: string,
    offsetMinutes: number,
    tx: Parameters<Parameters<typeof DstMigrationRepository.runTransaction>[0]>[0]
  ): Promise<
    | { kind: "unchanged"; item: DstCheckedEmptyItemReturnType }
    | { kind: "conflict"; teacherName: string; item: DstConflictItemReturnType; detail: string }
    | { kind: "updated"; session: DstUpdatedSessionReturnType }
  > {
    if (schedule.utcOffsetSnapshot === null) {
      await DstMigrationRepository.recordMigrationEntry(runId, schedule.id, DstMigrationResult.UNCHANGED, null, tx);
      return {
        kind: "unchanged",
        item: {
          id: schedule.id,
          studentName: schedule.studentName,
          reason: `No DST offset configured for timezone ${schedule.timezone}`,
        },
      };
    }

    const newOffset = schedule.utcOffsetSnapshot + offsetMinutes;
    const newStartTime = computeNewStartTime(schedule.defaultStartTime, offsetMinutes);

    const conflictingSchedules = await DstMigrationRepository.checkConflictingSchedules(
      schedule.teacherId,
      newStartTime,
      tx
    );

    if (conflictingSchedules.length > 0 && conflictingSchedules[0].id !== schedule.id) {
      const conflictDetail = `Conflict with schedule ${conflictingSchedules[0].id} at ${newStartTime}`;
      const conflictItem: DstConflictItemReturnType = {
        id: schedule.id,
        studentName: schedule.studentName,
        message: conflictDetail,
      };
      await DstMigrationRepository.recordMigrationEntry(
        runId,
        schedule.id,
        DstMigrationResult.CONFLICT,
        conflictDetail,
        tx
      );
      return { kind: "conflict", teacherName: schedule.teacherName, item: conflictItem, detail: conflictDetail };
    }

    await DstMigrationRepository.updateRecurringScheduleTime(schedule.id, newStartTime, newOffset, tx);
    await DstMigrationRepository.recordMigrationEntry(runId, schedule.id, DstMigrationResult.UPDATED, null, tx);
    return {
      kind: "updated",
      session: {
        id: schedule.id,
        studentId: schedule.studentId,
        teacherId: schedule.teacherId,
        studentName: schedule.studentName,
        teacherName: schedule.teacherName,
        fromTime: schedule.defaultStartTime,
        toTime: newStartTime,
      },
    };
  }

  function buildConflictGroups(
    conflictByTeacher: Map<string, DstConflictItemReturnType[]>
  ): DstConflictGroupReturnType[] {
    return Array.from(conflictByTeacher.entries()).map(([teacherName, conflicts], index) => ({
      id: `conflict-group-${index}`,
      teacherName,
      conflicts,
    }));
  }

  export async function executeBulkDstUpdate(
    actorUserId: string,
    offsetMinutes: number,
    description: string,
    tErrors: ErrorsLabels
  ): Promise<DstMigrationReportReturnType> {
    await ensurePermission(actorUserId, tErrors);

    return DstMigrationRepository.runTransaction(async tx => {
      const run = await DstMigrationRepository.createMigrationRun(actorUserId, offsetMinutes, description, tx);

      const schedules = await DstMigrationRepository.getActiveRecurringSchedules(tx);

      let updatedCount = 0;
      let conflictCount = 0;
      let unchangedCount = 0;

      const updatedSessions: DstUpdatedSessionReturnType[] = [];
      const checkedEmptyItems: DstCheckedEmptyItemReturnType[] = [];
      const conflictByTeacher = new Map<string, DstConflictItemReturnType[]>();

      async function processNext(index: number): Promise<void> {
        if (index >= schedules.length) return;
        const result = await processSchedule(schedules[index], run.id, offsetMinutes, tx);

        if (result.kind === "unchanged") {
          unchangedCount++;
          checkedEmptyItems.push(result.item);
        } else if (result.kind === "conflict") {
          conflictCount++;
          const existing = conflictByTeacher.get(result.teacherName) ?? [];
          existing.push(result.item);
          conflictByTeacher.set(result.teacherName, existing);
        } else {
          updatedCount++;
          updatedSessions.push(result.session);
        }
        return processNext(index + 1);
      }
      await processNext(0);

      const conflictGroups = buildConflictGroups(conflictByTeacher);

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
  export async function findMigrationRunByUserId(
    runByUserId: string,
    tx?: DBTransaction
  ): Promise<DstMigrationRunSelectType | null> {
    return DstMigrationRepository.findRunByUserId(runByUserId, tx);
  }

  export async function createMigrationRun(
    runByUserId: string,
    offsetMinutes: number,
    description: string,
    tx?: DBTransaction
  ): Promise<DstMigrationRunSelectType> {
    return DstMigrationRepository.createMigrationRun(runByUserId, offsetMinutes, description, tx);
  }

  export async function findMigrationEntriesByScheduleIds(
    scheduleIds: readonly string[],
    tx?: DBTransaction
  ): Promise<DstMigrationEntrySelectType[]> {
    return DstMigrationRepository.findEntriesByScheduleIds(scheduleIds, tx);
  }

  export async function createManyMigrationEntries(
    inputs: {
      runId: string;
      recurringScheduleId: string;
      result: DstMigrationResult;
      conflictDetail: string | null;
    }[],
    tx?: DBTransaction
  ): Promise<DstMigrationEntrySelectType[]> {
    return DstMigrationRepository.createManyEntries(inputs, tx);
  }
}
