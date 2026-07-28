import { eq } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { classLifecycleAffectedUserIds, SchedulingRepository } from "@/backend/db/repo/scheduling";
import {
  type RecurringScheduleDayUpsertInput,
  RecurringScheduleRepository,
  type RecurringScheduleUpsertInput,
  type ScheduleDayKey,
} from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { students } from "@/backend/db/schema";
import { AppPermission, type CurrencyCode, type IanaTimezone, NotificationEventType } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import type { RecurringScheduleDayEntity, RecurringScheduleEntity } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export interface CreateRecurringClassInput {
  studentId: string;
  teacherId: string;
  subjectId: string;
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
  /** Recurring-class-level hourly rate (highest non-override tier). Nullable. */
  hourlyRate?: string | null;
  /** Currency for `hourlyRate`. Required when `hourlyRate` is set. */
  rateCurrency?: CurrencyCode | null;
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
   * The affected-user set is the same parent + teacher + student for every
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

    const affectedUserIds = classLifecycleAffectedUserIds(affected);

    for (const instanceId of classInstanceIds) {
      try {
        const instance = await SchedulingRepository.getClassInstanceById(instanceId);
        if (!instance) continue;

        const payloads = buildClassLifecyclePayloads(
          instance,
          NotificationEventType.CLASS_SCHEDULED,
          affectedUserIds,
          locale,
          { studentName }
        );
        await dispatchWithPreferences(payloads, affectedUserIds, locale);
      } catch (error) {
        logger.error("Class scheduled notification dispatch failed", {
          classInstanceId: instanceId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Validate the recurring-class input before any DB work: checks permission,
   * required fields, duration, subject existence and active balance.
   * Throws localized `tErrors.*` messages on any failure.
   */
  async function validateCreateRecurringClass(userId: string, input: CreateRecurringClassInput, tErrors: ErrorsLabels) {
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

    if (!input.subjectId) {
      throw new Error(tErrors.invalidInput);
    }

    let subject: Awaited<ReturnType<typeof ClassSubjectRepository.getSubjectById>>;
    try {
      subject = await ClassSubjectRepository.getSubjectById(input.subjectId);
    } catch {
      throw new Error(tErrors.invalidInput);
    }
    if (!subject.isActive) {
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

    return subject;
  }

  /**
   * Persist the recurring schedule plus its generated instances, then deduct
   * one credit per instance — all within a single transaction.
   */
  async function createScheduleAndDeductCredits(
    userId: string,
    input: CreateRecurringClassInput,
    tErrors: ErrorsLabels
  ) {
    return db.transaction(async tx => {
      const created = await SchedulingRepository.createRecurringScheduleWithInstances(
        {
          studentId: input.studentId,
          teacherId: input.teacherId,
          subjectId: input.subjectId,
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
          hourlyRate: input.hourlyRate ?? null,
          rateCurrency: input.rateCurrency ?? null,
        },
        tx
      );

      for (const classInstanceId of created.classInstanceIds) {
        const idempotencyKey = `credit-deduction:${classInstanceId}`;
        await CreditService.deductForBooking(input.studentId, classInstanceId, userId, idempotencyKey, tx, tErrors);
      }

      return created;
    });
  }

  export async function createRecurringClass(userId: string, input: CreateRecurringClassInput, tErrors: ErrorsLabels) {
    try {
      await validateCreateRecurringClass(userId, input, tErrors);

      const result = await createScheduleAndDeductCredits(userId, input, tErrors);

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
      throw new Error(tErrors.unauthorizedAction);
    }

    const updated = await RecurringScheduleRepository.updateRate(
      input.recurringScheduleId,
      input.hourlyRate,
      input.rateCurrency
    );
    if (!updated) {
      throw new Error(tErrors.notFound);
    }
    return {
      recurringScheduleId: updated.id,
      hourlyRate: updated.hourlyRate,
      rateCurrency: updated.rateCurrency,
    };
  }
}
