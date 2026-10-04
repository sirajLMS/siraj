import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission } from "@/backend/enum";
import { DomainError, NotFoundError, UnauthorizedError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { createScheduleAndDeductCredits } from "@/backend/services/schedule/recurring-class.creation.helpers";
import { dispatchClassScheduledNotifications } from "@/backend/services/schedule/recurring-class.notifications.helpers";
import { validateCreateRecurringClass } from "@/backend/services/schedule/recurring-class.validation.helpers";
import type {
  CreateRecurringClassInput,
  DBTransaction,
  RecurringScheduleDaySelectType,
  RecurringScheduleDayUpsertInput,
  RecurringScheduleSelectType,
  RecurringScheduleUpsertInput,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

export namespace RecurringClassService {
  export async function createRecurringClass(userId: string, input: CreateRecurringClassInput, tErrors: ErrorsLabels) {
    try {
      await validateCreateRecurringClass(userId, input, tErrors);

      const result = await createScheduleAndDeductCredits(userId, input, tErrors);

      // App-layer SQLite fallback for the PG-only hours-per-week recalculation triggers.
      // On PG the triggers auto-recalc students.hours_per_week; on SQLite this is a no-op.
      await StudentRepository.recalcHoursPerWeekIfSqlite(input.studentId).catch(error => {
        logger.error("Failed to recalc student hours_per_week (SQLite fallback)", {
          studentId: input.studentId,
          recurringScheduleId: result.recurringScheduleId,
          error: error instanceof Error ? error.message : String(error),
        });
      });

      await dispatchClassScheduledNotifications(result.classInstanceIds, input.studentId, input.locale);

      // Best-effort meeting URL generation — never fails the booking. Each
      // instance is generated independently, so they are dispatched in
      // parallel; per-instance try/catch keeps any single failure isolated.
      await Promise.allSettled(
        result.classInstanceIds.map(async instanceId => {
          try {
            await MeetingConfigSnapshotService.generateAndAttachForClassInstance(instanceId);
          } catch (error) {
            logger.error("Booking-time meeting URL generation failed for class instance", {
              classInstanceId: instanceId,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
      );

      // Query the first instance's join_url to expose meetingUrl in the result.
      // Null when no provider resolved or meeting URL generation was skipped.
      let meetingUrl: string | null = null;
      if (result.classInstanceIds.length > 0) {
        const instanceMap = await SchedulingRepository.getClassInstancesByIds([result.classInstanceIds[0]]);
        const firstInstance = instanceMap.get(result.classInstanceIds[0]);
        meetingUrl = firstInstance?.meetingJoinUrl ?? null;
      }

      return {
        id: result.recurringScheduleId,
        recurringScheduleId: result.recurringScheduleId,
        classInstanceIds: result.classInstanceIds,
        classInstanceCount: result.classInstanceIds.length,
        meetingUrl,
      };
    } catch (error) {
      if (error instanceof DomainError) {
        logger.logDomainError("Validation or business rule error creating recurring class", {
          userId,
          error: error.message,
        });
      } else {
        logger.error("Error creating recurring class", { userId, input, error });
      }
      throw error;
    }
  }

  export async function upsertManyRecurringSchedules(
    inputs: readonly RecurringScheduleUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleSelectType[]> {
    return RecurringScheduleRepository.upsertMany(inputs, tx);
  }

  export async function upsertManyScheduleDays(
    inputs: readonly RecurringScheduleDayUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleDaySelectType[]> {
    return RecurringScheduleRepository.upsertManyDays(inputs, tx);
  }

  /**
   * Update the recurring-class-level hourly rate on an existing recurring
   * schedule. Only affects the `recurring_schedules` row — already-generated
   * `class_instances` keep their booking-time snapshot (frozen). New instances
   * generated after this call will pick up the new rate.
   */
  export async function updateRecurringClassRate(
    userId: string,
    input: { recurringScheduleId: string; hourlyRate: string | null; rateCurrency: CurrencyCode | null },
    tErrors: ErrorsLabels
  ): Promise<{ recurringScheduleId: string; hourlyRate: string | null; rateCurrency: CurrencyCode | null }> {
    const hasManageAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
    if (!hasManageAccess) {
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }

    const updated = await RecurringScheduleRepository.updateRate(
      input.recurringScheduleId,
      input.hourlyRate,
      input.rateCurrency
    );
    if (!updated) {
      throw new NotFoundError("RECURRING_SCHEDULE", tErrors.notFound);
    }
    return {
      recurringScheduleId: updated.id,
      hourlyRate: updated.hourlyRate,
      rateCurrency: updated.rateCurrency,
    };
  }
}
