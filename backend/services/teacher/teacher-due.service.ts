import { createHash } from "node:crypto";
import { inArray } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { ClassSubjectRepository } from "@/backend/db/repo/classes/class-subject.repository";
import {
  ClassStatusEventsRepository,
  RecurringScheduleRepository,
  SchedulingRepository,
} from "@/backend/db/repo/scheduling";
import { TeacherRepository } from "@/backend/db/repo/teachers/teacher.repository";
import { TeacherDueRepository } from "@/backend/db/repo/teachers/teacher-due.repository";
import { classInstances } from "@/backend/db/schema";
import { AppPermission, CalculationStatus, RateSource, TeacherDueStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { invalidateClassLifecycle } from "@/backend/services/cache";
import { resolveClassRate } from "@/backend/services/pricing/rate-resolver.service";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  DBTransaction,
  TeacherDueInsertType,
  TeacherDueReturnType,
  TeacherDueSelectType,
  TeacherMonthlyReportReturnType,
  TeacherPendingDuesSummaryReturnType,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { getServerTranslations } from "@/shared/locale";

/**
 * `class_status_events.eventType` is a plain varchar column with no TypeScript
 * enum counterpart — the payroll lifecycle transition kind is a module
 * constant (same convention as the payroll calculation service).
 */
const PAYROLL_STATUS_TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";

/**
 * Payroll snapshot statuses whose stored `teacherPaidAmount` is the
 * authoritative amount owed to the teacher.
 */
const AUTHORITATIVE_AMOUNT_STATUSES: ReadonlySet<CalculationStatus> = new Set([
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
]);

/**
 * Statuses that move to `WAITING_PAID` when a due accrues. Settled (`PAID`)
 * rows never regress, and rows already awaiting settlement keep their state,
 * so a repeat accrual (normally blocked by the one-due-per-instance unique
 * index) stays a no-op instead of duplicating the transition event.
 */
const WAITING_PAID_ENTRY_STATUSES: ReadonlySet<CalculationStatus> = new Set([
  CalculationStatus.NOT_CALCULATED,
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
]);

const MINUTES_PER_HOUR = 60;

interface DueAccrualInput {
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
 * Inserts the due row and moves the instance payroll state to `WAITING_PAID`
 * inside one transaction, so a failed accrual can never leave the snapshot
 * half-settled. The instance row is locked for the status read, keeping the
 * read-then-flip sequence race-free against concurrent payroll writes.
 */
async function accrueDueEntry(tx: DBTransaction, input: DueAccrualInput): Promise<TeacherDueReturnType> {
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
 * Flips every linked instance still awaiting settlement to `PAID` and
 * appends one transition event per instance inside the settlement
 * transaction. Instances outside the settlement lifecycle — legacy rows that
 * never entered `WAITING_PAID`, or rows already settled — keep their state,
 * so re-running the payment mutation emits no second event.
 */
async function markLinkedInstancesPaid(
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
      const updated = await SchedulingRepository.updatePayrollCalculation(tx, instance.id, {
        calculationStatus: CalculationStatus.PAID,
      });
      if (!updated) {
        const t = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(t.internalServerError);
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

  const inserted = await ClassStatusEventsRepository.createMany(eventRows, tx);
  if (inserted.length !== eventRows.length) {
    const t = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(t.internalServerError);
  }
}

export namespace TeacherDueService {
  async function assertCanViewDues(actorUserId: string, teacherId: string, locale?: string): Promise<void> {
    const canViewAll = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
    if (canViewAll) return;

    const ownTeacher = await TeacherRepository.findByUserId(actorUserId);
    if (ownTeacher?.id === teacherId) return;

    const t = getServerTranslations(locale ?? "en").errorsTranslations;
    throw new Error(t.unauthorizedAction);
  }

  /**
   * Accrues a teacher due row for an approved lesson report. When the linked
   * class instance carries a calculated payroll snapshot
   * (`CALCULATED` / `PARTIALLY` / `REFUND`), the snapshot's
   * `teacherPaidAmount` / `teacherPaidCurrency` become the authoritative due
   * amount and the rate cascade is skipped; otherwise the legacy
   * rate-resolver path produces the amount and a warning is logged. Either
   * way the instance payroll state moves to `WAITING_PAID` and a
   * `PAYROLL_STATUS_TRANSITION` event is appended — in the same transaction
   * as the due insert.
   */
  export async function createDueEntry(
    classInstanceId: string,
    teacherId: string,
    studentId: string,
    approvedByUserId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherDueReturnType> {
    logger.info("Creating teacher due entry", { classInstanceId, teacherId, studentId });

    const input: DueAccrualInput = { classInstanceId, teacherId, studentId, approvedByUserId, locale };
    // The due row and the payroll lifecycle flip must commit atomically, so a
    // caller without a transaction gets a dedicated one.
    const row = tx ? await accrueDueEntry(tx, input) : await db.transaction(innerTx => accrueDueEntry(innerTx, input));

    try {
      await invalidateClassLifecycle(teacherId, undefined);
    } catch (cacheErr) {
      logger.error("Failed to invalidate class lifecycle tags after creating due entry", {
        teacherId,
        error: cacheErr,
      });
    }

    return row;
  }

  /**
   * Seed-only bootstrap: idempotent insert of a teacher due row for an approved
   * lesson report. Skips permission checks (the seed caller is admin) and
   * allows the caller to specify a PAID status directly with a link to an
   * existing teacher payment id (so paid-out dues are also seeded without
   * needing to go through the public mark-as-paid API). Uses the existing
   * `findByClassInstanceId` helper for idempotency (one due per class instance
   * — enforced by DB unique index).
   */
  export async function seedTeacherDueIfMissing(input: {
    classInstanceId: string;
    teacherId: string;
    studentId: string;
    hours: number;
    amount: number;
    currency: CurrencyCode;
    rateSource?: RateSource;
    approvedByUserId: string;
    status?: TeacherDueStatus;
    teacherPaymentId?: string | null;
    approvedAt?: Date;
    tx?: DBTransaction;
    locale?: string;
  }): Promise<TeacherDueReturnType | null> {
    const existing = await TeacherDueRepository.findByClassInstanceId(input.classInstanceId, input.tx);
    if (existing) {
      return existing;
    }

    const t = getServerTranslations(input.locale ?? "en").errorsTranslations;
    if (input.hours <= 0) throw new Error(t.teacherDue.hoursMustBePositive);
    if (input.amount < 0) throw new Error(t.teacherDue.amountMustBeNonNegative);

    const insertPayload: TeacherDueInsertType = {
      teacherId: input.teacherId,
      classInstanceId: input.classInstanceId,
      studentId: input.studentId,
      hours: input.hours.toFixed(2),
      amount: input.amount.toFixed(2),
      currency: input.currency,
      rateSource: input.rateSource ?? RateSource.TEACHER,
      status: input.status ?? TeacherDueStatus.PENDING,
      approvedByUserId: input.approvedByUserId,
      teacherPaymentId: input.teacherPaymentId ?? null,
      ...(input.approvedAt ? { approvedAt: input.approvedAt } : {}),
    };

    const row: TeacherDueSelectType = await TeacherDueRepository.create(insertPayload, input.tx);
    return row;
  }

  export async function getMonthlyReport(
    actorUserId: string,
    teacherId: string,
    year: number,
    month: number,
    locale?: string
  ): Promise<TeacherMonthlyReportReturnType> {
    await assertCanViewDues(actorUserId, teacherId, locale);
    return TeacherDueRepository.getMonthlyReport(teacherId, year, month);
  }

  export async function getPendingDues(
    actorUserId: string,
    teacherId: string | undefined,
    locale?: string
  ): Promise<TeacherDueReturnType[]> {
    if (teacherId) {
      await assertCanViewDues(actorUserId, teacherId, locale);
    } else {
      const canViewAll = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
      if (!canViewAll) {
        const t = getServerTranslations(locale ?? "en").errorsTranslations;
        throw new Error(t.unauthorizedAction);
      }
    }
    const rows = await TeacherDueRepository.getPendingDues(teacherId);
    return rows;
  }

  export async function getPendingDuesSummary(
    actorUserId: string,
    locale?: string
  ): Promise<TeacherPendingDuesSummaryReturnType> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_VIEW);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(t.insufficientPermissions);
    }
    return TeacherDueRepository.getPendingDuesSummary();
  }

  /**
   * Marks a batch of dues as paid through a teacher payment. Besides the due
   * status write, every linked instance still awaiting settlement flips to
   * `PAID` with a `PAYROLL_STATUS_TRANSITION` event — all inside one
   * transaction, so a payment is either fully recorded or not at all.
   */
  export async function markAsPaid(
    actorUserId: string,
    dueIds: readonly string[],
    teacherPaymentId: string,
    locale?: string
  ): Promise<TeacherDueReturnType[]> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.TEACHER_DUES_MARK_PAID);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(t.insufficientPermissions);
    }

    const updated = await db.transaction(async tx => {
      const dueRows = await TeacherDueRepository.markAsPaid([...dueIds], teacherPaymentId, tx);
      await markLinkedInstancesPaid(tx, dueRows, actorUserId, teacherPaymentId, locale);
      return dueRows;
    });

    try {
      const teacherIds = [...new Set(updated.map(d => d.teacherId))];
      await Promise.all(teacherIds.map(tid => invalidateClassLifecycle(tid, undefined)));
    } catch (cacheErr) {
      logger.error("Failed to invalidate class lifecycle tags after marking dues as paid", { error: cacheErr });
    }

    return updated;
  }
}
