import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import type { PayrollCalculationPatch } from "@/backend/db/repo/scheduling/class-instances";
import { AppPermission, CalculationStatus, SchedulingMode } from "@/backend/enum";
import { DomainError, ForbiddenError, logger, NotFoundError, ValidationError } from "@/backend/lib";
import { deriveOverrideIdempotencyKey } from "@/backend/services/teacher/payroll-override.idempotency";
import type {
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  ClassStatusEventSelectType,
  PayrollOverrideInput,
  PayrollOverrideResult,
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

const SCHEDULED_START = new Date("2026-08-20T10:00:00.000Z");
const DEFAULT_RATE = { hourlyRate: "120", currency: CurrencyCode.SAR };
const RATE_FAILURE_NOTE = "Auto-calc failed: rate resolution returned no usable rate";
const REFUND_NOTE = "parent requested a refund";

/** Sentinel executor handed to the service callback — proves the write shares the caller's transaction. */
const TX_SENTINEL = { executor: "payroll-override-test-transaction" };

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
    calculatedDuration: 60,
    teacherPaidAmount: "100.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.CALCULATED,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: new Date("2026-08-20T11:05:00.000Z"),
    payrollCalculatedBy: ACTOR_ID,
    remarks: null,
    adminNotes: null,
    idempotencyKey: "booking-idempotency-key",
    createdAt: new Date("2026-08-19T08:00:00.000Z"),
    updatedAt: new Date("2026-08-19T08:00:00.000Z"),
    deletedAt: null,
    ...overrides,
  };
}

/** A row whose payroll snapshot was already written in a prior step. */
function buildSettledRow(
  status: CalculationStatus,
  amount: string | null,
  extra: Partial<ClassInstanceSelectType> = {}
): ClassInstanceSelectType {
  return buildInstanceRow({
    calculationStatus: status,
    calculatedDuration: amount === null ? null : 60,
    teacherPaidAmount: amount,
    ...extra,
  });
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
const idempotencyLookups: { instanceId: string; hash: string; windowSeconds: number }[] = [];
const acquiredLockKeys: { tx: unknown; lockKey: string }[] = [];
const instanceReads: { id: string; tx: unknown; forUpdate: boolean }[] = [];

let eventCounter = 0;
let instanceRow: ClassInstanceSelectType | null = buildInstanceRow();
let resolvedRate: { hourlyRate: string; currency: CurrencyCode } = { ...DEFAULT_RATE };
let teacherRow: { id: string } | null = { id: TEACHER_ID };
let permissionError: Error | null = null;
let transactionChain: Promise<unknown> = Promise.resolve();

function readIdempotencyKey(toState: unknown): string | null {
  if (toState != null && typeof toState === "object" && "idempotencyKey" in toState) {
    const value = (toState as { idempotencyKey?: unknown }).idempotencyKey;
    return typeof value === "string" ? value : null;
  }
  return null;
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

const findRecentByInstanceAndHashMock = mock(async (instanceId: string, hash: string, windowSeconds: number) => {
  idempotencyLookups.push({ instanceId, hash, windowSeconds });
  for (let index = eventStore.length - 1; index >= 0; index -= 1) {
    const event = eventStore[index];
    if (event?.classInstanceId === instanceId && readIdempotencyKey(event.toState) === hash) {
      return event;
    }
  }
  return null;
});

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

const recurringFindByIdMock = mock(async () => null);

const subjectGetByIdMock = mock(async () => ({ id: SUBJECT_ID }));

const teacherFindByIdMock = mock(async () => teacherRow);

const acquireAdvisoryLockMock = mock(async (tx: unknown, lockKey: string) => {
  acquiredLockKeys.push({ tx, lockKey });
});

const resolveGraceSettingsMock = mock(async () => ({ shortMinutes: 3, longMinutes: 6, thresholdMinutes: 30 }));

const resolveClassRateMock = mock(() => resolvedRate);

const requirePermissionMock = mock(async (_actorUserId: string, _permission: AppPermission, _tErrors: ErrorsLabels) => {
  if (permissionError !== null) {
    throw permissionError;
  }
});

/**
 * Transaction executor stand-in. Calls are chained so a second override for
 * the same rows observes the first one's committed event — the in-process
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

function buildOverrideInput(overrides: Partial<PayrollOverrideInput> = {}): PayrollOverrideInput {
  return {
    instanceId: INSTANCE_ID,
    actorUserId: ACTOR_ID,
    targetStatus: CalculationStatus.REFUND,
    partialPercentage: null,
    note: REFUND_NOTE,
    force: false,
    clientRequestId: "client-request-1",
    ...overrides,
  };
}

async function applyOverrideInput(overrides: Partial<PayrollOverrideInput> = {}): Promise<PayrollOverrideResult> {
  const { PayrollCalculationService } = await importService();
  return PayrollCalculationService.applyOverride(buildOverrideInput(overrides), tErrors);
}

async function expectOverrideError(overrides: Partial<PayrollOverrideInput>, code: string): Promise<DomainError> {
  let caught: unknown = null;
  try {
    await applyOverrideInput(overrides);
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

function solePatch(): PayrollCalculationPatch {
  expect(payrollPatches).toHaveLength(1);
  const patch = payrollPatches[0]?.patch;
  if (!patch) {
    throw new Error("expected one payroll patch");
  }
  return patch;
}

function soleEvent(): ClassStatusEventSeedInsertInput {
  expect(insertedEvents).toHaveLength(1);
  const event = insertedEvents[0];
  if (!event) {
    throw new Error("expected one payroll event");
  }
  return event;
}

function expectNoWrites(): void {
  expect(payrollPatches).toHaveLength(0);
  expect(insertedEvents).toHaveLength(0);
}

/** Applies a Partially override and asserts the prorated row + patch outcome. */
async function expectPartialOverride(percentage: number, expectedAmount: string): Promise<PayrollOverrideResult> {
  const result = await applyOverrideInput({
    targetStatus: CalculationStatus.PARTIALLY,
    partialPercentage: percentage,
    note: "goodwill partial payment",
  });

  expect(result.calculationStatus).toBe(CalculationStatus.PARTIALLY);
  expect(result.teacherPaidAmount).toBe(expectedAmount);
  expect(result.isPartialPercentage).toBe(percentage);

  const patch = solePatch();
  expect(patch.calculationStatus).toBe(CalculationStatus.PARTIALLY);
  expect(patch.teacherPaidAmount).toBe(expectedAmount);
  expect(patch.isPartialPercentage).toBe(percentage);
  expect(patch.payrollNote).toBe("goodwill partial payment");
  expect(patch.payrollCalculatedBy).toBe(ACTOR_ID);
  return result;
}

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});

function resetMocks(): void {
  payrollPatches.length = 0;
  insertedEvents.length = 0;
  eventStore.length = 0;
  idempotencyLookups.length = 0;
  acquiredLockKeys.length = 0;
  instanceReads.length = 0;

  eventCounter = 0;
  instanceRow = buildInstanceRow();
  resolvedRate = { ...DEFAULT_RATE };
  teacherRow = { id: TEACHER_ID };
  permissionError = null;
  transactionChain = Promise.resolve();

  getByIdMock.mockClear();
  updatePayrollCalculationMock.mockClear();
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
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PayrollCalculationService.applyOverride", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("override modes", () => {
    test("zeroes the amount and records a refund audit event", async () => {
      const result = await applyOverrideInput();

      expect(result.instanceId).toBe(INSTANCE_ID);
      expect(result.calculationStatus).toBe(CalculationStatus.REFUND);
      expect(result.teacherPaidAmount).toBe("0");
      expect(result.teacherPaidCurrency).toBe(CurrencyCode.SAR);
      expect(result.calculatedDuration).toBe(60);
      expect(result.isPartialPercentage).toBeNull();
      expect(result.payrollNote).toBe(REFUND_NOTE);
      expect(result.auditEventId).toBe("payroll-event-1");

      const patch = solePatch();
      expect(patch.calculationStatus).toBe(CalculationStatus.REFUND);
      expect(patch.teacherPaidAmount).toBe("0");
      expect(patch.isPartialPercentage).toBeNull();
      expect(patch.payrollNote).toBe(REFUND_NOTE);
      expect(patch.payrollCalculatedBy).toBe(ACTOR_ID);
      // Duration and currency are preserved for audit; only the amount is zeroed.
      expect(patch.calculatedDuration).toBeUndefined();
      expect(patch.teacherPaidCurrency).toBeUndefined();

      const event = soleEvent();
      expect(event.eventType).toBe("PAYROLL_OVERRIDE");
      expect(event.classInstanceId).toBe(INSTANCE_ID);
      expect(event.actorUserId).toBe(ACTOR_ID);
      expect(event.description).toBe(REFUND_NOTE);
      expect(event.fromState).toEqual({ calculationStatus: CalculationStatus.CALCULATED, teacherPaidAmount: "100.00" });
      expect(event.toState).toEqual({
        calculationStatus: CalculationStatus.REFUND,
        teacherPaidAmount: "0",
        partialPercentage: null,
        idempotencyKey: deriveOverrideIdempotencyKey(buildOverrideInput()),
      });

      // Locked single-transaction write: advisory lock, FOR UPDATE re-read,
      // patch + event through the same executor, window lookup at 30 seconds.
      expect(acquiredLockKeys).toHaveLength(1);
      expect(acquiredLockKeys[0]?.lockKey).toBe(`payroll_teacher_${TEACHER_ID}`);
      expect(instanceReads).toHaveLength(2);
      expect(instanceReads[1]?.forUpdate).toBe(true);
      expect(payrollPatches[0]?.tx).toBe(TX_SENTINEL);
      expect(idempotencyLookups[0]?.windowSeconds).toBe(30);
    });

    test("re-runs the calculator and flips the row to CALCULATED", async () => {
      instanceRow = buildSettledRow(CalculationStatus.NOT_CALCULATED, null);

      const result = await applyOverrideInput({
        targetStatus: CalculationStatus.CALCULATED,
        note: "recomputed after attendance fix",
      });

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(result.teacherPaidAmount).toBe("120.00");
      expect(result.calculatedDuration).toBe(60);
      expect(result.payrollNote).toBe("recomputed after attendance fix");

      const patch = solePatch();
      expect(patch.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(patch.teacherPaidAmount).toBe("120.00");
      expect(patch.calculatedDuration).toBe(60);
      expect(patch.payrollNote).toBe("recomputed after attendance fix");
    });

    test("accepts a calculated override without an operator note", async () => {
      const result = await applyOverrideInput({ targetStatus: CalculationStatus.CALCULATED, note: null });

      expect(result.calculationStatus).toBe(CalculationStatus.CALCULATED);
      expect(solePatch().payrollNote).toBeNull();
    });

    test("clears the amount and duration for a not-calculated override", async () => {
      const result = await applyOverrideInput({ targetStatus: CalculationStatus.NOT_CALCULATED });

      expect(result.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expect(result.teacherPaidAmount).toBeNull();
      expect(result.calculatedDuration).toBeNull();
      expect(result.payrollNote).toBe(REFUND_NOTE);

      const patch = solePatch();
      expect(patch.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expect(patch.teacherPaidAmount).toBeNull();
      expect(patch.calculatedDuration).toBeNull();
      expect(patch.isPartialPercentage).toBeNull();

      const event = soleEvent();
      expect(event.toState).toMatchObject({
        calculationStatus: CalculationStatus.NOT_CALCULATED,
        teacherPaidAmount: null,
      });
    });

    test("halves the calculated amount at pct=50", async () => {
      await expectPartialOverride(50, "50.00");
    });

    test("zeroes the amount at pct=0 while keeping a distinct audit trail", async () => {
      const result = await expectPartialOverride(0, "0.00");

      expect(soleEvent().toState).toMatchObject({
        calculationStatus: CalculationStatus.PARTIALLY,
        teacherPaidAmount: "0.00",
        partialPercentage: 0,
      });
      expect(result.calculationStatus).toBe(CalculationStatus.PARTIALLY);
    });

    test("pays the full calculated amount at pct=100", async () => {
      await expectPartialOverride(100, "100.00");
    });

    test("rounds a half cent up when prorating (10.01 at pct=50)", async () => {
      instanceRow = buildSettledRow(CalculationStatus.CALCULATED, "10.01");
      await expectPartialOverride(50, "5.01");
    });

    test("prorates from a fresh calculation when the row carries no amount", async () => {
      instanceRow = buildSettledRow(CalculationStatus.NOT_CALCULATED, null);

      await expectPartialOverride(50, "60.00");
    });

    test("prorates from zero when a fresh calculation fails", async () => {
      instanceRow = buildSettledRow(CalculationStatus.NOT_CALCULATED, null);
      resolvedRate = { hourlyRate: "", currency: CurrencyCode.SAR };

      await expectPartialOverride(50, "0.00");
    });

    test("keeps the failure note when a calculated override hits a rate failure", async () => {
      resolvedRate = { hourlyRate: "", currency: CurrencyCode.SAR };

      const result = await applyOverrideInput({ targetStatus: CalculationStatus.CALCULATED });

      expect(result.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expect(result.teacherPaidAmount).toBeNull();
      expect(result.payrollNote).toBe(RATE_FAILURE_NOTE);

      const patch = solePatch();
      expect(patch.calculationStatus).toBe(CalculationStatus.NOT_CALCULATED);
      expect(patch.payrollNote).toBe(RATE_FAILURE_NOTE);
      // The operator note rides on the audit event, not the failure snapshot.
      const event = soleEvent();
      expect(event.description).toBe(REFUND_NOTE);
      expect(event.toState).toMatchObject({ calculationStatus: CalculationStatus.NOT_CALCULATED });
    });
  });

  describe("input validation", () => {
    test("rejects a partially override without a percentage", async () => {
      const error = await expectOverrideError({ targetStatus: CalculationStatus.PARTIALLY }, "VALIDATION");

      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe("partial override requires a percentage");
      expect(instanceReads).toHaveLength(0);
      expectNoWrites();
    });

    const notelessOverrides: [string, Partial<PayrollOverrideInput>][] = [
      ["refund with a null note", { targetStatus: CalculationStatus.REFUND, note: null }],
      ["refund with a blank note", { targetStatus: CalculationStatus.REFUND, note: "   " }],
      ["partially with a null note", { targetStatus: CalculationStatus.PARTIALLY, partialPercentage: 50, note: null }],
      [
        "partially with a blank note",
        { targetStatus: CalculationStatus.PARTIALLY, partialPercentage: 50, note: "   " },
      ],
    ];

    for (const [label, overrides] of notelessOverrides) {
      test(`rejects ${label}`, async () => {
        const error = await expectOverrideError(overrides, "VALIDATION");

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe("invalid input");
        expect(instanceReads).toHaveLength(0);
        expectNoWrites();
      });
    }

    const invalidPercentages: [string, number][] = [
      ["above the maximum", 101],
      ["below the minimum", -1],
      ["non-integer", 50.5],
    ];

    for (const [label, partialPercentage] of invalidPercentages) {
      test(`rejects a percentage ${label}`, async () => {
        const error = await expectOverrideError(
          { targetStatus: CalculationStatus.PARTIALLY, partialPercentage },
          "VALIDATION"
        );

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe("invalid input");
        expect(instanceReads).toHaveLength(0);
      });
    }

    const settlementTargets: CalculationStatus[] = [CalculationStatus.WAITING_PAID, CalculationStatus.PAID];

    for (const targetStatus of settlementTargets) {
      test(`rejects ${targetStatus} as an override target`, async () => {
        const error = await expectOverrideError({ targetStatus }, "VALIDATION");

        expect(error).toBeInstanceOf(ValidationError);
        expect(error.message).toBe("invalid override target status");
        expect(instanceReads).toHaveLength(0);
        expectNoWrites();
      });
    }
  });

  describe("state guards", () => {
    test("rejects an override on a paid row", async () => {
      instanceRow = buildSettledRow(CalculationStatus.PAID, "100.00");

      const error = await expectOverrideError({}, "PAYROLL_ALREADY_PAID");

      expect(error.message).toContain("already paid");
      expectNoWrites();
    });

    test("rejects an override on a row awaiting settlement without force", async () => {
      instanceRow = buildSettledRow(CalculationStatus.WAITING_PAID, "100.00");

      const error = await expectOverrideError({}, "PAYROLL_AWAITING_SETTLEMENT");

      expect(error.message).toContain("awaiting settlement");
      expectNoWrites();
    });

    test("applies a forced override on a row awaiting settlement", async () => {
      instanceRow = buildSettledRow(CalculationStatus.WAITING_PAID, "100.00");

      const result = await applyOverrideInput({ force: true });

      expect(result.calculationStatus).toBe(CalculationStatus.REFUND);
      expect(result.teacherPaidAmount).toBe("0");
      expect(solePatch().calculationStatus).toBe(CalculationStatus.REFUND);
      expect(soleEvent().fromState).toEqual({
        calculationStatus: CalculationStatus.WAITING_PAID,
        teacherPaidAmount: "100.00",
      });
    });
  });

  describe("idempotency", () => {
    test("returns the first-applied result for an identical re-submission within the window", async () => {
      const first = await applyOverrideInput();

      expect(idempotencyLookups[0]?.hash).toBe(deriveOverrideIdempotencyKey(buildOverrideInput()));

      const second = await applyOverrideInput();

      expect(second.auditEventId).toBe(first.auditEventId);
      expect(second.calculationStatus).toBe(first.calculationStatus);
      expect(second.teacherPaidAmount).toBe(first.teacherPaidAmount);
      expect(second.payrollNote).toBe(first.payrollNote);
      expect(payrollPatches).toHaveLength(1);
      expect(insertedEvents).toHaveLength(1);
    });

    test("applies a new override when only the client request id differs", async () => {
      // A provided client request id IS the idempotency token: a different
      // token means a different request, so the second override applies.
      const first = await applyOverrideInput();
      const second = await applyOverrideInput({ clientRequestId: "client-request-2" });

      expect(second.auditEventId).not.toBe(first.auditEventId);
      expect(payrollPatches).toHaveLength(2);
      expect(insertedEvents).toHaveLength(2);
    });

    test("returns the first-applied result for the same client request id even when the content differs", async () => {
      // A double-clicked submission keeps its token across retries: the
      // first-applied result wins for the whole idempotency window.
      const first = await applyOverrideInput();
      const second = await applyOverrideInput({
        targetStatus: CalculationStatus.PARTIALLY,
        partialPercentage: 25,
        note: "changed my mind midway",
      });

      expect(second.auditEventId).toBe(first.auditEventId);
      expect(second.calculationStatus).toBe(first.calculationStatus);
      expect(second.teacherPaidAmount).toBe(first.teacherPaidAmount);
      expect(payrollPatches).toHaveLength(1);
      expect(insertedEvents).toHaveLength(1);
    });

    test("collapses an identical re-submission without a client request id onto the content key", async () => {
      const first = await applyOverrideInput({ clientRequestId: null });
      const second = await applyOverrideInput({ clientRequestId: null });

      expect(second.auditEventId).toBe(first.auditEventId);
      expect(payrollPatches).toHaveLength(1);
      expect(insertedEvents).toHaveLength(1);
    });

    test("applies a new override when the note differs", async () => {
      await applyOverrideInput();

      const second = await applyOverrideInput({ note: "different justification", clientRequestId: "client-request-2" });

      expect(second.payrollNote).toBe("different justification");
      expect(second.auditEventId).not.toBe("payroll-event-1");
      expect(payrollPatches).toHaveLength(2);
      expect(insertedEvents).toHaveLength(2);
    });

    test("collapses two concurrent identical submissions onto one event", async () => {
      // Same client request id on both legs: a rapid double-click carries
      // the same token, so the concurrent retry collapses onto the first.
      const [first, second] = await Promise.all([applyOverrideInput(), applyOverrideInput()]);

      expect(second.auditEventId).toBe(first.auditEventId);
      expect(payrollPatches).toHaveLength(1);
      expect(insertedEvents).toHaveLength(1);
    });
  });

  describe("note sanitization", () => {
    const attackNotes: { label: string; payload: string; forbidden: string[] }[] = [
      {
        label: "a script container",
        payload: "<script>alert(1)</script>refund please",
        forbidden: ["<script", "alert(1)"],
      },
      {
        label: "an image error handler",
        payload: '<img src="x" onerror="alert(1)">refund',
        forbidden: ["onerror", "<img"],
      },
      {
        label: "an svg onload handler",
        payload: "<svg onload=alert(1)></svg>refund",
        forbidden: ["<svg", "onload"],
      },
    ];

    for (const { label, payload, forbidden } of attackNotes) {
      test(`neutralizes ${label} before persisting`, async () => {
        await applyOverrideInput({ note: payload });

        const persisted = solePatch().payrollNote ?? "";
        expect(persisted).not.toBe(payload);
        for (const fragment of forbidden) {
          expect(persisted).not.toContain(fragment);
        }
        expect(soleEvent().description).toBe(persisted);
      });
    }

    test("truncates an over-long note to the 2000-character column limit", async () => {
      await applyOverrideInput({ note: "r".repeat(2500) });

      const persisted = solePatch().payrollNote ?? "";
      expect(persisted).toHaveLength(2000);
      expect(persisted.endsWith("…")).toBe(true);
    });

    test("preserves an Arabic note verbatim", async () => {
      const note = "استرداد بناءً على طلب ولي الأمر";
      await applyOverrideInput({ note });

      expect(solePatch().payrollNote).toBe(note);
      expect(soleEvent().description).toBe(note);
    });
  });

  describe("permission and input abuse", () => {
    test("rejects an actor without the payroll manage permission before validating or reading", async () => {
      permissionError = new ForbiddenError(tErrors.insufficientPermissions);

      const error = await expectOverrideError({ targetStatus: CalculationStatus.PAID }, "FORBIDDEN");

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe("insufficient permissions");
      expect(instanceReads).toHaveLength(0);
      expectNoWrites();
      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_PAYROLL_MANAGE, tErrors);
    });

    test("rejects an unknown instance id", async () => {
      instanceRow = null;

      const error = await expectOverrideError({}, "CLASS_INSTANCE_NOT_FOUND");

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain("not found");
      expectNoWrites();
    });
  });
});
