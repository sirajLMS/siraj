import { eq, inArray } from "drizzle-orm";
import { db } from "@/backend/db";
import {
  AuditRepository,
  BillingRepository,
  CarryoverBalanceRepository,
  TeacherRepository,
  UserRepository,
} from "@/backend/db/repo";
import { ClassStatusEventsRepository, SchedulingRepository } from "@/backend/db/repo/scheduling";
import { acquireAdvisoryLock } from "@/backend/db/repo/shared";
import { carryoverBalanceItems, students } from "@/backend/db/schema";
import { AppPermission, CalculationStatus, ExpenseType } from "@/backend/enum";
import { DomainError, logger, NotFoundError, sanitizePlainText, ValidationError } from "@/backend/lib";
import { EXPENSE_SOURCE_CARRYOVER_BALANCES, ExpenseService } from "@/backend/services";
import { requirePermission } from "@/backend/services/billing/permission-utils";
import { AuditService } from "@/backend/services/system/audit.service";
import {
  computeTotalDurationHours,
  groupInstancesByTeacher,
  maxDate,
  minDate,
  pickDominantCurrency,
  resolveDominantCurrency,
  truncateWithEllipsis,
} from "@/backend/services/teachers/carryover-aggregate";
import {
  deriveBulkCreateIdempotencyKey,
  deriveBulkToExpenseIdempotencyKey,
  deriveCrudIdempotencyKey,
} from "@/backend/services/teachers/carryover-idempotency";
import type {
  AuditAction,
  AuditLogReturnType,
  BulkCreateCarryoverGroupResult,
  BulkCreateCarryoverInput,
  BulkCreateCarryoverResult,
  BulkDeleteCarryoverInput,
  BulkDeleteCarryoverResult,
  BulkToExpenseInput,
  BulkToExpenseItemResult,
  BulkToExpenseResult,
  CarryoverBalanceItemInsertType,
  CarryoverBalanceItemSelectType,
  CarryoverBalanceSelectType,
  CarryoverFilters,
  CarryoverLinkedSession,
  CarryoverLinkedSessionRow,
  CarryoverPage,
  CarryoverPaidRowCounts,
  CarryoverRow,
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  CreateAuditLogInput,
  CreateCarryoverInput,
  DBTransaction,
  DeleteCarryoverInput,
  DeleteCarryoverResult,
  UnpayCarryoverInput,
  UpdateCarryoverInput,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

/** `class_status_events.eventType` is a plain varchar column — payroll event kinds are module constants. */
const PAYROLL_STATUS_TRANSITION_EVENT_TYPE = "PAYROLL_STATUS_TRANSITION";

/** Duplicate submissions inside this window collapse onto the first-applied result. */
const IDEMPOTENCY_WINDOW_SECONDS = 60;

/** Replay lookups page through the audit window in chunks of this size. */
const REPLAY_LOOKUP_PAGE_SIZE = 500;

/** Defensive bound on replay-scan pages; the window holds far fewer rows in practice. */
const REPLAY_LOOKUP_MAX_PAGES = 50;

/** Aggregates scan the filtered set, bounded to the same ceiling as the CSV export. */
const REPORT_AGGREGATE_ROW_CAP = 10_000;

/** Persisted representation of an unsettled amount. */
const ZERO_AMOUNT = "0";

/** `carryover_balances.students_text` column limit. */
const STUDENTS_TEXT_MAX_LENGTH = 500;

const CARRYOVER_AUDIT_ENTITY_TYPE = "CARRYOVER_BALANCE";

/** Fallback aggregation currency when the teacher has no rate currency configured. */
const DEFAULT_AGGREGATE_CURRENCY = CurrencyCode.SAR;

const MINOR_UNITS_BASE = 100n;
const FX_RATE_SCALE = 1_000_000n;
const FX_RATE_HALF_SCALE = FX_RATE_SCALE / 2n;

// Domains expand this union as new audit actions are introduced — the carryover
// mutations emit the four settlement actions below.
const CARRYOVER_ACTION_CREATE: AuditAction = "CARRYOVER_CREATE";
const CARRYOVER_ACTION_TO_EXPENSE: AuditAction = "CARRYOVER_TO_EXPENSE";
const CARRYOVER_ACTION_DELETE: AuditAction = "CARRYOVER_DELETE";
const CARRYOVER_ACTION_UNPAID: AuditAction = "CARRYOVER_UNPAID";

interface TeacherDisplayFields {
  teacherName: string;
  teacherAvatarUrl: string | null;
}

interface SessionStatusTransition {
  instanceId: string;
  fromStatus: CalculationStatus;
  toStatus: CalculationStatus;
  teacherPaidAmount: string | null;
  /**
   * `class_instances_partial_percentage_chk` ties the live partial-pay
   * percentage to the PARTIALLY status, so every transition drives the column
   * explicitly: null when the target is not PARTIALLY, the snapshot value when
   * reverting back to it.
   */
  isPartialPercentage: number | null;
}

// One snapshot per aggregated session; the carryover id is attached at insert
// time once the parent row exists.
type CarryoverItemDraft = Omit<CarryoverBalanceItemInsertType, "carryoverId" | "id" | "createdAt">;

// ---------------------------------------------------------------------------
// Decimal-string money helpers (integer minor units end-to-end)
// ---------------------------------------------------------------------------

/** Parses a two-decimal amount string into integer minor units; null when malformed. */
function toAmountMinorUnits(amount: string): bigint | null {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) return null;
  const digits = match[2];
  const fraction = match[3];
  if (digits == null) return null;
  const units = BigInt(digits) * MINOR_UNITS_BASE + BigInt((fraction ?? "").padEnd(2, "0"));
  return match[1] === "-" ? -units : units;
}

/** Renders minor units back into the canonical two-decimal amount string. */
function formatAmountMinorUnits(units: bigint): string {
  const sign = units < 0n ? "-" : "";
  const absolute = units < 0n ? -units : units;
  const remainder = `${absolute % MINOR_UNITS_BASE}`.padStart(2, "0");
  return `${sign}${absolute / MINOR_UNITS_BASE}.${remainder}`;
}

/** Sums decimal-string amounts as exact integer minor units. */
function sumAmounts(amounts: readonly string[]): string {
  return formatAmountMinorUnits(amounts.reduce((total, amount) => total + (toAmountMinorUnits(amount) ?? 0n), 0n));
}

/** Multiplies a two-decimal amount by an FX rate string (up to 6 fractional digits), rounding half-up. */
function convertAmountWithRate(amount: string, rate: string): string | null {
  const units = toAmountMinorUnits(amount);
  const rateMatch = /^(\d+)(?:\.(\d{1,6}))?$/.exec(rate.trim());
  const rateDigits = rateMatch?.[1];
  if (units == null || rateDigits == null) return null;
  const scaledRate = BigInt(rateDigits) * FX_RATE_SCALE + BigInt((rateMatch?.[2] ?? "").padEnd(6, "0"));
  return formatAmountMinorUnits((units * scaledRate + FX_RATE_HALF_SCALE) / FX_RATE_SCALE);
}

// ---------------------------------------------------------------------------
// Sequential iteration inside a shared transaction
// ---------------------------------------------------------------------------

/** Applies `handle` to each item in order; the shared transaction connection must never see interleaved calls. */
async function forEachInSequence<T>(items: readonly T[], handle: (item: T) => Promise<void>): Promise<void> {
  await items.reduce(async (previous, item) => {
    await previous;
    await handle(item);
  }, Promise.resolve());
}

/** Maps items to results, awaiting each step in order for the same shared-connection reason. */
async function mapInSequence<T, R>(items: readonly T[], handle: (item: T) => Promise<R>): Promise<R[]> {
  return items.reduce<Promise<R[]>>(async (previous, item) => {
    const results = await previous;
    results.push(await handle(item));
    return results;
  }, Promise.resolve([]));
}

// ---------------------------------------------------------------------------
// Audit metadata guards + replay lookup
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMetadataKey(metadata: unknown): string | null {
  if (!isRecord(metadata)) return null;
  const key = metadata.idempotencyKey;
  return typeof key === "string" ? key : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value.every(element => typeof element === "string") ? value : null;
}

const CURRENCY_BY_VALUE: ReadonlyMap<string, CurrencyCode> = new Map(
  Object.values(CurrencyCode).map(currency => [currency, currency])
);

function readCurrency(value: unknown): CurrencyCode | null {
  if (typeof value !== "string") return null;
  return CURRENCY_BY_VALUE.get(value) ?? null;
}

/** Pages the actor's audit window into `collected`, deduping by log id; recursion keeps the sequential reads lint-clean. */
async function scanAuditWindowPages(
  tx: DBTransaction,
  actorUserId: string,
  action: AuditAction,
  windowStart: Date,
  collected: Map<string, AuditLogReturnType>,
  offset: number,
  page: number
): Promise<void> {
  if (page >= REPLAY_LOOKUP_MAX_PAGES) return;
  const result = await AuditRepository.queryAuditLogs(
    { actorUserId, action, startDate: windowStart, limit: REPLAY_LOOKUP_PAGE_SIZE, offset },
    tx
  );
  if (result.logs.length === 0) return;
  for (const log of result.logs) {
    collected.set(log.id, log);
  }
  if (collected.size >= result.total) return;
  await scanAuditWindowPages(tx, actorUserId, action, windowStart, collected, offset + result.logs.length, page + 1);
}

/**
 * Finds audit rows matching the replay key for one actor + action inside the
 * idempotency window, newest first. The lookup pages through the whole actor
 * window (a bulk batch can emit up to 500 audit rows, above any single page),
 * deduping by log id to survive concurrent front-of-window inserts shifting
 * pages, and sorts the matches deterministically so the reconstructed replay
 * never depends on page boundaries.
 */
async function findReplayAuditLogs(
  tx: DBTransaction,
  actorUserId: string,
  action: AuditAction,
  idempotencyKey: string
): Promise<AuditLogReturnType[]> {
  const windowStart = new Date(Date.now() - IDEMPOTENCY_WINDOW_SECONDS * 1000);
  const collected = new Map<string, AuditLogReturnType>();
  await scanAuditWindowPages(tx, actorUserId, action, windowStart, collected, 0, 0);
  return [...collected.values()]
    .filter(log => readMetadataKey(log.metadata) === idempotencyKey)
    .toSorted(compareAuditLogsForReplay);
}

/** Newest first, with the id tiebreak keeping ties (one bulk batch shares a timestamp) deterministic. */
function compareAuditLogsForReplay(a: AuditLogReturnType, b: AuditLogReturnType): number {
  const byTime = b.createdAt.getTime() - a.createdAt.getTime();
  if (byTime !== 0) return byTime;
  if (a.id === b.id) return 0;
  return a.id < b.id ? 1 : -1;
}

function parseReplayGroup(log: AuditLogReturnType): BulkCreateCarryoverGroupResult | null {
  const metadata = log.metadata;
  if (!isRecord(metadata)) return null;
  const teacherId = readString(metadata.teacherId);
  const studentsCount = readNumber(metadata.studentsCount);
  const totalDuration = readString(metadata.totalDuration);
  const payable = readString(metadata.payable);
  const currency = readCurrency(metadata.currency);
  const instanceIds = readStringArray(metadata.instanceIds);
  if (teacherId == null || studentsCount == null || totalDuration == null || payable == null) return null;
  if (currency == null || instanceIds == null) return null;
  return { teacherId, carryoverId: log.entityId, studentsCount, totalDuration, payable, currency, instanceIds };
}

function parseReplayExpenseItem(log: AuditLogReturnType): BulkToExpenseItemResult | null {
  const metadata = log.metadata;
  if (!isRecord(metadata)) return null;
  const expenseId = readString(metadata.expenseId);
  const amount = readString(metadata.amount);
  const currency = readCurrency(metadata.currency);
  if (expenseId == null || amount == null || currency == null) return null;
  return { carryoverId: log.entityId, expenseId, amount, currency };
}

async function emitCarryoverAuditLogs(tx: DBTransaction, inputs: CreateAuditLogInput[]): Promise<string[]> {
  const inserted = await AuditService.createManyAuditLogs(inputs, tx);
  return inserted.map(log => log.id);
}

async function emitCarryoverAuditLog(tx: DBTransaction, input: CreateAuditLogInput): Promise<string | null> {
  const ids = await emitCarryoverAuditLogs(tx, [input]);
  return ids[0] ?? null;
}

// ---------------------------------------------------------------------------
// Teacher / student display resolution
// ---------------------------------------------------------------------------

/** Resolves the teacher's display name + avatar; missing rows fall back rather than failing the report. */
async function resolveTeacherDisplay(
  teacherId: string,
  tx: DBTransaction | undefined,
  fallbackName: string
): Promise<TeacherDisplayFields> {
  const teacher = await TeacherRepository.findById(teacherId, tx);
  if (teacher == null) return { teacherName: fallbackName, teacherAvatarUrl: null };
  const usersById = await UserRepository.findByIds([teacher.userId], tx);
  const user = usersById.get(teacher.userId);
  return { teacherName: user?.name ?? fallbackName, teacherAvatarUrl: user?.avatarUrl ?? null };
}

async function toCarryoverRow(
  row: CarryoverBalanceSelectType,
  tx: DBTransaction | undefined,
  fallbackName: string
): Promise<CarryoverRow> {
  const display = await resolveTeacherDisplay(row.teacherId, tx, fallbackName);
  return mapCarryoverRow(row, display);
}

function mapCarryoverRow(row: CarryoverBalanceSelectType, display: TeacherDisplayFields): CarryoverRow {
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: display.teacherName,
    teacherAvatarUrl: display.teacherAvatarUrl,
    studentsCount: row.studentsCount,
    studentsText: row.studentsText,
    totalDuration: row.totalDuration,
    payable: row.payable,
    teacherCurrency: row.teacherCurrency,
    paid: row.paid,
    fromDate: row.fromDate,
    toDate: row.toDate,
    paymentDate: row.paymentDate,
    isDisabledTeacher: row.isDisabledTeacher,
    isPaid: row.isPaid,
    expenseId: row.expenseId,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
  };
}

/**
 * Student display names for a group of instances, read inside the caller's
 * transaction so freshly created fixtures and concurrent edits are visible.
 * `students.name` is a denormalized snapshot column owned by the student row.
 */
async function buildStudentsSummary(
  instances: readonly ClassInstanceSelectType[],
  tx: DBTransaction
): Promise<{ text: string | null; count: number }> {
  const studentIds = [
    ...new Set(instances.map(instance => instance.studentId).filter((id): id is string => id != null)),
  ];
  if (studentIds.length === 0) return { text: null, count: 0 };
  const rows = await tx
    .select({ id: students.id, name: students.name })
    .from(students)
    .where(inArray(students.id, studentIds));
  const nameById = new Map(rows.map(row => [row.id, row.name]));
  const names = studentIds.map(id => nameById.get(id)).filter((name): name is string => name != null);
  const joined = names.join(", ");
  if (joined.length <= STUDENTS_TEXT_MAX_LENGTH) {
    return { text: joined, count: studentIds.length };
  }
  logger.warn("Carryover students text truncated", { studentsCount: studentIds.length, fullLength: joined.length });
  return { text: truncateWithEllipsis(joined, STUDENTS_TEXT_MAX_LENGTH), count: studentIds.length };
}

// ---------------------------------------------------------------------------
// Identifier validation
// ---------------------------------------------------------------------------

/** Canonical hyphenated uuid shape; anything else cannot name a row in the uuid-typed id columns. */
const UUID_CANONICAL_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Rejects malformed identifiers before they reach the query layer: the uuid
 * columns would reject them with a raw database syntax error, leaking a 500
 * where a plain not-found is the correct contract.
 */
function assertUuidId(id: string, notFound: (value: string) => NotFoundError): void {
  if (!UUID_CANONICAL_PATTERN.test(id)) {
    throw notFound(id);
  }
}

function assertCarryoverIdShape(id: string, tErrors: ErrorsLabels): void {
  assertUuidId(id, value => new NotFoundError("CARRYOVER", tErrors.carryover.notFound(value)));
}

function assertCarryoverIdsShape(ids: readonly string[], tErrors: ErrorsLabels): void {
  for (const id of ids) {
    assertCarryoverIdShape(id, tErrors);
  }
}

function assertInstanceIdsShape(ids: readonly string[], tErrors: ErrorsLabels): void {
  for (const id of ids) {
    assertUuidId(
      id,
      value => new NotFoundError("CLASS_INSTANCE", tErrors.scheduling.classInstanceNotFound({ id: value }))
    );
  }
}

function assertTeacherIdShape(teacherId: string, tErrors: ErrorsLabels): void {
  assertUuidId(teacherId, value => new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(value)));
}

// ---------------------------------------------------------------------------
// Session transitions
// ---------------------------------------------------------------------------

function buildTransitionEvent(
  transition: SessionStatusTransition,
  description: string,
  actorUserId: string
): ClassStatusEventSeedInsertInput {
  return {
    classInstanceId: transition.instanceId,
    eventType: PAYROLL_STATUS_TRANSITION_EVENT_TYPE,
    fromState: { calculationStatus: transition.fromStatus, teacherPaidAmount: transition.teacherPaidAmount },
    toState: { calculationStatus: transition.toStatus },
    description,
    actorUserId,
    createdAt: new Date(),
  };
}

/**
 * Moves every session to its target payroll status under the caller's
 * transaction, then appends one PAYROLL_STATUS_TRANSITION event per move.
 * Status writes run first so the events always describe committed-to state.
 * The partial-pay percentage travels with the status because the
 * partial-percentage CHECK binds the column to PARTIALLY rows.
 */
async function transitionSessions(
  tx: DBTransaction,
  transitions: readonly SessionStatusTransition[],
  description: string,
  actorUserId: string
): Promise<void> {
  if (transitions.length === 0) return;
  await forEachInSequence(transitions, async transition => {
    await SchedulingRepository.updatePayrollCalculation(tx, transition.instanceId, {
      calculationStatus: transition.toStatus,
      isPartialPercentage: transition.isPartialPercentage,
    });
  });
  const events = transitions.map(transition => buildTransitionEvent(transition, description, actorUserId));
  await ClassStatusEventsRepository.createMany(events, tx);
}

// ---------------------------------------------------------------------------
// Item snapshots + carryover snapshot reads
// ---------------------------------------------------------------------------

/** Item snapshots for a carryover, read inside the caller's transaction. */
async function listCarryoverItems(tx: DBTransaction, carryoverId: string): Promise<CarryoverBalanceItemSelectType[]> {
  return tx.select().from(carryoverBalanceItems).where(eq(carryoverBalanceItems.carryoverId, carryoverId));
}

const CALCULATION_STATUS_BY_VALUE: ReadonlyMap<string, CalculationStatus> = new Map(
  Object.values(CalculationStatus).map(status => [status, status])
);

function parseStoredCalculationStatus(value: string): CalculationStatus | null {
  return CALCULATION_STATUS_BY_VALUE.get(value) ?? null;
}

/**
 * Percentage captured on a PARTIALLY item snapshot. A PARTIALLY session always
 * carries one on the live row (the partial-percentage CHECK enforces it), so a
 * snapshot without it is corrupt and must fail the revert before any session
 * moves to a state the CHECK would reject.
 */
function readSnapshotPartialPercentage(item: CarryoverBalanceItemSelectType, tErrors: ErrorsLabels): number {
  if (item.originalPartialPercentage == null) {
    throw new DomainError("CARRYOVER_SNAPSHOT_INVALID", tErrors.internalServerError);
  }
  return item.originalPartialPercentage;
}

// ---------------------------------------------------------------------------
// FX rate resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the latest exchange rate for a cross-currency session amount.
 * Missing or stale rates reject the whole aggregation — a settlement must
 * never convert with out-of-date prices or invent a rate.
 */
async function resolveFxRate(
  tx: DBTransaction,
  originalCurrency: CurrencyCode,
  dominantCurrency: CurrencyCode,
  tErrors: ErrorsLabels
): Promise<string> {
  const latest = await BillingRepository.getLatestExchangeRateForDisplay(originalCurrency, dominantCurrency, tx);
  if (latest.rate == null || latest.stale) {
    throw new DomainError("CARRYOVER_FX_RATE_MISSING", tErrors.carryover.fxRateMissing);
  }
  return latest.rate;
}

// ---------------------------------------------------------------------------
// Expense ledger integration
// ---------------------------------------------------------------------------

/**
 * The expense ledger (`ExpenseService`) owns the canonical `expenses` write
 * path: the settlement flow creates one row per carryover through
 * `createInternal` inside its own transaction, and the unpay flow soft-deletes
 * that row through `softDelete` inside the same transaction. The ledger's 60 s
 * replay window keys on `clientRequestId`, so the seed composes the bulk
 * settlement key with the carryover id — a same-window retry of an individual
 * conversion returns the originally persisted expense instead of a duplicate.
 */
function deriveExpenseClientRequestId(idempotencyKey: string, carryoverId: string): string {
  return `carryover-to-expense:${idempotencyKey}:${carryoverId}`;
}

// ---------------------------------------------------------------------------
// Bulk create internals
// ---------------------------------------------------------------------------

/** Audited payroll states eligible for carryover aggregation. */
const AUDITED_STATUSES: ReadonlySet<CalculationStatus> = new Set([
  CalculationStatus.CALCULATED,
  CalculationStatus.PARTIALLY,
  CalculationStatus.REFUND,
]);

function assertAllInstancesFound(
  instances: readonly ClassInstanceSelectType[],
  instanceIds: readonly string[],
  tErrors: ErrorsLabels
): void {
  if (instances.length === instanceIds.length) return;
  const foundIds = new Set(instances.map(instance => instance.id));
  const missingId = instanceIds.find(id => !foundIds.has(id));
  throw new NotFoundError("CLASS_INSTANCE", tErrors.scheduling.classInstanceNotFound({ id: missingId ?? "" }));
}

/** Every selected session must be audited and not already attached to a carryover. */
function validateInstancesForCarryover(instances: readonly ClassInstanceSelectType[], tErrors: ErrorsLabels): void {
  for (const instance of instances) {
    if (!AUDITED_STATUSES.has(instance.calculationStatus)) {
      throw new DomainError("CARRYOVER_SESSION_NOT_AUDITED", tErrors.carryover.sessionNotAudited);
    }
    if (instance.carryoverBalanceId != null) {
      throw new DomainError("CARRYOVER_SESSION_ALREADY_LINKED", tErrors.carryover.sessionAlreadyLinked);
    }
  }
}

/**
 * Builds the per-session snapshot items and the aggregate payable for one
 * teacher group. Sessions whose currency matches the dominant currency keep
 * `convertedAmount` null; cross-currency sessions convert through the latest
 * FX rate and preserve the original amounts on the item row.
 */
async function buildItemDrafts(
  tx: DBTransaction,
  instances: readonly ClassInstanceSelectType[],
  dominantCurrency: CurrencyCode,
  tErrors: ErrorsLabels
): Promise<{ drafts: CarryoverItemDraft[]; payable: string }> {
  let payableMinorUnits = 0n;
  const drafts = await mapInSequence(instances, async instance => {
    const originalAmount = instance.teacherPaidAmount ?? ZERO_AMOUNT;
    const originalCurrency = instance.teacherPaidCurrency ?? dominantCurrency;
    let convertedAmount: string | null = null;
    let convertedCurrency: CurrencyCode | null = null;
    if (originalCurrency !== dominantCurrency) {
      const rate = await resolveFxRate(tx, originalCurrency, dominantCurrency, tErrors);
      convertedAmount = convertAmountWithRate(originalAmount, rate);
      if (convertedAmount == null) {
        throw new DomainError("CARRYOVER_AMOUNT_INVALID", tErrors.internalServerError);
      }
      convertedCurrency = dominantCurrency;
    }
    const payableUnits = toAmountMinorUnits(convertedAmount ?? originalAmount);
    if (payableUnits == null) {
      throw new DomainError("CARRYOVER_AMOUNT_INVALID", tErrors.internalServerError);
    }
    payableMinorUnits += payableUnits;
    const draft: CarryoverItemDraft = {
      classInstanceId: instance.id,
      originalAmount,
      originalCurrency,
      originalStatus: instance.calculationStatus,
      originalPartialPercentage: instance.isPartialPercentage,
      convertedAmount,
      convertedCurrency,
    };
    return draft;
  });
  return { drafts, payable: formatAmountMinorUnits(payableMinorUnits) };
}

interface GroupCreationOutcome {
  group: BulkCreateCarryoverGroupResult;
  auditLogId: string | null;
}

interface PreparedGroupCarryover {
  carryover: CarryoverBalanceSelectType;
  drafts: CarryoverItemDraft[];
  dominantCurrency: CurrencyCode;
  studentsCount: number;
  totalDuration: string;
  payable: string;
}

/** Resolves the group's aggregate values (dominant currency, students text, hours, payable) and inserts the carryover row. */
async function insertGroupCarryoverRow(
  tx: DBTransaction,
  teacherId: string,
  groupInstances: ClassInstanceSelectType[],
  note: string | null,
  actorUserId: string,
  tErrors: ErrorsLabels
): Promise<PreparedGroupCarryover> {
  const teacher = await TeacherRepository.findById(teacherId, tx);
  if (teacher == null) {
    throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(teacherId));
  }

  const dominantCurrency = resolveDominantCurrency(groupInstances, teacher.rateCurrency ?? DEFAULT_AGGREGATE_CURRENCY);
  const studentsSummary = await buildStudentsSummary(groupInstances, tx);
  const totalDuration = computeTotalDurationHours(groupInstances);
  const { drafts, payable } = await buildItemDrafts(tx, groupInstances, dominantCurrency, tErrors);
  const isDisabledTeacher = await TeacherRepository.isDisabled(teacherId, tx);

  const carryover = await CarryoverBalanceRepository.create(
    {
      teacherId,
      studentsCount: studentsSummary.count,
      studentsText: studentsSummary.text,
      totalDuration,
      payable,
      teacherCurrency: dominantCurrency,
      paid: ZERO_AMOUNT,
      fromDate: minDate(groupInstances.map(instance => instance.scheduledStartAt)),
      toDate: maxDate(groupInstances.map(instance => instance.scheduledStartAt)),
      paymentDate: null,
      isDisabledTeacher,
      isPaid: false,
      expenseId: null,
      note,
      createdByUserId: actorUserId,
    },
    tx
  );

  return {
    carryover,
    drafts,
    dominantCurrency,
    studentsCount: studentsSummary.count,
    totalDuration,
    payable,
  };
}

/** Persists the item snapshots, links the sessions, and moves them to WAITING_PAID. */
async function linkGroupSessionsToCarryover(
  tx: DBTransaction,
  groupInstances: readonly ClassInstanceSelectType[],
  drafts: readonly CarryoverItemDraft[],
  carryoverId: string,
  actorUserId: string
): Promise<string[]> {
  await CarryoverBalanceRepository.insertItems(
    drafts.map(draft => Object.assign({}, draft, { carryoverId })),
    tx
  );
  const groupInstanceIds = groupInstances.map(instance => instance.id);
  await SchedulingRepository.linkToCarryover(groupInstanceIds, carryoverId, tx);
  await transitionSessions(
    tx,
    groupInstances.map(instance => ({
      instanceId: instance.id,
      fromStatus: instance.calculationStatus,
      toStatus: CalculationStatus.WAITING_PAID,
      teacherPaidAmount: instance.teacherPaidAmount ?? null,
      isPartialPercentage: null,
    })),
    `Linked to carryover ${carryoverId}`,
    actorUserId
  );
  return groupInstanceIds;
}

/** Creates one carryover (items, session link + transitions, audit row) for a single teacher group. */
async function createCarryoverForGroup(
  tx: DBTransaction,
  teacherId: string,
  groupInstances: ClassInstanceSelectType[],
  note: string | null,
  actorUserId: string,
  idempotencyKey: string,
  tErrors: ErrorsLabels
): Promise<GroupCreationOutcome> {
  const prepared = await insertGroupCarryoverRow(tx, teacherId, groupInstances, note, actorUserId, tErrors);
  const groupInstanceIds = await linkGroupSessionsToCarryover(
    tx,
    groupInstances,
    prepared.drafts,
    prepared.carryover.id,
    actorUserId
  );

  const auditLogId = await emitCarryoverAuditLog(tx, {
    actorUserId,
    actorType: "USER",
    entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
    entityId: prepared.carryover.id,
    action: CARRYOVER_ACTION_CREATE,
    metadata: {
      idempotencyKey,
      teacherId,
      instanceIds: groupInstanceIds,
      studentsCount: prepared.studentsCount,
      totalDuration: prepared.totalDuration,
      payable: prepared.payable,
      currency: prepared.dominantCurrency,
    },
  });

  return {
    group: {
      teacherId,
      carryoverId: prepared.carryover.id,
      studentsCount: prepared.studentsCount,
      totalDuration: prepared.totalDuration,
      payable: prepared.payable,
      currency: prepared.dominantCurrency,
      instanceIds: groupInstanceIds,
    },
    auditLogId,
  };
}

/** Rebuilds the original bulk-create result from the persisted audit rows, in creation order. */
function reconstructBulkCreate(
  logs: readonly AuditLogReturnType[],
  instanceIds: string[]
): BulkCreateCarryoverResult | null {
  if (logs.length === 0) return null;
  const groups: BulkCreateCarryoverGroupResult[] = [];
  const auditLogIds: string[] = [];
  for (const log of logs.toReversed()) {
    const group = parseReplayGroup(log);
    if (group == null) return null;
    groups.push(group);
    auditLogIds.push(log.id);
  }
  return { groups, totalInstanceIds: instanceIds, auditLogIds };
}

export namespace CarryoverBalanceService {
  /**
   * Aggregates audited class instances into one carryover balance per
   * teacher: locks the selected sessions, validates they are audited and
   * unlinked, converts cross-currency amounts into each group's dominant
   * currency, inserts the carryover + item snapshots, links the sessions and
   * moves them to WAITING_PAID, and emits one audit row per created carryover.
   * A same-content re-submit inside the idempotency window replays the
   * originally persisted result.
   */
  export async function bulkCreateCarryoverBalances(
    input: BulkCreateCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<BulkCreateCarryoverResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

    const instanceIds = [...new Set(input.instanceIds)];
    if (instanceIds.length === 0) {
      throw new ValidationError(tErrors.carryover.noInstances);
    }
    assertInstanceIdsShape(instanceIds, tErrors);
    const note = input.note == null ? null : sanitizePlainText(input.note);
    const idempotencyKey = deriveBulkCreateIdempotencyKey(input);

    return db.transaction(async tx => {
      await acquireAdvisoryLock(tx, `carryover-bulk-create:${idempotencyKey}`);

      const replayLogs = await findReplayAuditLogs(tx, input.actorUserId, CARRYOVER_ACTION_CREATE, idempotencyKey);
      const replayed = reconstructBulkCreate(replayLogs, instanceIds);
      if (replayed) return replayed;

      const instances = await SchedulingRepository.getByIdsForUpdate(instanceIds, tx);
      assertAllInstancesFound(instances, instanceIds, tErrors);
      validateInstancesForCarryover(instances, tErrors);

      const created: BulkCreateCarryoverGroupResult[] = [];
      const auditLogIds: string[] = [];
      const groups = groupInstancesByTeacher(instances);
      await forEachInSequence([...groups.entries()], async ([teacherId, groupInstances]) => {
        const outcome = await createCarryoverForGroup(
          tx,
          teacherId,
          groupInstances,
          note,
          input.actorUserId,
          idempotencyKey,
          tErrors
        );
        created.push(outcome.group);
        if (outcome.auditLogId != null) auditLogIds.push(outcome.auditLogId);
      });

      logger.info("Carryover balances created", {
        actorUserId: input.actorUserId,
        groupCount: created.length,
        instanceCount: instanceIds.length,
      });
      return { groups: created, totalInstanceIds: instanceIds, auditLogIds };
    });
  }

  interface SettlementContext {
    paymentDate: string;
    expenseDate: string;
    note: string | null;
    actorUserId: string;
    idempotencyKey: string;
  }

  interface SettlementOutcome {
    item: BulkToExpenseItemResult;
    auditLogId: string | null;
  }

  function assertAllCarryoversFound(
    carryovers: readonly CarryoverBalanceSelectType[],
    carryoverIds: readonly string[],
    tErrors: ErrorsLabels
  ): void {
    if (carryovers.length === carryoverIds.length) return;
    const foundIds = new Set(carryovers.map(carryover => carryover.id));
    const missingId = carryoverIds.find(id => !foundIds.has(id));
    throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(missingId ?? ""));
  }

  function assertAllCarryoversUnpaid(carryovers: readonly CarryoverBalanceSelectType[], tErrors: ErrorsLabels): void {
    for (const carryover of carryovers) {
      if (carryover.isPaid) {
        throw new DomainError("CARRYOVER_ALREADY_PAID", tErrors.carryover.alreadyPaid);
      }
    }
  }

  /** Rebuilds the original conversion result from the persisted audit rows. */
  function reconstructToExpense(logs: readonly AuditLogReturnType[]): BulkToExpenseResult | null {
    if (logs.length === 0) return null;
    const items: BulkToExpenseItemResult[] = [];
    const auditLogIds: string[] = [];
    for (const log of logs.toReversed()) {
      const item = parseReplayExpenseItem(log);
      if (item == null) return null;
      items.push(item);
      auditLogIds.push(log.id);
    }
    return { items, auditLogIds };
  }

  /**
   * Writes the expense row for one carryover through the expense ledger inside
   * the caller's transaction, keyed so a same-window retry replays the
   * originally persisted expense. A ledger failure rejects with the domain
   * error so the whole batch rolls back without partial settlement.
   */
  async function requestExpenseRecord(
    tx: DBTransaction,
    carryover: CarryoverBalanceSelectType,
    teacherName: string,
    context: SettlementContext,
    tErrors: ErrorsLabels
  ): Promise<string> {
    try {
      const expense = await ExpenseService.createInternal(
        {
          teacherId: carryover.teacherId,
          teacherName,
          title: `Teacher payout — ${carryover.fromDate ?? "?"} to ${carryover.toDate ?? "?"}`,
          type: ExpenseType.SALARIES,
          expenseValue: carryover.payable,
          expenseCurrency: carryover.teacherCurrency,
          paymentDate: context.paymentDate,
          expenseDate: context.expenseDate,
          note: context.note,
          sourceEntity: EXPENSE_SOURCE_CARRYOVER_BALANCES,
          sourceEntityId: carryover.id,
          createdByUserId: context.actorUserId,
          clientRequestId: deriveExpenseClientRequestId(context.idempotencyKey, carryover.id),
        },
        tx,
        tErrors
      );
      return expense.id;
    } catch (error) {
      throw new DomainError("CARRYOVER_TO_EXPENSE_FAILED", tErrors.carryover.toExpenseFailed, { cause: error });
    }
  }

  /** Marks the carryover paid and moves its linked sessions to PAID. */
  async function markCarryoverPaidAndSettleSessions(
    tx: DBTransaction,
    carryover: CarryoverBalanceSelectType,
    expenseId: string,
    context: SettlementContext,
    tErrors: ErrorsLabels
  ): Promise<void> {
    const updated = await CarryoverBalanceRepository.update(
      carryover.id,
      {
        isPaid: true,
        paid: carryover.payable,
        paymentDate: context.paymentDate,
        expenseId,
        paidAt: new Date(),
        paidByUserId: context.actorUserId,
      },
      tx
    );
    if (updated == null) {
      throw new DomainError("CARRYOVER_TO_EXPENSE_FAILED", tErrors.carryover.toExpenseFailed);
    }

    const linkedSessions = await CarryoverBalanceRepository.findLinkedSessions(carryover.id, tx, { forUpdate: true });
    await transitionSessions(
      tx,
      linkedSessions.map(instance => ({
        instanceId: instance.id,
        fromStatus: instance.calculationStatus,
        toStatus: CalculationStatus.PAID,
        teacherPaidAmount: instance.teacherPaidAmount ?? null,
        isPartialPercentage: null,
      })),
      `Settled via expense ${expenseId}`,
      context.actorUserId
    );
  }

  /**
   * Converts one locked, unpaid carryover into an expense: creates the expense
   * record, marks the carryover paid, moves its linked sessions to PAID, and
   * emits the conversion audit row. Any failure rolls back the whole batch.
   */
  async function settleCarryoverAsExpense(
    tx: DBTransaction,
    carryover: CarryoverBalanceSelectType,
    context: SettlementContext,
    tErrors: ErrorsLabels
  ): Promise<SettlementOutcome> {
    const display = await resolveTeacherDisplay(carryover.teacherId, tx, tErrors.unknownName);
    const expenseId = await requestExpenseRecord(tx, carryover, display.teacherName, context, tErrors);
    await markCarryoverPaidAndSettleSessions(tx, carryover, expenseId, context, tErrors);

    const auditLogId = await emitCarryoverAuditLog(tx, {
      actorUserId: context.actorUserId,
      actorType: "USER",
      entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
      entityId: carryover.id,
      action: CARRYOVER_ACTION_TO_EXPENSE,
      metadata: {
        idempotencyKey: context.idempotencyKey,
        expenseId,
        paymentDate: context.paymentDate,
        expenseDate: context.expenseDate,
        amount: carryover.payable,
        currency: carryover.teacherCurrency,
      },
    });

    return {
      item: { carryoverId: carryover.id, expenseId, amount: carryover.payable, currency: carryover.teacherCurrency },
      auditLogId,
    };
  }

  /**
   * Converts one or more unpaid carryovers into expense records in a single
   * transaction: validates the payment/expense dates, locks the carryovers,
   * writes the expense rows, marks the carryovers paid, moves their linked
   * sessions to PAID, and emits one audit row per conversion. A same-content
   * re-submit inside the idempotency window replays the original result.
   */
  export async function bulkCarryoverToExpense(
    input: BulkToExpenseInput,
    tErrors: ErrorsLabels
  ): Promise<BulkToExpenseResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

    if (!input.paymentDate) {
      throw new DomainError("PAYMENT_DATE_REQUIRED", tErrors.carryover.paymentDateRequired);
    }
    const carryoverIds = [...new Set(input.carryoverIds)];
    if (carryoverIds.length === 0) {
      throw new ValidationError(tErrors.carryover.noCarryovers);
    }
    assertCarryoverIdsShape(carryoverIds, tErrors);
    const expenseDate = input.expenseDate ?? input.paymentDate.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(expenseDate)) {
      throw new DomainError("EXPENSE_DATE_INVALID", tErrors.carryover.expenseDateInvalid);
    }

    const note = input.note == null ? null : sanitizePlainText(input.note);
    const idempotencyKey = deriveBulkToExpenseIdempotencyKey(input);

    return db.transaction(async tx => {
      await acquireAdvisoryLock(tx, `carryover-to-expense:${idempotencyKey}`);

      const replayLogs = await findReplayAuditLogs(tx, input.actorUserId, CARRYOVER_ACTION_TO_EXPENSE, idempotencyKey);
      const replayed = reconstructToExpense(replayLogs);
      if (replayed) return replayed;

      const carryovers = await CarryoverBalanceRepository.getByIdsForUpdate(carryoverIds, tx);
      assertAllCarryoversFound(carryovers, carryoverIds, tErrors);
      assertAllCarryoversUnpaid(carryovers, tErrors);

      const items: BulkToExpenseItemResult[] = [];
      const auditLogIds: string[] = [];
      const context: SettlementContext = {
        paymentDate: input.paymentDate,
        expenseDate,
        note,
        actorUserId: input.actorUserId,
        idempotencyKey,
      };
      await forEachInSequence(carryovers, async carryover => {
        const outcome = await settleCarryoverAsExpense(tx, carryover, context, tErrors);
        items.push(outcome.item);
        if (outcome.auditLogId != null) auditLogIds.push(outcome.auditLogId);
      });

      logger.info("Carryovers converted to expenses", {
        actorUserId: input.actorUserId,
        carryoverCount: items.length,
        totalAmount: sumAmounts(items.map(item => item.amount)),
      });
      return { items, auditLogIds };
    });
  }

  /**
   * Reverts a paid carryover: marks the carryover unpaid under its row lock,
   * soft-deletes the linked expense inside the same transaction, moves its
   * sessions back from PAID to WAITING_PAID, and emits the unpay audit row.
   * The revert lands first because the expense ledger protects rows whose
   * linked carryover is still paid (`EXPENSE_DELETE_VIA_UNPAY`) — unpaying
   * first is what lets the settlement's own soft-delete through. A missing
   * expense row (the reference outlives rows deleted before the ledger
   * shipped, or rows pruned independently) is tolerated: the revert still
   * completes. Any other ledger failure rolls back the whole revert. Calling
   * it on an unpaid carryover rejects — there is nothing to reverse and the
   * original conversion stays the authoritative record.
   */
  export async function unpayCarryoverBalance(
    input: UnpayCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertCarryoverIdShape(input.id, tErrors);
    const note = input.note == null ? null : sanitizePlainText(input.note);

    return db.transaction(async tx => {
      const [carryover] = await CarryoverBalanceRepository.getByIdsForUpdate([input.id], tx);
      if (carryover == null) {
        throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
      }
      if (!carryover.isPaid) {
        throw new DomainError("CARRYOVER_NOT_PAID", tErrors.carryover.notPaid);
      }
      const settledExpenseId = carryover.expenseId;

      const updated = await CarryoverBalanceRepository.update(
        input.id,
        { isPaid: false, paid: ZERO_AMOUNT, paymentDate: null, expenseId: null, paidAt: null, paidByUserId: null },
        tx
      );
      if (updated == null) {
        throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
      }

      if (settledExpenseId != null) {
        await softDeleteSettledExpense(tx, settledExpenseId, input.actorUserId, note, tErrors);
      }

      const linkedSessions = await CarryoverBalanceRepository.findLinkedSessions(input.id, tx, { forUpdate: true });
      await transitionSessions(
        tx,
        linkedSessions.map(instance => ({
          instanceId: instance.id,
          fromStatus: instance.calculationStatus,
          toStatus: CalculationStatus.WAITING_PAID,
          teacherPaidAmount: instance.teacherPaidAmount ?? null,
          isPartialPercentage: null,
        })),
        `Carryover ${input.id} unpaid`,
        input.actorUserId
      );

      await emitCarryoverAuditLog(tx, {
        actorUserId: input.actorUserId,
        actorType: "USER",
        entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
        entityId: input.id,
        action: CARRYOVER_ACTION_UNPAID,
        metadata: { expenseId: settledExpenseId, reason: note },
      });

      logger.info("Carryover unpaid", {
        actorUserId: input.actorUserId,
        carryoverId: input.id,
        expenseId: settledExpenseId,
        sessionCount: linkedSessions.length,
      });
      return toCarryoverRow(updated, tx, tErrors.unknownName);
    });
  }

  /**
   * Soft-deletes the expense the settlement wrote, inside the caller's
   * transaction and without a second permission check (the caller owns both).
   * Re-running after the row is gone — because it was already deleted or
   * because the reference predates the ledger and no row ever materialized —
   * is tolerated instead of aborting the revert.
   */
  async function softDeleteSettledExpense(
    tx: DBTransaction,
    expenseId: string,
    actorUserId: string,
    reason: string | null,
    tErrors: ErrorsLabels
  ): Promise<void> {
    try {
      await ExpenseService.softDelete({ id: expenseId, actorUserId, reason, tx }, tErrors);
    } catch (error) {
      if (error instanceof DomainError && error.code === "EXPENSE_NOT_FOUND") {
        logger.info("Carryover unpay: expense reference has no ledger row; continuing the revert", {
          expenseId,
          actorUserId,
        });
        return;
      }
      throw error;
    }
  }

  function validatePeriod(fromDate: string | null, toDate: string | null, tErrors: ErrorsLabels): void {
    if (fromDate != null && toDate != null && fromDate > toDate) {
      throw new ValidationError(tErrors.invalidInput);
    }
  }

  /** Normalizes the manual-entry payable amount to the canonical two-decimal string; non-numeric or negative input rejects. */
  function normalizePayableAmount(payable: string, tErrors: ErrorsLabels): string {
    const units = toAmountMinorUnits(payable);
    if (units == null || units < 0n) {
      throw new ValidationError(tErrors.invalidInput);
    }
    return formatAmountMinorUnits(units);
  }

  /**
   * Creates a manual carryover record (no aggregated sessions). Snapshots the
   * teacher's disabled state at creation time. A same-content re-submit inside
   * the idempotency window returns the originally persisted row.
   */
  /** Persists a manual carryover row plus its creation audit log and maps the stored row for the caller. */
  async function insertManualCarryover(
    tx: DBTransaction,
    input: CreateCarryoverInput,
    prepared: { payable: string; studentsText: string | null; note: string | null; idempotencyKey: string },
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    const teacher = await TeacherRepository.findById(input.teacherId, tx);
    if (teacher == null) {
      throw new NotFoundError("TEACHER", tErrors.teacher.teacherNotFound(input.teacherId));
    }
    const isDisabledTeacher = await TeacherRepository.isDisabled(input.teacherId, tx);

    const created = await CarryoverBalanceRepository.create(
      {
        teacherId: input.teacherId,
        studentsCount: input.studentsCount ?? null,
        studentsText: prepared.studentsText,
        totalDuration: null,
        payable: prepared.payable,
        teacherCurrency: input.teacherCurrency,
        paid: ZERO_AMOUNT,
        fromDate: input.fromDate ?? null,
        toDate: input.toDate ?? null,
        paymentDate: null,
        isDisabledTeacher,
        isPaid: false,
        expenseId: null,
        note: prepared.note,
        createdByUserId: input.actorUserId,
      },
      tx
    );

    await emitCarryoverAuditLog(tx, {
      actorUserId: input.actorUserId,
      actorType: "USER",
      entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
      entityId: created.id,
      action: CARRYOVER_ACTION_CREATE,
      metadata: {
        idempotencyKey: prepared.idempotencyKey,
        teacherId: created.teacherId,
        instanceIds: [],
        studentsCount: created.studentsCount,
        totalDuration: created.totalDuration,
        payable: created.payable,
        currency: created.teacherCurrency,
      },
    });

    logger.info("Manual carryover created", {
      actorUserId: input.actorUserId,
      carryoverId: created.id,
      teacherId: created.teacherId,
      payable: created.payable,
    });
    return toCarryoverRow(created, tx, tErrors.unknownName);
  }

  export async function createCarryoverBalance(
    input: CreateCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertTeacherIdShape(input.teacherId, tErrors);
    validatePeriod(input.fromDate ?? null, input.toDate ?? null, tErrors);
    const payable = normalizePayableAmount(input.payable, tErrors);
    const note = input.note == null ? null : sanitizePlainText(input.note);
    const studentsText =
      input.studentsText == null ? null : sanitizePlainText(input.studentsText, STUDENTS_TEXT_MAX_LENGTH);
    const idempotencyKey = deriveCrudIdempotencyKey(input);

    return db.transaction(async tx => {
      await acquireAdvisoryLock(tx, `carryover-create:${idempotencyKey}`);

      const replayLogs = await findReplayAuditLogs(tx, input.actorUserId, CARRYOVER_ACTION_CREATE, idempotencyKey);
      const replayCarryoverId = replayLogs[0]?.entityId;
      if (replayCarryoverId != null) {
        const existing = await CarryoverBalanceRepository.getById(replayCarryoverId, tx);
        if (existing != null) return toCarryoverRow(existing, tx, tErrors.unknownName);
      }

      return insertManualCarryover(tx, input, { payable, studentsText, note, idempotencyKey }, tErrors);
    });
  }

  /** Sanitizes a nullable patch field; `undefined` (key absent from the patch) passes through untouched. */
  function sanitizePatchField(value: string | null | undefined, maxLength?: number): string | null | undefined {
    if (value === undefined || value === null) return value;
    return sanitizePlainText(value, maxLength ?? 2_000);
  }

  /**
   * Updates the editable patch fields of a carryover (period, payable,
   * currency, students summary, note). The teacher is immutable by design —
   * re-assignment requires delete + recreate. A paid carryover is fully
   * read-only: the settled amount and currency must keep matching the
   * persisted settlement (`paid` equals `payable` once `isPaid`), so even
   * metadata edits go through the unpay → correct → re-settle path.
   */
  export async function updateCarryoverBalance(
    input: UpdateCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<CarryoverRow> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertCarryoverIdShape(input.id, tErrors);

    if (Object.hasOwn(input, "teacherId")) {
      throw new DomainError("CARRYOVER_TEACHER_IMMUTABLE", tErrors.carryover.teacherImmutable);
    }
    validatePeriod(input.fromDate ?? null, input.toDate ?? null, tErrors);

    const note = sanitizePatchField(input.note);
    const studentsText = sanitizePatchField(input.studentsText, STUDENTS_TEXT_MAX_LENGTH);
    const payable =
      input.payable === undefined || input.payable === null
        ? undefined
        : normalizePayableAmount(input.payable, tErrors);

    return db.transaction(async tx => {
      const [existing] = await CarryoverBalanceRepository.getByIdsForUpdate([input.id], tx);
      if (existing == null) {
        throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
      }
      if (existing.isPaid) {
        throw new DomainError("CARRYOVER_PAID_CANNOT_EDIT", tErrors.carryover.paidCannotEdit);
      }

      const updated = await CarryoverBalanceRepository.update(
        input.id,
        {
          fromDate: input.fromDate,
          toDate: input.toDate,
          payable,
          teacherCurrency: input.teacherCurrency ?? undefined,
          studentsCount: input.studentsCount,
          studentsText,
          note,
        },
        tx
      );
      if (updated == null) {
        throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(input.id));
      }

      await emitCarryoverAuditLog(tx, {
        actorUserId: input.actorUserId,
        actorType: "USER",
        entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
        entityId: input.id,
        action: "UPDATE",
        previousState: {
          fromDate: existing.fromDate,
          toDate: existing.toDate,
          payable: existing.payable,
          teacherCurrency: existing.teacherCurrency,
          studentsCount: existing.studentsCount,
          studentsText: existing.studentsText,
          note: existing.note,
        },
        newState: {
          fromDate: updated.fromDate,
          toDate: updated.toDate,
          payable: updated.payable,
          teacherCurrency: updated.teacherCurrency,
          studentsCount: updated.studentsCount,
          studentsText: updated.studentsText,
          note: updated.note,
        },
      });

      logger.info("Carryover updated", { actorUserId: input.actorUserId, carryoverId: input.id });
      return toCarryoverRow(updated, tx, tErrors.unknownName);
    });
  }

  /**
   * Restores each linked session to the calculation status captured in the
   * item snapshot, then detaches the sessions from the carryover.
   */
  async function revertAndUnlinkCarryoverSessions(
    tx: DBTransaction,
    carryover: CarryoverBalanceSelectType,
    actorUserId: string,
    tErrors: ErrorsLabels
  ): Promise<number> {
    const items = await listCarryoverItems(tx, carryover.id);
    if (items.length === 0) return 0;

    const linkedInstances = await CarryoverBalanceRepository.findLinkedSessions(carryover.id, tx, {
      forUpdate: true,
    });
    const instanceById = new Map(linkedInstances.map(instance => [instance.id, instance]));

    const transitions: SessionStatusTransition[] = items.map(item => {
      const restoreStatus = parseStoredCalculationStatus(item.originalStatus);
      if (restoreStatus == null) {
        throw new DomainError("CARRYOVER_SNAPSHOT_INVALID", tErrors.internalServerError);
      }
      const instance = instanceById.get(item.classInstanceId);
      return {
        instanceId: item.classInstanceId,
        fromStatus: instance?.calculationStatus ?? CalculationStatus.WAITING_PAID,
        toStatus: restoreStatus,
        teacherPaidAmount: instance?.teacherPaidAmount ?? null,
        isPartialPercentage:
          restoreStatus === CalculationStatus.PARTIALLY ? readSnapshotPartialPercentage(item, tErrors) : null,
      };
    });

    await transitionSessions(tx, transitions, `Carryover ${carryover.id} deleted`, actorUserId);
    await SchedulingRepository.unlinkFromCarryover(
      items.map(item => item.classInstanceId),
      tx
    );
    return items.length;
  }

  async function deleteCarryoverRowWithAudit(
    tx: DBTransaction,
    carryover: CarryoverBalanceSelectType,
    actorUserId: string
  ): Promise<string | null> {
    // The caller holds the row lock; the delete cannot miss the row.
    await CarryoverBalanceRepository.deleteById(carryover.id, tx);
    return emitCarryoverAuditLog(tx, {
      actorUserId,
      actorType: "USER",
      entityType: CARRYOVER_AUDIT_ENTITY_TYPE,
      entityId: carryover.id,
      action: CARRYOVER_ACTION_DELETE,
      metadata: { teacherId: carryover.teacherId, payable: carryover.payable, currency: carryover.teacherCurrency },
    });
  }

  /**
   * Hard-deletes one unpaid carryover: linked sessions revert to the status
   * captured in their item snapshots and are detached before the row and its
   * items are removed. Paid carryovers reject — the correction path is unpay.
   */
  export async function deleteCarryoverBalance(
    input: DeleteCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<DeleteCarryoverResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);
    assertCarryoverIdShape(input.id, tErrors);

    return db.transaction(async tx => {
      const carryover = await verifyCarryoverDeletable(tx, input.id, tErrors);
      const reverted = await revertAndUnlinkCarryoverSessions(tx, carryover, input.actorUserId, tErrors);
      await deleteCarryoverRowWithAudit(tx, carryover, input.actorUserId);

      logger.info("Carryover deleted", {
        actorUserId: input.actorUserId,
        carryoverId: input.id,
        teacherId: carryover.teacherId,
        revertedSessions: reverted,
      });
      return { id: input.id, deleted: true };
    });
  }

  async function verifyCarryoverDeletable(
    tx: DBTransaction,
    id: string,
    tErrors: ErrorsLabels
  ): Promise<CarryoverBalanceSelectType> {
    const [carryover] = await CarryoverBalanceRepository.getByIdsForUpdate([id], tx);
    if (carryover == null) {
      throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(id));
    }
    if (carryover.isPaid) {
      throw new DomainError("CARRYOVER_PAID_CANNOT_DELETE", tErrors.carryover.paidCannotDelete);
    }
    return carryover;
  }

  /**
   * Deletes a batch of carryovers atomically: a single paid row in the
   * selection rejects the whole batch and no rows are removed.
   */
  export async function bulkDeleteCarryoverBalances(
    input: BulkDeleteCarryoverInput,
    tErrors: ErrorsLabels
  ): Promise<BulkDeleteCarryoverResult> {
    await requirePermission(input.actorUserId, AppPermission.ACCOUNTING_CARRYOVER_MANAGE, tErrors);

    const ids = [...new Set(input.ids)];
    if (ids.length === 0) {
      throw new ValidationError(tErrors.carryover.noCarryovers);
    }
    assertCarryoverIdsShape(ids, tErrors);

    return db.transaction(async tx => {
      const carryovers = await CarryoverBalanceRepository.getByIdsForUpdate(ids, tx);
      assertAllCarryoversFound(carryovers, ids, tErrors);
      for (const carryover of carryovers) {
        if (carryover.isPaid) {
          throw new DomainError("CARRYOVER_PAID_CANNOT_DELETE", tErrors.carryover.paidCannotDelete);
        }
      }

      const auditLogIds: string[] = [];
      let revertedSessions = 0;
      await forEachInSequence(carryovers, async carryover => {
        revertedSessions += await revertAndUnlinkCarryoverSessions(tx, carryover, input.actorUserId, tErrors);
        const auditLogId = await deleteCarryoverRowWithAudit(tx, carryover, input.actorUserId);
        if (auditLogId != null) auditLogIds.push(auditLogId);
      });

      logger.info("Carryovers deleted", {
        actorUserId: input.actorUserId,
        carryoverCount: carryovers.length,
        revertedSessions,
      });
      return { deletedIds: ids, auditLogIds };
    });
  }

  function countRowsByPaid(rows: readonly CarryoverBalanceSelectType[]): CarryoverPaidRowCounts {
    let paid = 0;
    for (const row of rows) {
      if (row.isPaid) paid += 1;
    }
    return { paid, unpaid: rows.length - paid };
  }

  /**
   * Reads one page of the carryover list plus aggregates describing the full
   * filtered set (bounded by the export ceiling): total payable, total paid,
   * the dominant currency across rows, and the paid/unpaid row counts.
   */
  export async function getReport(
    actorUserId: string,
    filters: CarryoverFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<CarryoverPage> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);

    const page = await CarryoverBalanceRepository.findFiltered(filters, pagination);

    // Aggregates describe the filtered set, not just the requested page; when
    // the whole set already sits on this page no second scan is needed.
    const aggregateRows =
      pagination.offset === 0 && page.totalCount <= pagination.limit
        ? page.rows
        : (
            await CarryoverBalanceRepository.findFiltered(filters, {
              limit: REPORT_AGGREGATE_ROW_CAP,
              offset: 0,
            })
          ).rows;

    return {
      rows: page.rows.map(row =>
        mapCarryoverRow(row, { teacherName: row.teacherName, teacherAvatarUrl: row.teacherAvatarUrl })
      ),
      totalCount: page.totalCount,
      aggregates: {
        totalPayable: sumAmounts(aggregateRows.map(row => row.payable)),
        totalPaid: sumAmounts(aggregateRows.map(row => row.paid)),
        dominantCurrency: pickDominantCurrency(aggregateRows),
        rowCountByPaid: countRowsByPaid(aggregateRows),
      },
    };
  }

  /** Reads a single carryover with the teacher display fields resolved, for the drill-down view. */
  export async function getById(actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<CarryoverRow> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);
    assertCarryoverIdShape(id, tErrors);
    const row = await CarryoverBalanceRepository.getById(id);
    if (row == null) {
      throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(id));
    }
    return toCarryoverRow(row, undefined, tErrors.unknownName);
  }

  function mapLinkedSessionRow(row: CarryoverLinkedSessionRow): CarryoverLinkedSession {
    return { ...row, scheduledStartAt: row.scheduledStartAt.toISOString() };
  }

  /** Sessions aggregated into one carryover, with the link-time amount/status snapshots for the detail drawer. */
  export async function getLinkedSessions(
    actorUserId: string,
    carryoverId: string,
    tErrors: ErrorsLabels
  ): Promise<CarryoverLinkedSession[]> {
    await requirePermission(actorUserId, AppPermission.ACCOUNTING_CARRYOVER_VIEW, tErrors);
    assertCarryoverIdShape(carryoverId, tErrors);
    const carryover = await CarryoverBalanceRepository.getById(carryoverId);
    if (carryover == null) {
      throw new NotFoundError("CARRYOVER", tErrors.carryover.notFound(carryoverId));
    }
    const rows = await CarryoverBalanceRepository.findLinkedSessionRows(carryoverId);
    return rows.map(mapLinkedSessionRow);
  }

  /**
   * Per-carryover linked-session counts for DataLoader-backed field resolution.
   * Field-level batching has no per-item acting user; access is gated on the
   * parent query's carryover view scope instead.
   */
  export async function countLinkedSessionsByCarryoverIds(
    carryoverIds: readonly string[]
  ): Promise<Map<string, number>> {
    return CarryoverBalanceRepository.countLinkedSessionsByCarryoverIds(carryoverIds);
  }
}
