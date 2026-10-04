import { createHash } from "node:crypto";
import { inArray } from "drizzle-orm";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import {
  ClassStatusEventsRepository,
  RecurringScheduleRepository,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { TeacherDueRepository } from "@/backend/db/repo/teachers/teacher-due.repository";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, CalculationStatus, type RateSource, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import {
  AUTHORITATIVE_AMOUNT_STATUSES,
  MINUTES_PER_HOUR,
  PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
  WAITING_PAID_ENTRY_STATUSES,
} from "@/backend/services/teacher/teacher-due.constants";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  DBTransaction,
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherDueSelectType,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { getServerTranslations } from "@/shared/locale";

export interface DueAccrualInput {
  classInstanceId: string;
  teacherId: string;
  studentId: string;
  approvedByUserId: string;
  locale?: string;
}

/** Deterministic audit key for the accrual transition of one instance. */
function deriveAccrualIdempotencyKey(instanceId: string): string {
  return createHash("sha256").update(`payroll-accrual:${instanceId}`).digest("hex");
}

/** Deterministic audit key for settling one instance against a payment. */
function deriveSettlementIdempotencyKey(instanceId: string, teacherPaymentId: string): string {
  return createHash("sha256").update(`payroll-settlement:${instanceId}:${teacherPaymentId}`).digest("hex");
}

/**
 * Builds one `PAYROLL_STATUS_TRANSITION` audit row. The payload mirrors the
 * payroll calculation service's event shape so the audit timeline renders
 * every lifecycle hop uniformly. Settlement transitions never edit money
 * fields, so the amount and partial share travel through unchanged.
 */
function buildPayrollTransitionEvent(input: {
  classInstance: ClassInstanceSelectType;
  toStatus: CalculationStatus;
  actorUserId: string;
  idempotencyKey: string;
}): ClassStatusEventSeedInsertInput {
  const { classInstance } = input;
  return {
    classInstanceId: classInstance.id,
    eventType: PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
    fromState: {
      calculationStatus: classInstance.calculationStatus,
      teacherPaidAmount: classInstance.teacherPaidAmount ?? null,
    },
    toState: {
      calculationStatus: input.toStatus,
      teacherPaidAmount: classInstance.teacherPaidAmount ?? null,
      partialPercentage: classInstance.isPartialPercentage ?? null,
      idempotencyKey: input.idempotencyKey,
    },
    description: null,
    actorUserId: input.actorUserId,
    createdAt: new Date(),
  };
}

/**
 * Derives the due amount directly from the instance payroll snapshot. The
 * amount string is preserved verbatim — a refund row carries the exact
 * string "0", yielding a zero-amount due — and payable hours come from the
 * calculated duration (zero when a refund was raised without a prior
 * calculation). A snapshot without a stored amount is not authoritative, so
 * the caller falls back to rate resolution. A missing paid currency (refund
 * overrides raised from never-calculated rows keep the prior NULL) borrows
 * the teacher's rate currency so the due row always settles in a real
 * currency.
 */
function resolveSnapshotDueAmount(
  classInstance: ClassInstanceSelectType,
  fallbackCurrency: CurrencyCode
): { hours: string; amount: string; currency: CurrencyCode; rateSource: RateSource | null } | null {
  if (!AUTHORITATIVE_AMOUNT_STATUSES.has(classInstance.calculationStatus)) return null;
  if (classInstance.teacherPaidAmount == null) return null;

  const payableMinutes = classInstance.calculatedDuration ?? 0;
  return {
    hours: String(+(payableMinutes / MINUTES_PER_HOUR).toFixed(2)),
    amount: classInstance.teacherPaidAmount,
    currency: classInstance.teacherPaidCurrency ?? fallbackCurrency,
    rateSource: classInstance.rateSource ?? null,
  };
}

/**
 * Chooses the due amount source: a calculated payroll snapshot is
 * authoritative (its `teacherPaidAmount` is exactly what the teacher is owed,
 * so the rate cascade must not run again); every other state falls back to
 * the legacy rate-resolver path with a warning so approving a lesson report
 * for an uncalculated session keeps working.
 */
async function buildDueInsertPayload(
  tx: DBTransaction,
  classInstance: ClassInstanceSelectType,
  teacher: NonNullable<Awaited<ReturnType<typeof TeacherRepository.findById>>>,
  input: DueAccrualInput
): Promise<TeacherDueInsertType> {
  // A refund raised from a never-calculated row keeps a NULL paid currency;
  // the teacher's rate currency (SAR as the terminal fallback, mirroring the
  // teacher-identity repo read) keeps the zero due settleable.
  const snapshotDue = resolveSnapshotDueAmount(classInstance, teacher.rateCurrency ?? CurrencyCode.SAR);
  if (snapshotDue) {
    return {
      teacherId: input.teacherId,
      classInstanceId: input.classInstanceId,
      studentId: input.studentId,
      hours: snapshotDue.hours,
      amount: snapshotDue.amount,
      currency: snapshotDue.currency,
      rateSource: snapshotDue.rateSource,
      status: TeacherDueStatus.PENDING,
      approvedByUserId: input.approvedByUserId,
      teacherPaymentId: null,
    };
  }

  logger.warn("Teacher due accrual fell back to legacy rate resolution", {
    classInstanceId: input.classInstanceId,
    calculationStatus: classInstance.calculationStatus,
  });

  // Resolve the effective hourly rate using the 4-tier precedence cascade:
  //   instance override > recurring schedule > subject > teacher.
  // The recurring schedule and subject are loaded within the same executor
  // (tx) so the resolution is consistent with the surrounding transaction.
  const recurringScheduleRow = classInstance.recurringScheduleId
    ? await RecurringScheduleRepository.findById(classInstance.recurringScheduleId, tx)
    : null;

  let subject: Awaited<ReturnType<typeof ClassSubjectRepository.getSubjectById>> | null = null;
  try {
    subject = await ClassSubjectRepository.getSubjectById(classInstance.subjectId, undefined, tx);
  } catch {
    // Subject may have been soft-deleted; fall back to teacher rate.
  }

  const resolved = resolveClassRate({
    classInstance,
    recurringSchedule: recurringScheduleRow?.schedule ?? null,
    subject,
    teacher,
  });

  const hourlyRateStr = resolved.hourlyRate;
  const rateCurrency = resolved.currency;
  const rateSource: RateSource = resolved.source;
  const durationMinutes = classInstance.durationMinutes;
  const hours = +(durationMinutes / 60).toFixed(2);
  const amount = +(Number.parseFloat(hourlyRateStr) * hours).toFixed(2);

  return {
    teacherId: input.teacherId,
    classInstanceId: input.classInstanceId,
    studentId: input.studentId,
    hours: String(hours),
    amount: String(amount),
    currency: rateCurrency,
    rateSource,
    status: TeacherDueStatus.PENDING,
    approvedByUserId: input.approvedByUserId,
    teacherPaymentId: null,
  };
}

/**
 * Moves a freshly accrued instance to `WAITING_PAID` and appends the payroll
 * transition event inside the accrual transaction. Instances already settled
 * or already awaiting settlement keep their state — settlement history is
 * never rewritten by the accrual path.
 *
 * The partial-share column must stay NULL outside `PARTIALLY` rows (schema
 * CHECK constraint), so a partial row entering settlement clears its share;
 * the transition event still records the share that produced the amount.
 */
async function markInstanceWaitingPaid(
  tx: DBTransaction,
  classInstance: ClassInstanceSelectType,
  actorUserId: string,
  locale?: string
): Promise<void> {
  if (!WAITING_PAID_ENTRY_STATUSES.has(classInstance.calculationStatus)) return;

  const updated = await SchedulingRepository.updatePayrollCalculation(tx, classInstance.id, {
    calculationStatus: CalculationStatus.WAITING_PAID,
    isPartialPercentage: null,
  });
  if (!updated) {
    const t = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(t.internalServerError);
  }

  const [event] = await ClassStatusEventsRepository.createMany(
    [
      buildPayrollTransitionEvent({
        classInstance,
        toStatus: CalculationStatus.WAITING_PAID,
        actorUserId,
        idempotencyKey: deriveAccrualIdempotencyKey(classInstance.id),
      }),
    ],
    tx
  );
  if (!event) {
    const t = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(t.internalServerError);
  }
}

/**
 * Inserts the due row and moves the instance payroll state to `WAITING_PAID`
 * inside one transaction, so a failed accrual can never leave the snapshot
 * half-settled. The instance row is locked for the status read, keeping the
 * read-then-flip sequence race-free against concurrent payroll writes.
 */
export async function accrueDueEntry(tx: DBTransaction, input: DueAccrualInput): Promise<TeacherDueReturnType> {
  const classInstance = await SchedulingRepository.getById(input.classInstanceId, tx, { forUpdate: true });
  if (!classInstance) {
    const t = getServerTranslations(input.locale ?? "en").errorsTranslations;
    throw new Error(t.scheduling.classInstanceNotFound({ id: input.classInstanceId }));
  }

  const teacher = await TeacherRepository.findById(input.teacherId, tx);
  if (!teacher) {
    const t = getServerTranslations(input.locale ?? "en").errorsTranslations;
    throw new Error(t.teacher.teacherNotFound(input.teacherId));
  }

  const insertPayload = await buildDueInsertPayload(tx, classInstance, teacher, input);

  const row: TeacherDueSelectType = await TeacherDueRepository.create(insertPayload, tx);

  await markInstanceWaitingPaid(tx, classInstance, input.approvedByUserId, input.locale);

  return row;
}

/**
 * Flips every linked instance still awaiting settlement to `PAID` and
 * appends one transition event per instance inside the settlement
 * transaction. Instances outside the settlement lifecycle — legacy rows that
 * never entered `WAITING_PAID`, or rows already settled — keep their state,
 * so re-running the payment mutation emits no second event. The batch read
 * is unlocked, so the flip is status-preconditioned: an instance whose
 * status was changed by a concurrent writer between the read and the flip
 * keeps that writer's committed state (skipped, logged, no event) instead
 * of being stomped to `PAID`.
 */
export async function markLinkedInstancesPaid(
  tx: DBTransaction,
  dueRows: TeacherDueSelectType[],
  actorUserId: string,
  teacherPaymentId: string,
  locale?: string
): Promise<void> {
  if (dueRows.length === 0) return;

  const instanceIds = [...new Set(dueRows.map(row => row.classInstanceId))];
  const instances = await tx.select().from(classInstances).where(inArray(classInstances.id, instanceIds));

  const awaiting = instances.filter(instance => instance.calculationStatus === CalculationStatus.WAITING_PAID);
  if (awaiting.length === 0) return;

  const eventRows = await awaiting.reduce(
    async (previous, instance) => {
      const events = await previous;
      const updated = await SchedulingRepository.updatePayrollCalculation(
        tx,
        instance.id,
        { calculationStatus: CalculationStatus.PAID },
        { expectedStatus: CalculationStatus.WAITING_PAID }
      );
      if (!updated) {
        // Expected race outcome, not a failure: a concurrent writer (a forced
        // override or a duplicate settlement) transitioned this instance
        // after the unlocked batch read. Its committed state stands — no
        // stomp and no duplicate transition event.
        logger.info("Skipped the payroll settlement flip: the instance status changed after the batch read", {
          classInstanceId: instance.id,
          teacherPaymentId,
        });
        return events;
      }
      return [
        ...events,
        buildPayrollTransitionEvent({
          classInstance: instance,
          toStatus: CalculationStatus.PAID,
          actorUserId,
          idempotencyKey: deriveSettlementIdempotencyKey(instance.id, teacherPaymentId),
        }),
      ];
    },
    Promise.resolve([] as ClassStatusEventSeedInsertInput[])
  );

  if (eventRows.length === 0) return;

  const inserted = await ClassStatusEventsRepository.createMany(eventRows, tx);
  if (inserted.length !== eventRows.length) {
    const t = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(t.internalServerError);
  }
}

export async function assertCanViewDues(actorUserId: string, teacherId: string, locale?: string): Promise<void> {
  const canViewAll = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
  if (canViewAll) return;

  const ownTeacher = await TeacherRepository.findByUserId(actorUserId);
  if (ownTeacher?.id === teacherId) return;

  const t = getServerTranslations(locale ?? "en").errorsTranslations;
  throw new Error(t.unauthorizedAction);
}
