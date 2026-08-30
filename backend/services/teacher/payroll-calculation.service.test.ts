import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { createHash } from "node:crypto";
import type { PayrollCalculationPatch } from "@/backend/db/repo/scheduling/class-instances";
import { AppPermission, CalculationStatus, OnDemandStatus, SchedulingMode } from "@/backend/enum";
import { DomainError, ForbiddenError, logger, NotFoundError } from "@/backend/lib";
import type { PayrollGraceSettings } from "@/backend/services/teacher/payroll-grace-settings";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  ClassStatusEventSelectType,
  DBTransaction,
  PayrollCalculationInput,
  PayrollCalculationResult,
  PayrollReportFilters,
  PayrollReportPage,
  PayrollReportRow,
} from "@/backend/types";
import { ClassExecutionState, ClassOutcome, ClassType } from "@/shared/constants/class-instance-detail.enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";
const INSTANCE_ID = "22222222-2222-2222-2222-222222222222";
const TEACHER_ID = "33333333-3333-3333-3333-333333333333";
const STUDENT_ID = "44444444-4444-4444-4444-444444444444";
const SUBJECT_ID = "55555555-5555-5555-5555-555555555555";
const RECURRING_SCHEDULE_ID = "66666666-6666-6666-6666-666666666666";

const SCHEDULED_START = new Date("2026-08-20T10:00:00.000Z");
const DEFAULT_RATE = { hourlyRate: "120", currency: CurrencyCode.SAR };
const DEFAULT_GRACE: PayrollGraceSettings = { shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 };
const IDEMPOTENCY_WINDOW_SECONDS = 30;
const RATE_FAILURE_NOTE = "Auto-calc failed: rate resolution returned no usable rate";
const TEACHER_FAILURE_NOTE = "Auto-calc failed: teacher record not found";

/** Sentinel executor handed to the service callback — proves every write shares the caller's transaction. */
const TX_SENTINEL = { executor: "payroll-calculation-test-transaction" };

function minutesAfter(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

function buildInstanceRow(overrides: Partial<ClassInstanceSelectType> = {}): ClassInstanceSelectType {
  return {
    id: INSTANCE_ID,
    studentId: STUDENT_ID,
    teacherId: TEACHER_ID,
    subjectId: SUBJECT_ID,
    recurringScheduleId: null,
    originalClassId: null,
    scheduledStartAt: SCHEDULED_START,
    scheduledEndAt: minutesAfter(SCHEDULED_START, 60),
    bookingTimezoneId: null,
    bookingTimezone: "UTC",
    bookingUtcOffset: 0,
    durationMinutes: 60,
    classType: ClassType.REGULAR,
    outcome: ClassOutcome.TAKEN,
    executionState: ClassExecutionState.COMPLETED,
    billedUnit: null,
    isRescheduled: false,
    isFrozen: false,
    meetingJoinUrl: null,
    userMeetingConfigId: null,
    meetingProviderId: null,
    meetingConfigSnapshot: null,
    activatedAt: null,
    activatedByUserId: null,
    forceActivated: false,
    forceActivatedByUserId: null,
    actualStartAt: SCHEDULED_START,
    actualEndAt: minutesAfter(SCHEDULED_START, 60),
    quotaDeducted: true,
    schedulingMode: SchedulingMode.NUMBER_OF_CLASSES,
    ondemandStatus: null,
    payrollCredited: false,
    rateAmount: null,
    rateCurrency: null,
    isRateOverridden: false,
    rateSource: null,
    calculatedDuration: null,
    teacherPaidAmount: null,
    teacherPaidCurrency: null,
    calculationStatus: CalculationStatus.NOT_CALCULATED,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: null,
    payrollCalculatedBy: null,
    remarks: null,
    adminNotes: null,
    idempotencyKey: "booking-idempotency-key",
    createdAt: new Date("2026-08-19T08:00:00.000Z"),
    updatedAt: new Date("2026-08-19T08:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

interface PatchEntry {
  tx: unknown;
  id: string;
  patch: PayrollCalculationPatch;
}

const payrollPatches: PatchEntry[] = [];
const insertedEvents: ClassStatusEventSeedInsertInput[] = [];
const eventStore: ClassStatusEventSelectType[] = [];
const idempotencyLookups: { instanceId: string; hash: string; windowSeconds: number; tx: unknown }[] = [];
const acquiredLockKeys: { tx: unknown; lockKey: string }[] = [];
const instanceReads: { id: string; tx: unknown; forUpdate: boolean }[] = [];
const reportReads: { filters: PayrollReportFilters; limit: number; offset: number }[] = [];

let eventCounter = 0;
let instanceRow: ClassInstanceSelectType | null = buildInstanceRow();
let graceSettings: PayrollGraceSettings = { ...DEFAULT_GRACE };
let resolvedRate: { hourlyRate: string; currency: CurrencyCode } = { ...DEFAULT_RATE };
let teacherRow: { id: string } | null = { id: TEACHER_ID };
let subjectRow: { id: string } | null = { id: SUBJECT_ID };
let subjectLookupFails = false;
let permissionError: Error | null = null;
let transactionChain: Promise<unknown> = Promise.resolve();
let reportRows: PayrollReportRow[] = [];
let reportTotalCount = 0;

function readIdempotencyKey(toState: unknown): string | null {
  if (toState != null && typeof toState === "object" && "idempotencyKey" in toState) {
    const value = (toState as { idempotencyKey?: unknown }).idempotencyKey;
    return typeof value === "string" ? value : null;
  }
  return null;
}

function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null;
}

/**
 * Wraps a fake caller transaction as the opaque executor the calculator
 * forwards to every repository mock (same type-guard pattern as the billing
 * carryover-handoff tests).
 */
function asCallerTx(value: object): DBTransaction {
  if (isDbTransaction(value)) return value;
  throw new Error("fake caller tx must be an object");
}

const getByIdMock = mock(async (id: string, tx?: unknown, opts?: { forUpdate?: boolean }) => {
  instanceReads.push({ id, tx, forUpdate: opts?.forUpdate === true });
  return instanceRow;
});

const updatePayrollCalculationMock = mock(async (tx: unknown, id: string, patch: PayrollCalculationPatch) => {
  const currentRow = instanceRow;
  if (currentRow === null) {
    throw new Error("updatePayrollCalculation requires a loaded instance row");
  }
  const updated: ClassInstanceSelectType = { ...currentRow, ...patch };
  instanceRow = updated;
  payrollPatches.push({ tx, id, patch });
  return updated;
});

const findPayrollReportRowsMock = mock(
  async (filters: PayrollReportFilters, pagination: { limit: number; offset: number }) => {
    reportReads.push({ filters, limit: pagination.limit, offset: pagination.offset });
    return {
      rows: reportRows.slice(pagination.offset, pagination.offset + pagination.limit),
      totalCount: reportTotalCount,
    };
  }
);

const findRecentByInstanceAndHashMock = mock(
  async (instanceId: string, hash: string, windowSeconds: number, tx?: unknown) => {
    idempotencyLookups.push({ instanceId, hash, windowSeconds, tx });
    for (let index = eventStore.length - 1; index >= 0; index -= 1) {
      const event = eventStore[index];
      if (event?.classInstanceId === instanceId && readIdempotencyKey(event.toState) === hash) {
        return event;
      }
    }
    return null;
  }
);

const createManyEventsMock = mock(async (inputs: readonly ClassStatusEventSeedInsertInput[]) => {
  return inputs.map(input => {
    eventCounter += 1;
    const row: ClassStatusEventSelectType = {
      id: `payroll-event-${eventCounter}`,
      classInstanceId: input.classInstanceId,
      eventType: input.eventType,
      fromState: input.fromState ?? null,
      toState: input.toState ?? null,
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      createdAt: input.createdAt ?? new Date(),
    };
    eventStore.push(row);
    insertedEvents.push(input);
    return row;
  });
});

const recurringFindByIdMock = mock(async (id: string, tx?: unknown) => {
  return { schedule: { id, hourlyRate: null }, studentName: "Student", teacherUserName: "Teacher", tx };
});

const subjectGetByIdMock = mock(async () => {
  if (subjectLookupFails) {
    throw new Error("subject lookup failed");
  }
  return subjectRow;
});

const teacherFindByIdMock = mock(async () => teacherRow);

const acquireAdvisoryLockMock = mock(async (tx: unknown, lockKey: string) => {
  acquiredLockKeys.push({ tx, lockKey });
});

const resolveGraceSettingsMock = mock(async () => graceSettings);

const resolveClassRateMock = mock(() => resolvedRate);

const requirePermissionMock = mock(async (_actorUserId: string, _permission: AppPermission, _tErrors: ErrorsLabels) => {
  if (permissionError !== null) {
    throw permissionError;
  }
});

/**
 * Transaction executor stand-in. Calls are chained so a second payroll write
 * for the same rows observes the first one's committed event — the in-process
 * equivalent of the per-teacher advisory lock serializing real transactions.
 */
const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => {
  const run = transactionChain.then(() => fn(TX_SENTINEL));
  transactionChain = run.catch(() => undefined);
  return run;
});

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    getById: getByIdMock,
    updatePayrollCalculation: updatePayrollCalculationMock,
    findPayrollReportRows: findPayrollReportRowsMock,
  },
  RecurringScheduleRepository: {
    findById: recurringFindByIdMock,
  },
  ClassStatusEventsRepository: {
    createMany: createManyEventsMock,
    findRecentByInstanceAndHash: findRecentByInstanceAndHashMock,
  },
}));

await mock.module("@/backend/db/repo/classes/class-subject.repository", () => ({
  ClassSubjectRepository: {
    getSubjectById: subjectGetByIdMock,
  },
}));

await mock.module("@/backend/db/repo/teachers/teacher.repository", () => ({
  TeacherRepository: {
    findById: teacherFindByIdMock,
  },
}));

await mock.module("@/backend/db/repo/shared", () => ({
  acquireAdvisoryLock: acquireAdvisoryLockMock,
}));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: () => ({}),
}));

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
}));

await mock.module("@/backend/services/pricing/rate-resolver.service", () => ({
  resolveClassRate: resolveClassRateMock,
}));

await mock.module("@/backend/services/teacher/payroll-grace-settings", () => ({
  resolveGraceSettings: resolveGraceSettingsMock,
}));

// ---------------------------------------------------------------------------
// Errors stub (only the fields the service actually reads).
// ---------------------------------------------------------------------------

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    insufficientPermissions: "insufficient permissions",
    invalidInput: "invalid input",
    internalServerError: "internal server error",
    payroll: {
      notTerminal: "payroll requires a terminal session",
      alreadyPaid: "payroll already paid",
      awaitingSettlement: "payroll awaiting settlement",
      invalidTargetStatus: "invalid override target status",
      partialRequiresPercentage: "partial override requires a percentage",
    },
    scheduling: {
      classInstanceNotFound: ({ id }: { id: string }) => `class instance ${id} not found`,
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/teacher/payroll-calculation.service")> {
  return import("@/backend/services/teacher/payroll-calculation.service");
}

async function calculate(input: Partial<PayrollCalculationInput> = {}) {
  const { PayrollCalculationService } = await importService();
  return PayrollCalculationService.calculateForInstance(
    { instanceId: INSTANCE_ID, actorUserId: ACTOR_ID, ...input },
    tErrors
  );
}

async function expectCalculationError(input: Partial<PayrollCalculationInput>, code: string): Promise<DomainError> {
  let caught: unknown = null;
  try {
    await calculate(input);
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (!(caught instanceof DomainError)) {
    throw new Error(`expected a DomainError but got ${String(caught)}`);
  }
  expect(caught.code).toBe(code);
  return caught;
}

interface SnapshotExpectation {
  status: CalculationStatus;
  duration: number | null;
  amount: string | null;
  note?: string | null;
}

/** Session-row overrides: a `durationMinutes` window the teacher joined `lateMinutes` after the scheduled start. */
function joinedSession(durationMinutes: number, lateMinutes: number): Partial<ClassInstanceSelectType> {
  return {
    scheduledEndAt: minutesAfter(SCHEDULED_START, durationMinutes),
    durationMinutes,
    actualStartAt: minutesAfter(SCHEDULED_START, lateMinutes),
    actualEndAt: minutesAfter(SCHEDULED_START, durationMinutes),
  };
}

interface PayableScenario {
  row: Partial<ClassInstanceSelectType>;
  rate?: string;
  expectedDuration: number;
  expectedAmount: string;
}

/** Runs one calculation over the given row/rate scenario and asserts the payable duration + amount. */
async function expectPayableAmount(scenario: PayableScenario): Promise<PayrollCalculationResult> {
  instanceRow = buildInstanceRow(scenario.row);
  if (scenario.rate !== undefined) {
    resolvedRate = { hourlyRate: scenario.rate, currency: CurrencyCode.SAR };
  }
  const result = await calculate();
  expect(result.calculatedDuration).toBe(scenario.expectedDuration);
  expect(result.teacherPaidAmount).toBe(scenario.expectedAmount);
  return result;
}

/** A row whose payroll snapshot was already written and settled in a prior step. */
function buildSettledRow(
  status: CalculationStatus,
  amount: string,
  extra: Partial<ClassInstanceSelectType> = {}
): ClassInstanceSelectType {
  return buildInstanceRow({
    calculationStatus: status,
    calculatedDuration: 60,
    teacherPaidAmount: amount,
    teacherPaidCurrency: CurrencyCode.SAR,
    ...extra,
  });
}

function expectNoWrites(): void {
  expect(payrollPatches).toHaveLength(0);
  expect(insertedEvents).toHaveLength(0);
}

function expectSnapshotPatch(expected: SnapshotExpectation): PayrollCalculationPatch {
  expect(payrollPatches).toHaveLength(1);
  const patch = payrollPatches[0]?.patch;
  if (!patch) {
    throw new Error("expected one payroll snapshot patch");
  }
  expect(patch.calculationStatus).toBe(expected.status);
  expect(patch.calculatedDuration).toBe(expected.duration);
  expect(patch.teacherPaidAmount).toBe(expected.amount);
  expect(patch.teacherPaidCurrency).toBe(expected.amount === null ? null : CurrencyCode.SAR);
  expect(patch.isPartialPercentage).toBeNull();
  expect(patch.payrollNote).toBe(expected.note ?? null);
  expect(patch.payrollCalculatedBy).toBe(ACTOR_ID);
  return patch;
}

function expectTransitionEvent(from: CalculationStatus, fromAmount: string | null): void {
  expect(insertedEvents).toHaveLength(1);
  const event = insertedEvents[0];
  if (!event) {
    throw new Error("expected one payroll status-transition event");
  }
  expect(event.eventType).toBe("PAYROLL_STATUS_TRANSITION");
  expect(event.classInstanceId).toBe(INSTANCE_ID);
  expect(event.actorUserId).toBe(ACTOR_ID);
  expect(event.fromState).toEqual({ calculationStatus: from, teacherPaidAmount: fromAmount });
  expect(typeof readIdempotencyKey(event.toState)).toBe("string");
}

function expectedCalculationKey(status: CalculationStatus, duration: number | null, amount: string | null): string {
  const parts = [INSTANCE_ID, status, String(duration ?? ""), amount ?? ""];
  return createHash("sha256")
    .update(`payroll-calculation:${parts.join(":")}`)
    .digest("hex");
}

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});
const loggerWarnSpy = spyOn(logger, "warn").mockImplementation(() => {});

function resetMocks(): void {
  payrollPatches.length = 0;
  insertedEvents.length = 0;
  eventStore.length = 0;
  idempotencyLookups.length = 0;
  acquiredLockKeys.length = 0;
  instanceReads.length = 0;
  reportReads.length = 0;

  eventCounter = 0;
  instanceRow = buildInstanceRow();
  graceSettings = { ...DEFAULT_GRACE };
  resolvedRate = { ...DEFAULT_RATE };
  teacherRow = { id: TEACHER_ID };
  subjectRow = { id: SUBJECT_ID };
  subjectLookupFails = false;
  permissionError = null;
  transactionChain = Promise.resolve();
  reportRows = [];
  reportTotalCount = 0;

  getByIdMock.mockClear();
  updatePayrollCalculationMock.mockClear();
  findPayrollReportRowsMock.mockClear();
  findRecentByInstanceAndHashMock.mockClear();
  createManyEventsMock.mockClear();
  recurringFindByIdMock.mockClear();
  subjectGetByIdMock.mockClear();
  teacherFindByIdMock.mockClear();
  acquireAdvisoryLockMock.mockClear();
  resolveGraceSettingsMock.mockClear();
  resolveClassRateMock.mockClear();
  requirePermissionMock.mockClear();
  dbTransactionMock.mockClear();
  loggerInfoSpy.mockClear();
  loggerWarnSpy.mockClear();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function buildReportRow(overrides: Partial<PayrollReportRow> = {}): PayrollReportRow {
  return {
    instanceId: INSTANCE_ID,
    scheduledStartAt: "2026-08-20T10:00:00.000Z",
    scheduledEndAt: "2026-08-20T11:00:00.000Z",
    scheduledDurationMinutes: 60,
    actualStartAt: "2026-08-20T10:00:00.000Z",
    actualEndAt: "2026-08-20T11:00:00.000Z",
    calculatedDuration: 60,
    teacherPaidAmount: "120.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.CALCULATED,
    isPartialPercentage: null,
    payrollNote: null,
    teacherId: TEACHER_ID,
    teacherName: "Payroll Report Teacher",
    studentId: STUDENT_ID,
    studentName: "Payroll Report Student",
    subjectId: SUBJECT_ID,
    subjectName: "Payroll Report Subject",
    isStudentAbsence: false,
    isTeacherAbsence: false,
    ...overrides,
  };
}

async function readReport(
  pagination: { limit: number; offset: number },
  filters: PayrollReportFilters = {}
): Promise<PayrollReportPage> {
  const { PayrollCalculationService } = await importService();
  return PayrollCalculationService.getReport(ACTOR_ID, filters, pagination, tErrors);
}

describe("PayrollCalculationService.calculateForInstance", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("terminal-session snapshots", () => {
    test("writes a CALCULATED snapshot for a completed on-time session", async () => {
      const result = await calculate();

      expect(result.instanceId).toBe(INSTANCE_ID);
      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.calculatedDuration).toBe(60);
      expect(result.teacherPaidAmount).toBe("120.00");
      expect(result.teacherPaidCurrency).toBe(CurrencyCode.SAR);
      expect(result.isWithinGrace).toBe(true);
      expect(result.isStudentAbsence).toBe(false);
      expect(result.isTeacherAbsence).toBe(false);
      expect(result.isProRated).toBe(false);

      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 60, amount: "120.00" });
      expectTransitionEvent(CalculationStatus.NOT_CALCULATED, null);

      // Locked single-transaction write: advisory lock before the row lock,
      // every write through the same executor, window lookup at 30 seconds.
      expect(acquiredLockKeys).toHaveLength(1);
      expect(acquiredLockKeys[0]?.lockKey).toBe(`payroll_teacher_${TEACHER_ID}`);
      expect(instanceReads).toHaveLength(2);
      expect(instanceReads[1]?.forUpdate).toBe(true);
      expect(payrollPatches[0]?.tx).toBe(TX_SENTINEL);
      expect(idempotencyLookups[0]?.windowSeconds).toBe(IDEMPOTENCY_WINDOW_SECONDS);
      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
      expect(recurringFindByIdMock).not.toHaveBeenCalled();

      // Structured calculation log: the five auditability fields.
      expect(loggerInfoSpy).toHaveBeenCalledWith(
        "Payroll calculation snapshot written",
        expect.objectContaining({
          actorUserId: ACTOR_ID,
          instanceId: INSTANCE_ID,
          previousStatus: CalculationStatus.NOT_CALCULATED,
          newStatus: CalculationStatus.CALCULATED,
          amount: "120.00",
        })
      );
    });

    test("pays zero for an on-demand no-credits-absent session the teacher never joined", async () => {
      instanceRow = buildInstanceRow({
        executionState: ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
        ondemandStatus: OnDemandStatus.NO_CREDITS_ABSENT,
        outcome: ClassOutcome.PENDING,
        actualStartAt: null,
        actualEndAt: null,
      });

      const result = await calculate({ isOnDemand: true });

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.calculatedDuration).toBe(0);
      expect(result.teacherPaidAmount).toBe("0.00");
      expect(result.isTeacherAbsence).toBe(true);
      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 0, amount: "0.00" });
    });

    test("pays zero for an on-demand absent session with no attendance telemetry", async () => {
      // The absent outcome without a join timestamp must not flip the row
      // onto the student-absence branch: nobody taught, so nobody is paid.
      instanceRow = buildInstanceRow({
        executionState: ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
        ondemandStatus: OnDemandStatus.NO_CREDITS_ABSENT,
        outcome: ClassOutcome.ABSENT,
        actualStartAt: null,
        actualEndAt: null,
      });

      const result = await calculate({ isOnDemand: true });

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.calculatedDuration).toBe(0);
      expect(result.teacherPaidAmount).toBe("0.00");
      expect(result.isStudentAbsence).toBe(false);
      expect(result.isTeacherAbsence).toBe(true);
      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 0, amount: "0.00" });
    });

    test("pays a joined teacher the full window for an on-demand absent session", async () => {
      // The teacher actually joined the on-demand session, so the
      // student-absence rule pays the full scheduled window.
      instanceRow = buildInstanceRow({
        executionState: ClassExecutionState.ON_DEMAND_NO_CREDITS_ABSENT,
        ondemandStatus: OnDemandStatus.NO_CREDITS_ABSENT,
        outcome: ClassOutcome.ABSENT,
        actualStartAt: minutesAfter(SCHEDULED_START, 2),
        actualEndAt: minutesAfter(SCHEDULED_START, 62),
      });

      const result = await calculate({ isOnDemand: true });

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.calculatedDuration).toBe(60);
      expect(result.teacherPaidAmount).toBe("120.00");
      expect(result.isStudentAbsence).toBe(true);
      expect(result.isTeacherAbsence).toBe(false);
    });

    test("rejects a session that has not reached a terminal execution state", async () => {
      instanceRow = buildInstanceRow({ executionState: ClassExecutionState.RUNNING });

      const error = await expectCalculationError({}, "PAYROLL_NOT_TERMINAL");
      expect(error.message).toContain("terminal");
      expect(payrollPatches).toHaveLength(0);
      expect(insertedEvents).toHaveLength(0);
    });

    test("rejects an unknown or malformed instance id", async () => {
      instanceRow = null;

      const unknown = await expectCalculationError(
        { instanceId: "00000000-0000-0000-0000-000000000000" },
        "CLASS_INSTANCE_NOT_FOUND"
      );
      expect(unknown).toBeInstanceOf(NotFoundError);
      expect(unknown.message).toContain("not found");

      await expectCalculationError({ instanceId: "not-a-real-instance-id" }, "CLASS_INSTANCE_NOT_FOUND");
      expect(payrollPatches).toHaveLength(0);
      expect(insertedEvents).toHaveLength(0);
    });

    test("resolves the recurring schedule row when the instance carries one", async () => {
      instanceRow = buildInstanceRow({ recurringScheduleId: RECURRING_SCHEDULE_ID });

      const result = await calculate();

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(recurringFindByIdMock).toHaveBeenCalledTimes(1);
      expect(recurringFindByIdMock).toHaveBeenCalledWith(RECURRING_SCHEDULE_ID, TX_SENTINEL);
    });
  });

  describe("grace windows", () => {
    test("pays the full window when the teacher joins on time", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(60, 0),
        expectedDuration: 60,
        expectedAmount: "120.00",
      });
      expect(result.isWithinGrace).toBe(true);
    });

    test("pays a short session in full when the teacher joins at the scheduled start", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(30, 0),
        expectedDuration: 30,
        expectedAmount: "60.00",
      });
      expect(result.isWithinGrace).toBe(true);
      expect(result.isProRated).toBe(false);
    });

    test("forgives lateness within the short grace of a 30-minute session", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(30, 2),
        expectedDuration: 30,
        expectedAmount: "60.00",
      });
      expect(result.isWithinGrace).toBe(true);
      expect(result.isProRated).toBe(false);
    });

    test("treats lateness exactly at the short-grace boundary as on time", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(30, 3),
        expectedDuration: 30,
        expectedAmount: "60.00",
      });
      expect(result.isWithinGrace).toBe(true);
    });

    test("pro-rates a 30-minute session when lateness exceeds the short grace", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(30, 5),
        expectedDuration: 25,
        expectedAmount: "50.00",
      });
      expect(result.isWithinGrace).toBe(false);
      expect(result.isProRated).toBe(true);
      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 25, amount: "50.00" });
    });

    test("forgives lateness within the long grace of a 60-minute session", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(60, 5),
        expectedDuration: 60,
        expectedAmount: "120.00",
      });
      expect(result.isWithinGrace).toBe(true);
    });

    test("pro-rates a 60-minute session when lateness exceeds the long grace", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(60, 7),
        expectedDuration: 53,
        expectedAmount: "106.00",
      });
      expect(result.isProRated).toBe(true);
    });

    test("applies the short grace at exactly the threshold duration and the long grace above it", async () => {
      // 30-minute session: 4 minutes late exceeds the 3-minute short grace.
      const atThreshold = await expectPayableAmount({
        row: joinedSession(30, 4),
        expectedDuration: 26,
        expectedAmount: "52.00",
      });
      expect(atThreshold.isProRated).toBe(true);

      resetMocks();
      // 31-minute session: the same 4-minute lateness sits inside the long grace.
      const aboveThreshold = await expectPayableAmount({
        row: joinedSession(31, 4),
        expectedDuration: 31,
        expectedAmount: "62.00",
      });
      expect(aboveThreshold.isWithinGrace).toBe(true);
    });

    test("treats an early join as on time without crediting extra minutes", async () => {
      const result = await expectPayableAmount({
        row: joinedSession(60, -10),
        expectedDuration: 60,
        expectedAmount: "120.00",
      });
      expect(result.isWithinGrace).toBe(true);
    });
  });

  describe("absence rules", () => {
    test("pays the full scheduled window when the student is absent but the teacher joined", async () => {
      const result = await expectPayableAmount({
        row: { outcome: ClassOutcome.ABSENT, actualStartAt: minutesAfter(SCHEDULED_START, 2) },
        expectedDuration: 60,
        expectedAmount: "120.00",
      });
      expect(result.isStudentAbsence).toBe(true);
      expect(result.isTeacherAbsence).toBe(false);
    });

    test("pays zero for a completed session the teacher never joined", async () => {
      const result = await expectPayableAmount({
        row: { outcome: ClassOutcome.TAKEN, actualStartAt: null, actualEndAt: minutesAfter(SCHEDULED_START, 45) },
        expectedDuration: 0,
        expectedAmount: "0.00",
      });
      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.isTeacherAbsence).toBe(true);
      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 0, amount: "0.00" });
    });

    test("pays zero when both student and teacher missed the session", async () => {
      // An absent outcome with no join telemetry means the session was never
      // taught: the teacher-absence rule applies, not the student-absence one.
      const result = await expectPayableAmount({
        row: { outcome: ClassOutcome.ABSENT, actualStartAt: null, actualEndAt: null },
        expectedDuration: 0,
        expectedAmount: "0.00",
      });
      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.isWithinGrace).toBe(false);
      expect(result.isStudentAbsence).toBe(false);
      expect(result.isTeacherAbsence).toBe(true);
    });

    test("pays a joined teacher in full when the student took a leave", async () => {
      const result = await expectPayableAmount({
        row: { outcome: ClassOutcome.LEAVE },
        expectedDuration: 60,
        expectedAmount: "120.00",
      });
      expect(result.isWithinGrace).toBe(true);
    });

    test("pays zero for a student leave the teacher never joined", async () => {
      // The mirror of the absent-outcome case: without join telemetry the
      // session was never taught, so a student leave does not rescue the
      // row either — the outcome never outvotes the missing attendance.
      const result = await expectPayableAmount({
        row: { outcome: ClassOutcome.LEAVE, actualStartAt: null, actualEndAt: null },
        expectedDuration: 0,
        expectedAmount: "0.00",
      });
      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.isStudentAbsence).toBe(false);
      expect(result.isTeacherAbsence).toBe(true);
    });
  });

  describe("pro-rating caps", () => {
    test("never credits overtime minutes beyond the scheduled end", async () => {
      const result = await expectPayableAmount({
        row: { actualStartAt: minutesAfter(SCHEDULED_START, 10), actualEndAt: minutesAfter(SCHEDULED_START, 90) },
        expectedDuration: 50,
        expectedAmount: "100.00",
      });
      expect(result.isProRated).toBe(true);
    });

    test("pays a valid zero for a teacher who joined after the scheduled end", async () => {
      const result = await expectPayableAmount({
        row: { actualStartAt: minutesAfter(SCHEDULED_START, 75), actualEndAt: minutesAfter(SCHEDULED_START, 80) },
        expectedDuration: 0,
        expectedAmount: "0.00",
      });
      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.isProRated).toBe(true);
    });

    test("falls back to the scheduled end when the end timestamp is missing", async () => {
      await expectPayableAmount({
        row: { actualStartAt: minutesAfter(SCHEDULED_START, 7), actualEndAt: null },
        expectedDuration: 53,
        expectedAmount: "106.00",
      });
    });
  });

  describe("money precision", () => {
    test("multiplies a fractional hourly rate exactly (99.50 × 90 minutes)", async () => {
      await expectPayableAmount({
        row: joinedSession(90, 0),
        rate: "99.50",
        expectedDuration: 90,
        expectedAmount: "149.25",
      });
    });

    test("rounds a half cent up (10.01 × 30 minutes)", async () => {
      await expectPayableAmount({
        row: joinedSession(30, 0),
        rate: "10.01",
        expectedDuration: 30,
        expectedAmount: "5.01",
      });
    });

    test("truncates a three-decimal rate to cents before proration (33.333 × 45 minutes)", async () => {
      await expectPayableAmount({
        row: joinedSession(45, 0),
        rate: "33.333",
        expectedDuration: 45,
        expectedAmount: "25.00",
      });
    });
  });

  describe("status guards", () => {
    test("returns the existing snapshot for an operator-settled row without forceRecalc", async () => {
      instanceRow = buildSettledRow(CalculationStatus.PARTIALLY, "40.00", { isPartialPercentage: 50 });

      const result = await calculate();

      expect(result.calculationStatus).toBe(CalculationStatus.PARTIALLY);
      expect(result.teacherPaidAmount).toBe("40.00");
      expect(result.calculatedDuration).toBe(60);
      expectNoWrites();
    });

    test("forceRecalc replaces an operator-settled snapshot", async () => {
      instanceRow = buildSettledRow(CalculationStatus.PARTIALLY, "40.00", { isPartialPercentage: 50 });

      const result = await calculate({ forceRecalc: true });

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.teacherPaidAmount).toBe("120.00");
      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 60, amount: "120.00" });
      expectTransitionEvent(CalculationStatus.PARTIALLY, "40.00");
    });

    test("returns the existing snapshot for a row awaiting settlement", async () => {
      instanceRow = buildSettledRow(CalculationStatus.WAITING_PAID, "120.00");

      const result = await calculate();

      expect(result.calculationStatus).toBe(CalculationStatus.WAITING_PAID);
      expect(result.teacherPaidAmount).toBe("120.00");
      expectNoWrites();
    });

    test("never recalculates a paid row, even with forceRecalc", async () => {
      instanceRow = buildSettledRow(CalculationStatus.PAID, "120.00");

      const error = await expectCalculationError({ forceRecalc: true }, "PAYROLL_ALREADY_PAID");

      expect(error.message).toContain("already paid");
      expectNoWrites();
    });
  });

  describe("rate resolution failures", () => {
    const unusableRates: [string, string][] = [
      ["an empty rate", ""],
      ["a zero rate", "0"],
      ["a sub-cent rate", "0.001"],
      ["a non-numeric rate", "not-a-rate"],
    ];

    for (const [label, hourlyRate] of unusableRates) {
      test(`degrades to NOT_CALCULATED for ${label}`, async () => {
        resolvedRate = { hourlyRate, currency: CurrencyCode.SAR };

        const result = await calculate();

        expect(result.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
        expectSnapshotPatch({
          status: CalculationStatus.NOT_CALCULATED,
          duration: null,
          amount: null,
          note: RATE_FAILURE_NOTE,
        });
        expectTransitionEvent(CalculationStatus.NOT_CALCULATED, null);
        expect(loggerWarnSpy).toHaveBeenCalledWith(
          "Payroll calculation degraded to NOT_CALCULATED",
          expect.objectContaining({
            actorUserId: ACTOR_ID,
            instanceId: INSTANCE_ID,
            previousStatus: CalculationStatus.NOT_CALCULATED,
            newStatus: CalculationStatus.NOT_CALCULATED,
            amount: null,
          })
        );
      });
    }

    test("degrades to NOT_CALCULATED when the teacher row is missing", async () => {
      teacherRow = null;

      const result = await calculate();

      expect(result.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expectSnapshotPatch({
        status: CalculationStatus.NOT_CALCULATED,
        duration: null,
        amount: null,
        note: TEACHER_FAILURE_NOTE,
      });
    });

    test("keeps calculating when the subject lookup fails", async () => {
      subjectLookupFails = true;

      const result = await calculate();

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.teacherPaidAmount).toBe("120.00");
    });
  });

  describe("idempotency", () => {
    test("returns the first result for an identical re-run within the window", async () => {
      const first = await calculate();

      expect(payrollPatches).toHaveLength(1);
      expect(idempotencyLookups[0]?.hash).toBe(expectedCalculationKey(CalculationStatus.CALCULATED, 60, "120.00"));

      const second = await calculate();

      expect(second).toEqual(first);
      expect(payrollPatches).toHaveLength(1);
      expect(insertedEvents).toHaveLength(1);
      expect(idempotencyLookups[1]?.hash).toBe(idempotencyLookups[0]?.hash);
    });

    test("recalculates when the session content changes after a recent calculation", async () => {
      await calculate();
      const firstHash = idempotencyLookups[0]?.hash;

      const current = instanceRow;
      if (current === null) {
        throw new Error("expected the first calculation to leave a loaded instance row");
      }
      instanceRow = { ...current, actualStartAt: minutesAfter(SCHEDULED_START, 7) };

      const second = await calculate();

      expect(second.calculatedDuration).toBe(53);
      expect(second.teacherPaidAmount).toBe("106.00");
      expect(payrollPatches).toHaveLength(2);
      expect(insertedEvents).toHaveLength(2);
      expect(idempotencyLookups[1]?.hash).not.toBe(firstHash);
    });

    test("collapses two identical concurrent submissions onto one snapshot", async () => {
      const [first, second] = await Promise.all([calculate(), calculate()]);

      expect(second).toEqual(first);
      expect(payrollPatches).toHaveLength(1);
      expect(insertedEvents).toHaveLength(1);
    });
  });

  describe("transaction embedding", () => {
    test("skips the advisory lock when embedded in the caller transaction", async () => {
      // The caller (the scheduling state machine) already holds the instance
      // row lock from its transition update. The embedded run must not wait
      // on the advisory lock: a standalone payroll run holding the advisory
      // and waiting for the same row would deadlock against it.
      const callerTx = asCallerTx({ executor: "scheduling-state-machine-transaction" });
      const { PayrollCalculationService } = await importService();

      const result = await PayrollCalculationService.calculateForInstance(
        { instanceId: INSTANCE_ID, actorUserId: ACTOR_ID },
        tErrors,
        callerTx
      );

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.teacherPaidAmount).toBe("120.00");
      expect(acquiredLockKeys).toHaveLength(0);
      expect(dbTransactionMock).not.toHaveBeenCalled();
      // One FOR UPDATE read straight through the caller executor: no
      // unlocked pre-read, because the advisory lock key is never needed.
      expect(instanceReads).toHaveLength(1);
      expect(instanceReads[0]?.forUpdate).toBe(true);
      expect(instanceReads[0]?.tx).toBe(callerTx);
      expect(payrollPatches[0]?.tx).toBe(callerTx);
      expectSnapshotPatch({ status: CalculationStatus.CALCULATED, duration: 60, amount: "120.00" });
    });

    test("still takes the advisory lock before the row lock on a standalone run", async () => {
      await calculate();

      expect(acquiredLockKeys).toHaveLength(1);
      expect(acquiredLockKeys[0]?.lockKey).toBe(`payroll_teacher_${TEACHER_ID}`);
      expect(instanceReads).toHaveLength(2);
      expect(instanceReads[0]?.forUpdate).toBe(false);
      expect(instanceReads[1]?.forUpdate).toBe(true);
    });
  });

  describe("permission and input abuse", () => {
    test("rejects an actor without the payroll manage permission before reading anything", async () => {
      permissionError = new ForbiddenError(tErrors.insufficientPermissions);

      const error = await expectCalculationError({}, "FORBIDDEN");

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe("insufficient permissions");
      expect(instanceReads).toHaveLength(0);
      expect(payrollPatches).toHaveLength(0);
      expect(insertedEvents).toHaveLength(0);
      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
    });
  });
});

describe("PayrollCalculationService.getReport", () => {
  beforeEach(() => {
    resetMocks();
  });

  test("computes exact aggregates from the page itself when the filtered set fits on it", async () => {
    reportRows = [
      buildReportRow(),
      buildReportRow({ teacherPaidAmount: "60.50", calculationStatus: CalculationStatus.PARTIALLY }),
      buildReportRow({ teacherPaidAmount: "0", calculationStatus: CalculationStatus.REFUND }),
    ];
    reportTotalCount = 3;

    const page = await readReport({ limit: 50, offset: 0 });

    expect(reportReads).toHaveLength(1);
    expect(reportReads[0]?.limit).toBe(50);
    expect(reportReads[0]?.offset).toBe(0);
    expect(page.rows).toHaveLength(3);
    expect(page.totalCount).toBe(3);
    expect(page.aggregates.totalPaidAmount).toBe("180.50");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByStatus).toEqual({
      [CalculationStatus.NOT_CALCULATED]: 0,
      [CalculationStatus.CALCULATED]: 1,
      [CalculationStatus.PARTIALLY]: 1,
      [CalculationStatus.REFUND]: 1,
      [CalculationStatus.WAITING_PAID]: 0,
      [CalculationStatus.PAID]: 0,
    });
  });

  test("re-scans the filtered set at the export ceiling when the page is a slice", async () => {
    reportRows = [
      buildReportRow({ teacherPaidAmount: "10.00" }),
      buildReportRow({ teacherPaidAmount: "20.00" }),
      buildReportRow({ teacherPaidAmount: "30.00" }),
      buildReportRow({ teacherPaidAmount: "40.00" }),
      buildReportRow({ teacherPaidAmount: "50.00" }),
    ];
    reportTotalCount = 5;

    const page = await readReport({ limit: 2, offset: 0 });

    expect(reportReads).toHaveLength(2);
    expect(reportReads[1]?.limit).toBe(10_000);
    expect(reportReads[1]?.offset).toBe(0);
    expect(page.rows).toHaveLength(2);
    expect(page.totalCount).toBe(5);
    expect(page.aggregates.totalPaidAmount).toBe("150.00");
  });

  test("re-scans even a small filtered set when the page starts beyond the first row", async () => {
    reportRows = [
      buildReportRow({ teacherPaidAmount: "5.00" }),
      buildReportRow({ teacherPaidAmount: "6.00" }),
      buildReportRow({ teacherPaidAmount: "7.00" }),
    ];
    reportTotalCount = 3;

    const page = await readReport({ limit: 50, offset: 2 });

    expect(reportReads).toHaveLength(2);
    expect(page.rows).toHaveLength(1);
    expect(page.aggregates.totalPaidAmount).toBe("18.00");
  });

  test("treats a set exactly the page size as fitting, and one row more forces the capped re-scan", async () => {
    const fitRows = [
      buildReportRow({ teacherPaidAmount: "1.00" }),
      buildReportRow({ teacherPaidAmount: "2.00" }),
      buildReportRow({ teacherPaidAmount: "3.00" }),
    ];
    const scenarios: { rows: PayrollReportRow[]; totalCount: number; expectedReads: number }[] = [
      { rows: fitRows, totalCount: 3, expectedReads: 1 },
      { rows: [...fitRows, buildReportRow({ teacherPaidAmount: "4.00" })], totalCount: 4, expectedReads: 2 },
    ];

    await scenarios.reduce(async (previous, scenario) => {
      await previous;
      resetMocks();
      reportRows = [...scenario.rows];
      reportTotalCount = scenario.totalCount;
      const page = await readReport({ limit: 3, offset: 0 });
      expect(reportReads).toHaveLength(scenario.expectedReads);
      expect(page.rows).toHaveLength(Math.min(scenario.totalCount, 3));
    }, Promise.resolve());
  });

  test("skips null and malformed amounts while summing the filtered set", async () => {
    reportRows = [
      buildReportRow({ teacherPaidAmount: null, calculationStatus: CalculationStatus.NOT_CALCULATED }),
      buildReportRow({ teacherPaidAmount: "30.00" }),
      buildReportRow({ teacherPaidAmount: "not-a-decimal" }),
    ];
    reportTotalCount = 3;

    const page = await readReport({ limit: 50, offset: 0 });

    expect(page.aggregates.totalPaidAmount).toBe("30.00");
    expect(page.aggregates.rowCountByStatus[CalculationStatus.CALCULATED]).toBe(2);
    expect(page.aggregates.rowCountByStatus[CalculationStatus.NOT_CALCULATED]).toBe(1);
  });

  test("picks the most frequent currency, keeps the earliest on ties, and defaults when none is set", async () => {
    const scenarios: { currencies: Array<CurrencyCode | null>; expected: CurrencyCode }[] = [
      { currencies: [CurrencyCode.USD, CurrencyCode.USD, CurrencyCode.SAR], expected: CurrencyCode.USD },
      { currencies: [CurrencyCode.SAR, CurrencyCode.USD], expected: CurrencyCode.SAR },
      { currencies: [null, null], expected: CurrencyCode.SAR },
    ];

    await scenarios.reduce(async (previous, scenario) => {
      await previous;
      resetMocks();
      reportRows = scenario.currencies.map(currency => buildReportRow({ teacherPaidCurrency: currency }));
      reportTotalCount = reportRows.length;
      const page = await readReport({ limit: 50, offset: 0 });
      expect(page.aggregates.totalPaidCurrency).toBe(scenario.expected);
    }, Promise.resolve());
  });

  test("zero-fills every status key and the money sum for an empty filtered set", async () => {
    reportRows = [];
    reportTotalCount = 0;

    const page = await readReport({ limit: 50, offset: 0 });

    expect(reportReads).toHaveLength(1);
    expect(page.rows).toHaveLength(0);
    expect(page.totalCount).toBe(0);
    expect(page.aggregates.totalPaidAmount).toBe("0.00");
    expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByStatus).toEqual({
      [CalculationStatus.NOT_CALCULATED]: 0,
      [CalculationStatus.CALCULATED]: 0,
      [CalculationStatus.PARTIALLY]: 0,
      [CalculationStatus.REFUND]: 0,
      [CalculationStatus.WAITING_PAID]: 0,
      [CalculationStatus.PAID]: 0,
    });
  });

  test("forwards the caller filters and pagination to the report repository", async () => {
    const filters: PayrollReportFilters = {
      teacherId: TEACHER_ID,
      calculationStatuses: [CalculationStatus.CALCULATED],
      search: "Payroll Report",
    };

    const page = await readReport({ limit: 25, offset: 50 }, filters);

    // The paged read carries the caller pagination; a page starting past the
    // first row also triggers the capped aggregate re-scan with the filters.
    expect(reportReads).toHaveLength(2);
    expect(reportReads[0]?.filters).toEqual(filters);
    expect(reportReads[0]?.limit).toBe(25);
    expect(reportReads[0]?.offset).toBe(50);
    expect(reportReads[1]?.filters).toEqual(filters);
    expect(page.rows).toHaveLength(0);
  });

  test("rejects an actor without the payroll view permission before reading anything", async () => {
    permissionError = new ForbiddenError(tErrors.insufficientPermissions);

    let caught: unknown = null;
    try {
      await readReport({ limit: 50, offset: 0 });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ForbiddenError);
    if (caught instanceof ForbiddenError) {
      expect(caught.code).toBe("FORBIDDEN");
      expect(caught.message).toBe("insufficient permissions");
    }
    expect(reportReads).toHaveLength(0);
    expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);
  });
});
