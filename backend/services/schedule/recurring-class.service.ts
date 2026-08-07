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
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission, type CurrencyCode, NotificationEventType, SchedulingMode } from "@/backend/enum";
import { NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type { RecurringScheduleDaySelectType, RecurringScheduleSelectType } from "@/backend/types";
import type { CreateRecurringClassInput } from "@/backend/types/scheduling/scheduling.types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace RecurringClassService {
  /**
   * Resolve the student display name for the `metadata.studentName` channel
   * of `buildClassLifecyclePayloads`. The pure builder never reads the DB
   * (specs.md §5.1), so the parent of all instances in this recurring
   * schedule is fetched once here and threaded into every dispatch.
   */
  async function resolveStudentName(studentId: string): Promise<string> {
    // V3-022: Use StudentRepository instead of direct DB query
    const student = await StudentRepository.findById(studentId);
    return student?.name ?? "—";
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

    // Batch-fetch all instances in a single query to eliminate N+1 DB reads
    // (RB-15). Without this, each iteration called `getClassInstanceById`
    // separately, producing one query per instance inside the loop.
    const instanceMap = await SchedulingRepository.getClassInstancesByIds([...classInstanceIds]);

    for (const instanceId of classInstanceIds) {
      try {
        const instance = instanceMap.get(instanceId);
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
    if (input.schedulingMode === SchedulingMode.ON_DEMAND) return;

    if (input.quotaId) {
      const quota = await QuotaRepository.findById(db, input.quotaId);
      if (!quota || quota.remaining <= 0) {
        throw new ValidationError(tErrors.outOfQuota);
      }
    } else {
      const balance = await CreditRepository.getBalance(db, input.studentId);
      if (balance.classesRemaining <= 0) {
        throw new ValidationError(
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
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }

    if (!input.days || input.days.length === 0 || input.durationMinutes <= 0 || !input.subjectId) {
      throw new ValidationError(tErrors.invalidInput);
    }

    let subject: Awaited<ReturnType<typeof ClassSubjectRepository.getSubjectById>>;
    try {
      subject = await ClassSubjectRepository.getSubjectById(input.subjectId);
    } catch {
      throw new ValidationError(tErrors.invalidInput);
    }
    if (!subject.isActive) {
      throw new ValidationError(tErrors.invalidInput);
    }

    const activeDays = input.days.filter(d => d.isActive);
    if (activeDays.length === 0) {
      throw new ValidationError(tErrors.invalidInput);
    }

    const startDate = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
    const endDate = input.effectiveUntil
      ? new Date(input.effectiveUntil)
      : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    await AvailabilityService.assertSchedulePatternAvailable({
      studentId: input.studentId,
      teacherId: input.teacherId,
      days: activeDays,
      startDate,
      endDate,
      options: {
        ignoreInstanceIds: [],
        locale: input.locale,
        durationMinutes: input.durationMinutes,
        timezone: input.timezone,
      },
    });

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
      const isOndemand = input.schedulingMode === SchedulingMode.ON_DEMAND;
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
          classType: input.classType ?? undefined,
          generateInstancesForWeeks: instanceWeeks ?? undefined,
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

      // Best-effort meeting URL generation — never fails the booking.
      for (const instanceId of result.classInstanceIds) {
        try {
          await MeetingConfigSnapshotService.generateAndAttachForClassInstance(instanceId);
        } catch (error) {
          logger.error("Booking-time meeting URL generation failed for class instance", {
            classInstanceId: instanceId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

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
  ): Promise<RecurringScheduleSelectType[]> {
    return RecurringScheduleRepository.listByStudentIds(studentIds, tx);
  }

  export async function upsertManyRecurringSchedules(
    inputs: readonly RecurringScheduleUpsertInput[],
    tx?: DBTransaction
  ): Promise<RecurringScheduleSelectType[]> {
    return RecurringScheduleRepository.upsertMany(inputs, tx);
  }

  export async function findScheduleDaysByKeys(
    keys: readonly { recurringScheduleId: string; dayOfWeek: RecurringScheduleDayUpsertInput["dayOfWeek"] }[],
    tx?: DBTransaction
  ): Promise<Map<ScheduleDayKey, RecurringScheduleDaySelectType>> {
    return RecurringScheduleRepository.findDaysByKeys(keys, tx);
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

  type ScheduledInstanceInfo = {
    id: string;
    studentId: string;
    quotaDeducted: boolean;
  };

  type UpcomingInstance = { id: string; studentId: string; quotaDeducted: boolean };

  /**
   * Shared permission gate for recurring-schedule management mutations.
   * Throws a localized `UnauthorizedError` when the user lacks
   * `SCHEDULE_CREATE_CLASS`.
   */
  async function requireManageAccess(userId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasManageAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
    if (!hasManageAccess) {
      throw new UnauthorizedError(tErrors.unauthorizedAction);
    }
  }

  /**
   * Load a recurring schedule row by id and return its snapshot, throwing a
   * localized `NotFoundError` when it does not exist. Shared by
   * `cancelSchedule` and `switchSchedulingMode`.
   */
  async function loadScheduleOrThrow(
    recurringScheduleId: string,
    tErrors: ErrorsLabels,
    t: DBTransaction
  ): Promise<RecurringScheduleSelectType> {
    const row = await RecurringScheduleRepository.findById(recurringScheduleId, t);
    if (!row) {
      throw new NotFoundError("RECURRING_SCHEDULE", tErrors.notFound);
    }
    return row.schedule;
  }

  /**
   * Find all non-deleted upcoming instances for a schedule and soft-delete
   * them in a single batch. Returns the ids of the archived instances plus
   * the loaded instance rows (for downstream refund/quota release logic).
   * Shared by `cancelSchedule` and `switchSchedulingMode`.
   */
  async function archiveUpcomingInstances(
    recurringScheduleId: string,
    t: DBTransaction
  ): Promise<{ archivedInstanceIds: string[]; instances: UpcomingInstance[] }> {
    const upcomingInstances = await SchedulingRepository.findUpcomingInstancesByScheduleId(
      recurringScheduleId,
      new Date(),
      t
    );

    const archivedInstanceIds: string[] = [];
    if (upcomingInstances.length > 0) {
      const instanceIds = upcomingInstances.map(i => i.id);
      await SchedulingRepository.softDeleteBatch(instanceIds, t);
      archivedInstanceIds.push(...instanceIds);
    }
    return { archivedInstanceIds, instances: upcomingInstances };
  }

  /**
   * Release quota (earmark or pool mode) when a recurring schedule is cancelled.
   * Returns true if any quota was released.
   */
  async function releaseQuotaOnCancel(
    schedule: { quotaId?: string | null; earmarkedClasses?: number | null; studentId: string },
    upcomingInstances: ScheduledInstanceInfo[],
    recurringScheduleId: string,
    userId: string,
    t: DBTransaction
  ): Promise<boolean> {
    if (!schedule.quotaId) return false;

    // Earmark mode: release the earmarked reservation
    if (schedule.earmarkedClasses && schedule.earmarkedClasses > 0) {
      try {
        await QuotaService.releaseForRecurringSchedule(
          schedule.studentId,
          recurringScheduleId,
          schedule.quotaId,
          schedule.earmarkedClasses,
          userId,
          t
        );
        return true;
      } catch (error) {
        logger.error("Failed to release quota on schedule cancel", {
          recurringScheduleId,
          quotaId: schedule.quotaId,
          error: error instanceof Error ? error.message : String(error),
        });
        return false;
      }
    }

    // Pool mode: release quota for ALL upcoming instances under this schedule.
    // We do NOT filter by `quotaDeducted` — pool-mode instances created before
    // the root-cause fix in `redeemForInstanceBatch` have `quotaDeducted=false`
    // even though their quota was redeemed at the schedule level. The release
    // ledger insert is idempotent per instance (keyed by
    // `deriveReleasePoolIdempotencyKey`), so already-released instances are
    // deduped.
    if (upcomingInstances.length === 0) return false;

    try {
      const result = await QuotaService.releaseForInstances(
        schedule.studentId,
        upcomingInstances.map(i => i.id),
        schedule.quotaId,
        recurringScheduleId,
        userId,
        t
      );
      return (result?.releasedCount ?? 0) > 0;
    } catch (error) {
      logger.error("Failed to release pool-mode quota on schedule cancel", {
        recurringScheduleId,
        quotaId: schedule.quotaId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
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
    await requireManageAccess(userId, tErrors);

    const runner = async (t: DBTransaction) => {
      const schedule = await loadScheduleOrThrow(recurringScheduleId, tErrors, t);

      // 1. Soft-delete the schedule (V3-021: delegated to repository)
      await RecurringScheduleRepository.softDelete(recurringScheduleId, t);

      // 2. Soft-delete all non-deleted upcoming instances (via repository)
      const { archivedInstanceIds, instances: upcomingInstances } = await archiveUpcomingInstances(
        recurringScheduleId,
        t
      );

      // 3. Release quota if applicable
      const quotaReleased = await releaseQuotaOnCancel(schedule, upcomingInstances, recurringScheduleId, userId, t);

      return { cancelledInstanceIds: archivedInstanceIds, quotaReleased };
    };

    return tx ? runner(tx) : db.transaction(runner);
  }

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
      // Pool mode: release quota for ALL upcoming instances, not just those
      // with `quotaDeducted=true`. See `releaseQuotaOnCancel` for rationale.
      const refunded = await releasePerInstance(upcomingInstances, schedule.quotaId, recurringScheduleId, userId, t);
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
    await requireManageAccess(userId, tErrors);

    const runner = async (t: DBTransaction) => {
      const schedule = await loadScheduleOrThrow(recurringScheduleId, tErrors, t);

      // 1. Find all non-deleted, upcoming instances and soft-delete them
      const { archivedInstanceIds, instances: upcomingInstances } = await archiveUpcomingInstances(
        recurringScheduleId,
        t
      );

      // 2. Refund credits or release quota
      const { quotaReleased, creditsRefunded } = await refundOrReleaseForInstances(
        schedule,
        upcomingInstances,
        recurringScheduleId,
        userId,
        tErrors,
        t
      );

      // 3. Update the schedule mode (V3-021: delegated to repository)
      await RecurringScheduleRepository.updateSchedulingMode(recurringScheduleId, newMode, t);

      return { archivedInstanceIds, quotaReleased, creditsRefunded };
    };

    return tx ? runner(tx) : db.transaction(runner);
  }
}
