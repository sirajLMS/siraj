import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import {
  type RecurringScheduleDayUpsertInput,
  RecurringScheduleRepository,
  type RecurringScheduleUpsertInput,
  type ScheduleDayKey,
} from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { students } from "@/backend/db/schema";
import { AppPermission, type IanaTimezone, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import type { RecurringScheduleDayEntity, RecurringScheduleEntity } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export interface CreateRecurringClassInput {
  studentId: string;
  teacherId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: IanaTimezone;
  timezoneId?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  days: {
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    startTime: string;
    isActive: boolean;
  }[];
  classType?: "REGULAR" | "TRIAL" | "ADVANCE";
  generateInstancesForWeeks?: number;
  /** Optional locale forwarded to `dispatchWithPreferences` for i18n. */
  locale?: string;
}

export namespace RecurringClassService {
  /**
   * Resolve the student display name for the `metadata.studentName` channel
   * of `buildClassLifecyclePayloads`. The pure builder never reads the DB
   * (specs.md §5.1), so the parent of all instances in this recurring
   * schedule is fetched once here and threaded into every dispatch.
   */
  async function resolveStudentName(studentId: string): Promise<string> {
    const [row] = await db.select({ name: students.name }).from(students).where(eq(students.id, studentId)).limit(1);
    return row?.name ?? "—";
  }

  /**
   * Fire `CLASS_SCHEDULED` notifications for each newly-created instance.
   * Errors are caught per-instance so one dispatch failure does NOT surface
   * as a 500 to callers that just successfully created the recurring class
   * (specs.md "Dispatch failures must NOT throw out of the action").
   *
   * The affected-user triplet is the same parent + teacher for every
   * instance in this recurring schedule, so it is resolved once from the
   * first instance and reused — saving `N` extra join queries.
   */
  async function dispatchClassScheduledNotifications(
    classInstanceIds: readonly string[],
    studentId: string,
    locale?: string
  ): Promise<void> {
    const firstInstanceId = classInstanceIds[0];
    if (!firstInstanceId) return;

    let affected: Awaited<ReturnType<typeof SchedulingRepository.getClassInstanceAffectedUsers>>;
    let studentName: string;
    try {
      affected = await SchedulingRepository.getClassInstanceAffectedUsers(firstInstanceId);
      studentName = await resolveStudentName(studentId);
    } catch (error) {
      logger.error("Class scheduled notification setup failed", {
        firstInstanceId,
        error: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    if (!affected) return;

    for (const instanceId of classInstanceIds) {
      try {
        const instance = await SchedulingRepository.getClassInstanceById(instanceId);
        if (!instance) continue;

        const payloads = buildClassLifecyclePayloads(
          instance,
          NotificationEventType.CLASS_SCHEDULED,
          [affected.parentUserId, affected.teacherUserId],
          locale,
          { studentName }
        );
        await dispatchWithPreferences(payloads, [affected.parentUserId, affected.teacherUserId], locale);
      } catch (error) {
        logger.error("Class scheduled notification dispatch failed", {
          classInstanceId: instanceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  export async function createRecurringClass(userId: string, input: CreateRecurringClassInput, tErrors: ErrorsLabels) {
    try {
      const hasCreateAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
      if (!hasCreateAccess) {
        throw new Error(tErrors.unauthorizedAction);
      }

      if (!input.days || input.days.length === 0) {
        throw new Error(tErrors.invalidInput);
      }

      if (input.durationMinutes <= 0) {
        throw new Error(tErrors.invalidInput);
      }

      const activeDays = input.days.filter(d => d.isActive);
      if (activeDays.length === 0) {
        throw new Error(tErrors.invalidInput);
      }

      const balance = await CreditRepository.getBalance(db, input.studentId);
      if (balance.classesRemaining <= 0) {
        throw new Error(
          tErrors.credit.insufficientBalance({
            studentId: input.studentId,
            remaining: balance.classesRemaining,
          })
        );
      }

      const result = await db.transaction(async tx => {
        const created = await SchedulingRepository.createRecurringScheduleWithInstances(
          {
            studentId: input.studentId,
            teacherId: input.teacherId,
            durationMinutes: input.durationMinutes,
            defaultStartTime: input.defaultStartTime,
            timezone: input.timezone,
            timezoneId: input.timezoneId,
            effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
            effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
            days: input.days,
            classType: input.classType,
            generateInstancesForWeeks: input.generateInstancesForWeeks,
            quotaDeducted: true,
          },
          tx
        );

        for (const classInstanceId of created.classInstanceIds) {
          const idempotencyKey = `credit-deduction:${classInstanceId}`;
          await CreditService.deductForBooking(input.studentId, classInstanceId, userId, idempotencyKey, tx, tErrors);
        }

        return created;
      });

      await dispatchClassScheduledNotifications(result.classInstanceIds, input.studentId, input.locale);

      return {
        id: result.recurringScheduleId,
        recurringScheduleId: result.recurringScheduleId,
        classInstanceIds: result.classInstanceIds,
        classInstanceCount: result.classInstanceIds.length,
      };
    } catch (error) {
      logger.error("Error creating recurring class", { userId, input, error });
      throw error;
    }
  }

  export async function listRecurringSchedulesByStudentIds(
    studentIds: readonly string[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleEntity[]> {
    return RecurringScheduleRepository.listByStudentIds(studentIds, tx);
  }

  export async function upsertManyRecurringSchedules(
    inputs: readonly RecurringScheduleUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleEntity[]> {
    return RecurringScheduleRepository.upsertMany(inputs, tx);
  }

  export async function findScheduleDaysByKeys(
    keys: readonly { recurringScheduleId: string; dayOfWeek: RecurringScheduleDayUpsertInput["dayOfWeek"] }[],
    tx?: DBTransaction
  ): Promise<Map<ScheduleDayKey, RecurringScheduleDayEntity>> {
    return RecurringScheduleRepository.findDaysByKeys(keys, tx);
  }

  export async function upsertManyScheduleDays(
    inputs: readonly RecurringScheduleDayUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleDayEntity[]> {
    return RecurringScheduleRepository.upsertManyDays(inputs, tx);
  }
}
