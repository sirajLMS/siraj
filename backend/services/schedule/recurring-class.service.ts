import { db } from "@/backend/db/drizzleDb";
import { CreditRepository } from "@/backend/db/repo/billing";
import { QuotaRepository } from "@/backend/db/repo/billing/quota.repository";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import { classLifecycleAffectedUserIds, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { RecurringScheduleRepository } from "@/backend/db/repo/scheduling/recurring-schedule.repository";
import { StudentRepository } from "@/backend/db/repo/students/student.repository";
import { AppPermission, NotificationEventType, SchedulingMode } from "@/backend/enum";
import { DomainError, NotFoundError, UnauthorizedError, ValidationError } from "@/backend/lib/errors";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { MeetingConfigSnapshotService } from "@/backend/services/meeting/meeting-config-snapshot";
import { buildClassLifecyclePayloads, dispatchWithPreferences } from "@/backend/services/notification";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import { AvailabilityService } from "@/backend/services/scheduling/availability.service";
import type {
  CreateRecurringClassInput,
  DBTransaction,
  RateSnapshot,
  RecurringScheduleDaySelectType,
  RecurringScheduleDayUpsertInput,
  RecurringScheduleSelectType,
  RecurringScheduleUpsertInput,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
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

    // Dispatch notifications for all instances in parallel. Each dispatch is
    // independent (own payload, own affected set), so per-instance try/catch
    // keeps one failure from surfacing as a 500 to the caller (specs.md
    // "Dispatch failures must NOT throw out of the action") while still
    // letting the rest fire concurrently.
    await Promise.allSettled(
      classInstanceIds.map(async instanceId => {
        try {
          const instance = instanceMap.get(instanceId);
          if (!instance) return;

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
      })
    );
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

    if (!input.days || input.days.length === 0) {
      throw new ValidationError("RECURRING_CLASS_DAYS_REQUIRED", tErrors.recurringClassDaysRequired());
    }
    if (input.durationMinutes <= 0) {
      throw new ValidationError("INVALID_DURATION", tErrors.invalidDuration());
    }
    if (!input.subjectId) {
      throw new ValidationError("SUBJECT_REQUIRED", tErrors.subjectRequired());
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

      const recurringScheduleInput = {
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
      };

      const meeting = await EffectiveMeetingService.resolveForNewBooking(input.teacherId, {
        recurringScheduleId: null,
        tErrors,
        tx,
      });

      const rawData = await SchedulingRepository.fetchRawRateData(tx, {
        hourlyRate: recurringScheduleInput.hourlyRate,
        rateCurrency: recurringScheduleInput.rateCurrency,
        subjectId: recurringScheduleInput.subjectId,
        teacherId: recurringScheduleInput.teacherId,
      });

      const resolvedRate = resolveClassRate({
        classInstance: {
          isRateOverridden: false,
          rateAmount: null,
          rateCurrency: null,
        },
        recurringSchedule: rawData.recurringSchedule,
        subject: rawData.subject,
        teacher: rawData.teacher,
      });

      const rateSnapshot: RateSnapshot = {
        rateAmount: resolvedRate.hourlyRate,
        rateCurrency: resolvedRate.currency,
        rateSource: resolvedRate.source,
      };

      const created = await SchedulingRepository.createRecurringScheduleWithInstances(
        recurringScheduleInput,
        meeting.joinUrl,
        rateSnapshot,
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
        // Standard credit-backed mode. Deductions run sequentially within the
        // shared transaction because `CreditService.deductForBooking` re-reads
        // the student's balance on every call and throws if it has dropped to
        // zero — so each call must observe the prior call's deduction. A
        // `reduce` chain preserves that ordering without an `await` directly
        // inside a `for` body.
        await created.classInstanceIds.reduce(async (prev, classInstanceId) => {
          await prev;
          const idempotencyKey = `credit-deduction:${classInstanceId}`;
          await CreditService.deductForBooking(input.studentId, classInstanceId, userId, idempotencyKey, tx, tErrors);
        }, Promise.resolve());
      }

      return created;
    });
  }

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
