import { and, eq, gte, inArray, isNull } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { classLifecycleAffectedUserIds, SchedulingRepository } from "@/backend/db/repo/scheduling";
import {
  type RecurringScheduleDayUpsertInput,
  RecurringScheduleRepository,
  type RecurringScheduleUpsertInput,
  type ScheduleDayKey,
} from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { classInstances, recurringSchedules, students } from "@/backend/db/schema";
import {
  AppPermission,
  type CurrencyCode,
  type IanaTimezone,
  NotificationEventType,
  SchedulingMode,
} from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
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
  quotaId?: string | null;
  earmarkedClasses?: number | null;
  schedulingMode?: SchedulingMode | null;
  generationHorizonWeeks?: number | null;
  ondemandNoCreditsOutcome?: import("@/backend/enum").OnDemandNoCreditsOutcome | null;
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

  async function validateBalanceOrQuota(input: CreateRecurringClassInput, tErrors: ErrorsLabels) {
    if (input.schedulingMode === "ON_DEMAND") return;

    if (input.quotaId) {
      const quota = await QuotaRepository.findById(db, input.quotaId);
      if (!quota || quota.remaining <= 0) {
        throw new Error(tErrors.outOfQuota ?? "Insufficient quota remaining");
      }
    } else {
      const balance = await CreditRepository.getBalance(db, input.studentId);
      if (balance.classesRemaining <= 0) {
        throw new Error(
          tErrors.credit.insufficientBalance({
            studentId: input.studentId,
            remaining: balance.classesRemaining,
          })
        );
      }
    }
  }

  /**
   * Validate the recurring-class input before any DB work: checks permission,
   * required fields, duration, subject existence, availability, and active balance.
   * Throws localized `tErrors.*` messages on any failure.
   */
  async function validateCreateRecurringClass(userId: string, input: CreateRecurringClassInput, tErrors: ErrorsLabels) {
    const hasCreateAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
    if (!hasCreateAccess) {
      throw new Error(tErrors.unauthorizedAction);
    }

    if (!input.days || input.days.length === 0 || input.durationMinutes <= 0 || !input.subjectId) {
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

    const startDate = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
    const endDate = input.effectiveUntil
      ? new Date(input.effectiveUntil)
      : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    await AvailabilityService.assertSchedulePatternAvailable(
      input.studentId,
      input.teacherId,
      activeDays,
      startDate,
      endDate,
      [],
      input.locale
    );

    await validateBalanceOrQuota(input, tErrors);

    return subject;
  }

  /**
   * Persist the recurring schedule plus its generated instances, then process
   * quota reservations / redemptions or credit deductions within a single transaction.
   */
  async function createScheduleAndDeductCredits(
    userId: string,
    input: CreateRecurringClassInput,
    tErrors: ErrorsLabels
  ) {
    return db.transaction(async tx => {
      const isOndemand = input.schedulingMode === "ON_DEMAND";
      const instanceWeeks = isOndemand ? 0 : input.generateInstancesForWeeks;

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
          generateInstancesForWeeks: instanceWeeks,
          quotaDeducted: false,
          hourlyRate: input.hourlyRate ?? null,
          rateCurrency: input.rateCurrency ?? null,
          quotaId: input.quotaId ?? null,
          earmarkedClasses: input.earmarkedClasses ?? null,
          schedulingMode: input.schedulingMode ?? SchedulingMode.NUMBER_OF_CLASSES,
          generationHorizonWeeks: input.generationHorizonWeeks ?? null,
          ondemandNoCreditsOutcome: input.ondemandNoCreditsOutcome ?? null,
        },
        tx
      );

      if (input.quotaId && input.earmarkedClasses && input.earmarkedClasses > 0) {
        // Earmark mode: reserve classes up front for the schedule
        await QuotaService.reserveForRecurringSchedule(
          input.studentId,
          created.recurringScheduleId,
          input.quotaId,
          input.earmarkedClasses,
          userId,
          tx
        );
      } else if (input.quotaId) {
        // Pool mode with explicit quota — batch redeem all instances in one shot
        if (created.classInstanceIds.length > 0) {
          await QuotaService.redeemForInstances(
            input.studentId,
            created.classInstanceIds,
            input.quotaId,
            created.recurringScheduleId,
            userId,
            tx,
            input.locale
          );
        }
      } else if (!isOndemand) {
        // Standard credit-backed mode
        for (const classInstanceId of created.classInstanceIds) {
          const idempotencyKey = `credit-deduction:${classInstanceId}`;
          await CreditService.deductForBooking(input.studentId, classInstanceId, userId, idempotencyKey, tx, tErrors);
        }
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

  /**
   * Cancel an existing recurring schedule: soft-deletes the schedule, its days,
   * and all upcoming (not yet taken) class instances. Releases any quota that
   * was earmarked/reserved for this schedule.
   */
  export async function cancelSchedule(
    userId: string,
    recurringScheduleId: string,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<{ cancelledInstanceIds: string[]; quotaReleased: boolean }> {
    const hasManageAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
    if (!hasManageAccess) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const runner = async (t: DBTransaction) => {
      const row = await RecurringScheduleRepository.findById(recurringScheduleId, t);
      if (!row) {
        throw new Error(tErrors.notFound);
      }
      const schedule = row.schedule;

      const now = new Date();

      // 1. Soft-delete the schedule
      await t
        .update(recurringSchedules)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(recurringSchedules.id, recurringScheduleId));

      // 2. Soft-delete all non-deleted upcoming instances
      const upcomingInstances = await t
        .select({
          id: classInstances.id,
          studentId: classInstances.studentId,
          quotaDeducted: classInstances.quotaDeducted,
        })
        .from(classInstances)
        .where(
          and(
            eq(classInstances.recurringScheduleId, recurringScheduleId),
            isNull(classInstances.deletedAt),
            gte(classInstances.scheduledStartAt, now)
          )
        );

      const cancelledInstanceIds: string[] = [];
      if (upcomingInstances.length > 0) {
        const instanceIds = upcomingInstances.map(i => i.id);
        await t
          .update(classInstances)
          .set({ deletedAt: now, updatedAt: now })
          .where(inArray(classInstances.id, instanceIds));
        cancelledInstanceIds.push(...instanceIds);
      }

      // 3. Release quota if applicable
      let quotaReleased = false;
      if (schedule.quotaId && schedule.earmarkedClasses && schedule.earmarkedClasses > 0) {
        try {
          await QuotaService.releaseForRecurringSchedule(
            schedule.studentId,
            recurringScheduleId,
            schedule.quotaId,
            schedule.earmarkedClasses,
            userId,
            t
          );
          quotaReleased = true;
        } catch (error) {
          logger.error("Failed to release quota on schedule cancel", {
            recurringScheduleId,
            quotaId: schedule.quotaId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return { cancelledInstanceIds, quotaReleased };
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

  type ScheduledInstanceInfo = {
    id: string;
    studentId: string;
    quotaDeducted: boolean;
  };

  async function releasePerInstance(
    instances: ScheduledInstanceInfo[],
    quotaId: string,
    recurringScheduleId: string,
    userId: string,
    t: DBTransaction
  ): Promise<number> {
    if (instances.length === 0) return 0;
    try {
      const result = await QuotaService.releaseForInstances(
        instances[0]?.studentId,
        instances.map(i => i.id),
        quotaId,
        recurringScheduleId,
        userId,
        t
      );
      return result?.releasedCount ?? instances.length;
    } catch (error) {
      logger.error("Batch release failed on mode switch", {
        recurringScheduleId,
        quotaId,
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  async function refundOrReleaseForInstances(
    schedule: { quotaId?: string | null; earmarkedClasses?: number | null; studentId: string },
    upcomingInstances: ScheduledInstanceInfo[],
    recurringScheduleId: string,
    userId: string,
    tErrors: ErrorsLabels,
    t: DBTransaction
  ): Promise<{ quotaReleased: boolean; creditsRefunded: number }> {
    if (schedule.quotaId && schedule.earmarkedClasses && schedule.earmarkedClasses > 0) {
      await QuotaService.releaseForRecurringSchedule(
        schedule.studentId,
        recurringScheduleId,
        schedule.quotaId,
        schedule.earmarkedClasses,
        userId,
        t
      );
      return { quotaReleased: true, creditsRefunded: 0 };
    }

    if (schedule.quotaId) {
      const quotaInstances = upcomingInstances.filter(i => i.quotaDeducted);
      const refunded = await releasePerInstance(quotaInstances, schedule.quotaId, recurringScheduleId, userId, t);
      return { quotaReleased: false, creditsRefunded: refunded };
    }

    // Credit-backed: refund credits for all instances in a single batch.
    // CreditService.refundOnCancelBatch groups refunds by student and
    // performs ONE idempotency SELECT, ONE multi-row INSERT, and at most
    // ONE StudentRepository.addClasses + QuotaService.refresh per student —
    // instead of ~4 round-trips per instance in the legacy loop.
    const refunds = upcomingInstances.map(i => ({
      studentId: i.studentId,
      classInstanceId: i.id,
      creditedByUserId: userId,
      idempotencyKey: `switch-mode:${recurringScheduleId}:${i.id}`,
    }));

    let refunded = 0;
    try {
      refunded = await CreditService.refundOnCancelBatch(t, refunds, tErrors);
    } catch (error) {
      logger.error("Batch credit refund failed on mode switch", {
        recurringScheduleId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return { quotaReleased: false, creditsRefunded: refunded };
  }

  /**
   * Switch the scheduling mode of a recurring class schedule. Archives all
   * untaken (future, non-deleted) class instances and refunds credits or
   * releases quota depending on the original mode.
   */
  export async function switchSchedulingMode(
    userId: string,
    recurringScheduleId: string,
    newMode: SchedulingMode,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<{
    archivedInstanceIds: string[];
    creditsRefunded: number;
    quotaReleased: boolean;
  }> {
    const hasManageAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
    if (!hasManageAccess) {
      throw new Error(tErrors.unauthorizedAction);
    }

    const runner = async (t: DBTransaction) => {
      const row = await RecurringScheduleRepository.findById(recurringScheduleId, t);
      if (!row) {
        throw new Error(tErrors.notFound);
      }
      const schedule = row.schedule;

      const now = new Date();

      // 1. Find all non-deleted, upcoming instances
      const upcomingInstances = await t
        .select({
          id: classInstances.id,
          studentId: classInstances.studentId,
          quotaDeducted: classInstances.quotaDeducted,
        })
        .from(classInstances)
        .where(
          and(
            eq(classInstances.recurringScheduleId, recurringScheduleId),
            isNull(classInstances.deletedAt),
            gte(classInstances.scheduledStartAt, now)
          )
        );

      // 2. Soft-delete all upcoming instances
      const archivedInstanceIds: string[] = [];
      if (upcomingInstances.length > 0) {
        const instanceIds = upcomingInstances.map(i => i.id);
        await t
          .update(classInstances)
          .set({ deletedAt: now, updatedAt: now })
          .where(inArray(classInstances.id, instanceIds));
        archivedInstanceIds.push(...instanceIds);
      }

      // 3. Refund credits or release quota
      const { quotaReleased, creditsRefunded } = await refundOrReleaseForInstances(
        schedule,
        upcomingInstances as ScheduledInstanceInfo[],
        recurringScheduleId,
        userId,
        tErrors,
        t
      );

      // 4. Update the schedule mode
      await t
        .update(recurringSchedules)
        .set({ schedulingMode: newMode, updatedAt: now })
        .where(eq(recurringSchedules.id, recurringScheduleId));

      return { archivedInstanceIds, quotaReleased, creditsRefunded };
    };

    return tx ? runner(tx) : db.transaction(runner);
  }
}
