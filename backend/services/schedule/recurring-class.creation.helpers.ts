import { db } from "@/backend/db/drizzleDb";
import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { SchedulingMode } from "@/backend/enum";
import { CreditService } from "@/backend/services/billing/credit.service";
import { QuotaService } from "@/backend/services/billing/quota.service";
import { EffectiveMeetingService } from "@/backend/services/meeting/class-meeting-config.service";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import type { CreateRecurringClassInput, DBTransaction, RateSnapshot } from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

type RecurringScheduleWriteInput = ReturnType<typeof buildRecurringScheduleInput>;
type CreatedRecurringSchedule = Awaited<ReturnType<typeof SchedulingRepository.createRecurringScheduleWithInstances>>;

function buildRecurringScheduleInput(input: CreateRecurringClassInput, isOndemand: boolean) {
  const instanceWeeks = isOndemand ? 0 : input.generateInstancesForWeeks;

  return {
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
}

async function resolveRateSnapshot(
  tx: DBTransaction,
  recurringScheduleInput: RecurringScheduleWriteInput
): Promise<RateSnapshot> {
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

  return {
    rateAmount: resolvedRate.hourlyRate,
    rateCurrency: resolvedRate.currency,
    rateSource: resolvedRate.source,
  };
}

async function deductCreditsForInstances(
  input: CreateRecurringClassInput,
  created: CreatedRecurringSchedule,
  userId: string,
  tx: DBTransaction,
  tErrors: ErrorsLabels
): Promise<void> {
  await created.classInstanceIds.reduce(async (prev, classInstanceId) => {
    await prev;
    const idempotencyKey = `credit-deduction:${classInstanceId}`;
    await CreditService.deductForBooking(input.studentId, classInstanceId, userId, idempotencyKey, tx, tErrors);
  }, Promise.resolve());
}

async function settleRecurringScheduleQuotaOrCredits(params: {
  userId: string;
  input: CreateRecurringClassInput;
  isOndemand: boolean;
  created: CreatedRecurringSchedule;
  tx: DBTransaction;
  tErrors: ErrorsLabels;
}): Promise<void> {
  const { userId, input, isOndemand, created, tx, tErrors } = params;

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
    return;
  }

  if (input.quotaId) {
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
    return;
  }

  if (isOndemand) {
    return;
  }

  // Standard credit-backed mode. Deductions run sequentially within the shared
  // transaction because `CreditService.deductForBooking` re-reads the student's
  // balance on every call and throws if it has dropped to zero — so each call
  // must observe the prior call's deduction.
  await deductCreditsForInstances(input, created, userId, tx, tErrors);
}

async function createScheduleInTransaction(
  tx: DBTransaction,
  userId: string,
  input: CreateRecurringClassInput,
  tErrors: ErrorsLabels
): Promise<CreatedRecurringSchedule> {
  const isOndemand = input.schedulingMode === SchedulingMode.ON_DEMAND;
  const recurringScheduleInput = buildRecurringScheduleInput(input, isOndemand);

  const meeting = await EffectiveMeetingService.resolveForNewBooking(input.teacherId, {
    recurringScheduleId: null,
    tErrors,
    tx,
  });

  const rateSnapshot = await resolveRateSnapshot(tx, recurringScheduleInput);

  const created = await SchedulingRepository.createRecurringScheduleWithInstances(
    recurringScheduleInput,
    meeting.joinUrl,
    rateSnapshot,
    tx
  );

  await settleRecurringScheduleQuotaOrCredits({ userId, input, isOndemand, created, tx, tErrors });

  return created;
}

/**
 * Persist the recurring schedule plus its generated instances, then process
 * quota reservations / redemptions or credit deductions within a single transaction.
 */
export async function createScheduleAndDeductCredits(
  userId: string,
  input: CreateRecurringClassInput,
  tErrors: ErrorsLabels
): Promise<CreatedRecurringSchedule> {
  return db.transaction(tx => createScheduleInTransaction(tx, userId, input, tErrors));
}
