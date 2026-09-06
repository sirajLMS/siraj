import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AppPermission, CalculationStatus, ExpenseType } from "@/backend/enum";
import { DomainError, ForbiddenError, logger, NotFoundError, ValidationError } from "@/backend/lib";
import { deriveBulkToExpenseIdempotencyKey } from "@/backend/services/teachers/carryover-idempotency";
import type {
  AuditLogReturnType,
  BulkToExpenseInput,
  CarryoverBalanceSelectType,
  ClassInstanceSelectType,
  ClassStatusEventSeedInsertInput,
  CreateAuditLogInput,
  CreateExpenseInput,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "aaaaaaaa-0001-4baa-a333-333333333333";
const TEACHER_ID = "bbbbbbbb-0002-4baa-9444-444444444444";
const TEACHER_USER_ID = "bbbbbbbb-0003-4baa-8555-555555555555";
const CARRYOVER_A_ID = "dddddddd-0004-4baa-9666-666666666666";
const CARRYOVER_B_ID = "dddddddd-0005-4baa-b777-777777777777";
const SESSION_A1_ID = "eeeeeeee-0006-4baa-a888-888888888888";
const SESSION_A2_ID = "eeeeeeee-0007-4baa-8999-999999999999";
const SESSION_B1_ID = "eeeeeeee-0008-4baa-a000-000000000000";

const PAYMENT_DATE = "2026-09-05";
const PAYABLE_A = "240.00";
const PAYABLE_B = "90.50";

/** Fields the settle flow actually reads off a linked session row. */
type LinkedSessionStub = Pick<ClassInstanceSelectType, "id" | "calculationStatus" | "teacherPaidAmount">;

function buildSessionStub(
  id: string,
  calculationStatus: CalculationStatus,
  teacherPaidAmount: string | null
): LinkedSessionStub {
  return { id, calculationStatus, teacherPaidAmount };
}

function buildCarryoverRow(overrides: Partial<CarryoverBalanceSelectType> = {}): CarryoverBalanceSelectType {
  return {
    id: CARRYOVER_A_ID,
    teacherId: TEACHER_ID,
    studentsCount: 2,
    studentsText: "Student One, Student Two",
    totalDuration: "3.00",
    payable: PAYABLE_A,
    teacherCurrency: CurrencyCode.SAR,
    paid: "0",
    fromDate: "2026-08-01",
    toDate: "2026-08-31",
    paymentDate: null,
    isDisabledTeacher: false,
    isPaid: false,
    expenseId: null,
    note: null,
    createdByUserId: ACTOR_ID,
    paidByUserId: null,
    paidAt: null,
    createdAt: new Date("2026-09-01T08:00:00.000Z"),
    updatedAt: new Date("2026-09-01T08:00:00.000Z"),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

/** Sentinel executor handed to the service callback — proves every write shares the caller's transaction. */
const TX_SENTINEL = { executor: "carryover-to-expense-test-transaction" };

const carryoverRows = new Map<string, CarryoverBalanceSelectType>();
const linkedSessionsByCarryover = new Map<string, LinkedSessionStub[]>();
const carryoverUpdates: { id: string; patch: Record<string, unknown>; tx: unknown }[] = [];
const sessionPatches: { tx: unknown; id: string; patch: { calculationStatus: CalculationStatus } }[] = [];
const eventsCreated: ClassStatusEventSeedInsertInput[] = [];
const auditStore: AuditLogReturnType[] = [];
const acquiredLockKeys: { tx: unknown; lockKey: string }[] = [];
const permissionChecks: { actorUserId: string; permission: AppPermission }[] = [];
const lockedCarryoverReads: { ids: readonly string[]; tx: unknown }[] = [];
const linkedSessionOptions: ({ forUpdate?: boolean } | null)[] = [];

let auditCounter = 0;
let permissionError: Error | null = null;

const getByIdsForUpdateMock = mock(async (ids: readonly string[], tx: unknown) => {
  lockedCarryoverReads.push({ ids, tx });
  const found: CarryoverBalanceSelectType[] = [];
  for (const id of ids) {
    const row = carryoverRows.get(id);
    if (row) found.push(row);
  }
  return found;
});

const updateCarryoverMock = mock(async (id: string, patch: Record<string, unknown>, tx: unknown) => {
  const current = carryoverRows.get(id);
  if (current == null) return null;
  const updated: CarryoverBalanceSelectType = { ...current, ...patch };
  carryoverRows.set(id, updated);
  carryoverUpdates.push({ id, patch, tx });
  return updated;
});

const findLinkedSessionsMock = mock(async (carryoverId: string, _tx: unknown, opts?: { forUpdate?: boolean }) => {
  linkedSessionOptions.push(opts ?? null);
  return linkedSessionsByCarryover.get(carryoverId) ?? [];
});

const updatePayrollCalculationMock = mock(
  async (tx: unknown, id: string, patch: { calculationStatus: CalculationStatus }) => {
    sessionPatches.push({ tx, id, patch });
  }
);

const createManyEventsMock = mock(async (inputs: readonly ClassStatusEventSeedInsertInput[], _tx: unknown) => {
  let eventCounter = eventsCreated.length;
  return inputs.map(input => {
    eventCounter += 1;
    eventsCreated.push(input);
    return {
      id: `carryover-event-${eventCounter}`,
      classInstanceId: input.classInstanceId,
      eventType: input.eventType,
      fromState: input.fromState ?? null,
      toState: input.toState ?? null,
      description: input.description ?? null,
      actorUserId: input.actorUserId ?? null,
      createdAt: input.createdAt ?? new Date(),
    };
  });
});

const teacherFindByIdMock = mock(async () => ({ id: TEACHER_ID, userId: TEACHER_USER_ID }));

const userFindByIdsMock = mock(
  async () => new Map([[TEACHER_USER_ID, { name: "Carryover Teacher", avatarUrl: null }]])
);

const acquireAdvisoryLockMock = mock(async (tx: unknown, lockKey: string) => {
  acquiredLockKeys.push({ tx, lockKey });
});

const requirePermissionMock = mock(async (actorUserId: string, permission: AppPermission) => {
  permissionChecks.push({ actorUserId, permission });
  if (permissionError !== null) {
    throw permissionError;
  }
});

const queryAuditLogsMock = mock(
  async (filters: { actorUserId?: string | null; action?: AuditLogReturnType["action"] }, _tx: unknown) => {
    const logs = auditStore
      .filter(row => row.actorUserId === filters.actorUserId && row.action === filters.action)
      .toReversed();
    return { logs, total: logs.length, hasMore: false };
  }
);

const createManyAuditLogsMock = mock(async (inputs: readonly CreateAuditLogInput[], _tx: unknown) => {
  return inputs.map(input => {
    auditCounter += 1;
    const row: AuditLogReturnType = {
      id: `audit-log-${auditCounter}`,
      actorUserId: input.actorUserId ?? null,
      actorType: input.actorType,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      description: input.description ?? null,
      previousState: input.previousState ?? null,
      newState: input.newState ?? null,
      changes: input.changes ?? null,
      ipAddress: null,
      userAgent: null,
      metadata: input.metadata ?? null,
      createdAt: new Date(),
    };
    auditStore.push(row);
    return row;
  });
});

/** Every expense-ledger create the settle flow issued, in call order. */
const expenseCreateCalls: { input: CreateExpenseInput; tx: unknown }[] = [];
let createInternalError: Error | null = null;

const createInternalMock = mock(async (input: CreateExpenseInput, tx: unknown) => {
  expenseCreateCalls.push({ input, tx });
  if (createInternalError !== null) {
    throw createInternalError;
  }
  return { id: `expense-for-${input.sourceEntityId ?? "unknown"}` };
});

await mock.module("@/backend/services", () => ({
  ExpenseService: {
    createInternal: createInternalMock,
    softDelete: mock(async () => ({})),
  },
}));

/** Runs the service transaction body against the sentinel executor. */
const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => fn(TX_SENTINEL));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: () => TX_SENTINEL,
}));

await mock.module("@/backend/db/repo", () => ({
  AuditRepository: { queryAuditLogs: queryAuditLogsMock },
  BillingRepository: {},
  CarryoverBalanceRepository: {
    getByIdsForUpdate: getByIdsForUpdateMock,
    update: updateCarryoverMock,
    findLinkedSessions: findLinkedSessionsMock,
  },
  TeacherRepository: { findById: teacherFindByIdMock },
  UserRepository: { findByIds: userFindByIdsMock },
}));

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: {
    updatePayrollCalculation: updatePayrollCalculationMock,
  },
  ClassStatusEventsRepository: {
    createMany: createManyEventsMock,
  },
}));

await mock.module("@/backend/db/repo/shared", () => ({
  acquireAdvisoryLock: acquireAdvisoryLockMock,
}));

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
}));

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: { createManyAuditLogs: createManyAuditLogsMock },
}));

// ---------------------------------------------------------------------------
// Errors stub (only the fields the to-expense flow actually reads).
// ---------------------------------------------------------------------------

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    unknownName: "Unknown",
    carryover: {
      notFound: (id: string) => `Carryover balance not found: ${id}`,
      noCarryovers: "Select at least one carryover balance.",
      alreadyPaid: "One or more carryovers are already paid.",
      notPaid: "Carryover is not paid.",
      paymentDateRequired: "Payment date is required.",
      expenseDateInvalid: "Expense date must be in YYYY-MM format.",
      toExpenseFailed: "Failed to convert carryover to expense.",
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});

/** Expense-ledger create invocations — the service writes one expense row per settled carryover. */
function expenseCreateInvocations(): number {
  return expenseCreateCalls.length;
}

function auditRowsForAction(action: string): AuditLogReturnType[] {
  return auditStore.filter(row => row.action === action);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function readMetadata(row: AuditLogReturnType | undefined): Record<string, unknown> {
  if (!isObjectRecord(row?.metadata)) {
    throw new Error("expected an audit row with object metadata");
  }
  return row.metadata;
}

function resetMocks(): void {
  carryoverRows.clear();
  linkedSessionsByCarryover.clear();
  carryoverUpdates.length = 0;
  sessionPatches.length = 0;
  eventsCreated.length = 0;
  auditStore.length = 0;
  acquiredLockKeys.length = 0;
  permissionChecks.length = 0;
  lockedCarryoverReads.length = 0;
  linkedSessionOptions.length = 0;
  expenseCreateCalls.length = 0;

  auditCounter = 0;
  permissionError = null;
  createInternalError = null;

  getByIdsForUpdateMock.mockClear();
  updateCarryoverMock.mockClear();
  findLinkedSessionsMock.mockClear();
  updatePayrollCalculationMock.mockClear();
  createManyEventsMock.mockClear();
  teacherFindByIdMock.mockClear();
  userFindByIdsMock.mockClear();
  acquireAdvisoryLockMock.mockClear();
  requirePermissionMock.mockClear();
  queryAuditLogsMock.mockClear();
  createManyAuditLogsMock.mockClear();
  createInternalMock.mockClear();
  dbTransactionMock.mockClear();
  loggerInfoSpy.mockClear();
}

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/teachers/carryover-balance.service")> {
  return import("@/backend/services/teachers/carryover-balance.service");
}

function populateHappyPathFixtures(): void {
  carryoverRows.set(CARRYOVER_A_ID, buildCarryoverRow());
  carryoverRows.set(
    CARRYOVER_B_ID,
    buildCarryoverRow({
      id: CARRYOVER_B_ID,
      payable: PAYABLE_B,
      teacherCurrency: CurrencyCode.USD,
      studentsCount: 1,
      studentsText: "Student Three",
    })
  );
  linkedSessionsByCarryover.set(CARRYOVER_A_ID, [
    buildSessionStub(SESSION_A1_ID, CalculationStatus.WAITING_PAID, "120.00"),
    buildSessionStub(SESSION_A2_ID, CalculationStatus.WAITING_PAID, "120.00"),
  ]);
  linkedSessionsByCarryover.set(CARRYOVER_B_ID, [
    buildSessionStub(SESSION_B1_ID, CalculationStatus.PARTIALLY, PAYABLE_B),
  ]);
}

async function convert(input: Partial<BulkToExpenseInput> = {}) {
  const { CarryoverBalanceService } = await importService();
  return CarryoverBalanceService.bulkCarryoverToExpense(
    {
      carryoverIds: [CARRYOVER_A_ID, CARRYOVER_B_ID],
      paymentDate: PAYMENT_DATE,
      actorUserId: ACTOR_ID,
      ...input,
    },
    tErrors
  );
}

async function expectConversionError(input: Partial<BulkToExpenseInput>, code: string): Promise<DomainError> {
  let caught: unknown = null;
  try {
    await convert(input);
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

function expectNoWrites(): void {
  expect(carryoverUpdates).toHaveLength(0);
  expect(sessionPatches).toHaveLength(0);
  expect(eventsCreated).toHaveLength(0);
  expect(auditRowsForAction("CARRYOVER_TO_EXPENSE")).toHaveLength(0);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

function expectCarryoverSettled(carryoverId: string, payable: string, expenseId: string): void {
  const update = carryoverUpdates.find(entry => entry.id === carryoverId);
  if (update == null) {
    throw new Error(`expected a settle update for carryover ${carryoverId}`);
  }
  expect(update.tx).toBe(TX_SENTINEL);
  expect(update.patch.isPaid).toBe(true);
  expect(update.patch.paid).toBe(payable);
  expect(update.patch.paymentDate).toBe(PAYMENT_DATE);
  expect(update.patch.expenseId).toBe(expenseId);
  expect(update.patch.paidByUserId).toBe(ACTOR_ID);
}

function expectSessionPaid(sessionId: string): void {
  const patch = sessionPatches.find(entry => entry.id === sessionId);
  if (patch == null) {
    throw new Error(`expected a PAID transition for session ${sessionId}`);
  }
  expect(patch.tx).toBe(TX_SENTINEL);
  expect(patch.patch.calculationStatus).toBe(CalculationStatus.PAID);
}

function expectTransitionEvents(): void {
  expect(eventsCreated).toHaveLength(3);
  for (const event of eventsCreated) {
    expect(event.eventType).toBe("PAYROLL_STATUS_TRANSITION");
    expect(event.actorUserId).toBe(ACTOR_ID);
    expect(event.toState).toEqual({ calculationStatus: CalculationStatus.PAID });
    expect(event.description).toContain("Settled via expense");
  }
  const firstSession = eventsCreated.find(event => event.classInstanceId === SESSION_A1_ID);
  expect(firstSession?.fromState).toEqual({
    calculationStatus: CalculationStatus.WAITING_PAID,
    teacherPaidAmount: "120.00",
  });
}

describe("CarryoverBalanceService.bulkCarryoverToExpense", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("happy path", () => {
    test("settles two unpaid carryovers into expense records and pays their sessions", async () => {
      populateHappyPathFixtures();

      const result = await convert();

      expect(result.items).toHaveLength(2);
      expect(result.auditLogIds).toHaveLength(2);

      const itemA = result.items.find(item => item.carryoverId === CARRYOVER_A_ID);
      const itemB = result.items.find(item => item.carryoverId === CARRYOVER_B_ID);
      expect(itemA).toMatchObject({ amount: PAYABLE_A, currency: CurrencyCode.SAR });
      expect(itemB).toMatchObject({ amount: PAYABLE_B, currency: CurrencyCode.USD });
      expect(itemA?.expenseId).toBe(`expense-for-${CARRYOVER_A_ID}`);
      expect(itemB?.expenseId).toBe(`expense-for-${CARRYOVER_B_ID}`);

      // One expense row per carryover, created through the real ledger service
      // inside the shared settlement transaction.
      expect(expenseCreateInvocations()).toBe(2);
      const createA = expenseCreateCalls.find(call => call.input.sourceEntityId === CARRYOVER_A_ID);
      const createB = expenseCreateCalls.find(call => call.input.sourceEntityId === CARRYOVER_B_ID);
      expect(createA?.tx).toBe(TX_SENTINEL);
      expect(createB?.tx).toBe(TX_SENTINEL);
      expect(createA?.input).toMatchObject({
        teacherId: TEACHER_ID,
        teacherName: "Carryover Teacher",
        title: "Teacher payout — 2026-08-01 to 2026-08-31",
        type: ExpenseType.SALARIES,
        expenseValue: PAYABLE_A,
        expenseCurrency: CurrencyCode.SAR,
        paymentDate: PAYMENT_DATE,
        expenseDate: "2026-09",
        note: null,
        sourceEntity: "carryover_balances",
        sourceEntityId: CARRYOVER_A_ID,
        createdByUserId: ACTOR_ID,
      });
      expect(createB?.input).toMatchObject({
        teacherId: TEACHER_ID,
        expenseValue: PAYABLE_B,
        expenseCurrency: CurrencyCode.USD,
        sourceEntity: "carryover_balances",
        sourceEntityId: CARRYOVER_B_ID,
        createdByUserId: ACTOR_ID,
      });
      // The ledger replay key is derived per carryover from the shared bulk
      // key, so a same-window retry of one conversion cannot mint a second row.
      expect(createA?.input.clientRequestId).toContain("carryover-to-expense:");
      expect(createA?.input.clientRequestId).toContain(CARRYOVER_A_ID);
      expect(createB?.input.clientRequestId).not.toBe(createA?.input.clientRequestId);

      expectCarryoverSettled(CARRYOVER_A_ID, PAYABLE_A, itemA?.expenseId ?? "");
      expectCarryoverSettled(CARRYOVER_B_ID, PAYABLE_B, itemB?.expenseId ?? "");
      expectSessionPaid(SESSION_A1_ID);
      expectSessionPaid(SESSION_A2_ID);
      expectSessionPaid(SESSION_B1_ID);
      expectTransitionEvents();

      // One conversion audit row per carryover, keyed for idempotent replay.
      const auditRows = auditRowsForAction("CARRYOVER_TO_EXPENSE");
      expect(auditRows).toHaveLength(2);
      expect(result.auditLogIds).toEqual(auditRows.map(row => row.id));
      for (const row of auditRows) {
        const metadata = readMetadata(row);
        expect(typeof metadata.idempotencyKey).toBe("string");
        expect(metadata.paymentDate).toBe(PAYMENT_DATE);
        expect(row.actorUserId).toBe(ACTOR_ID);
        expect(row.entityType).toBe("CARRYOVER_BALANCE");
      }

      // Permission gate and advisory lock wrap the whole conversion.
      expect(permissionChecks).toEqual([
        { actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_CARRYOVER_MANAGE },
      ]);
      expect(acquiredLockKeys).toHaveLength(1);
      expect(acquiredLockKeys[0]?.lockKey.startsWith("carryover-to-expense:")).toBe(true);
      expect(lockedCarryoverReads[0]?.tx).toBe(TX_SENTINEL);
      // Sessions are locked FOR UPDATE before their PAID transitions are written.
      expect(linkedSessionOptions).toEqual([{ forUpdate: true }, { forUpdate: true }]);

      expect(loggerInfoSpy).toHaveBeenCalledWith(
        "Carryovers converted to expenses",
        expect.objectContaining({
          actorUserId: ACTOR_ID,
          carryoverCount: 2,
          totalAmount: "330.50",
        })
      );
    });
  });
});

describe("CarryoverBalanceService.bulkCarryoverToExpense — guards", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("already-paid rejection", () => {
    test("rejects the whole batch when any selected carryover is already paid", async () => {
      populateHappyPathFixtures();
      carryoverRows.set(CARRYOVER_B_ID, buildCarryoverRow({ id: CARRYOVER_B_ID, isPaid: true }));

      const error = await expectConversionError({}, "CARRYOVER_ALREADY_PAID");
      expect(error.message).toContain("already paid");

      // The reject happens before the first expense record is requested.
      expect(expenseCreateInvocations()).toBe(0);
      expectNoWrites();
    });
  });

  describe("payment date validation", () => {
    test("rejects a missing paymentDate before any transaction work", async () => {
      const error = await expectConversionError({ paymentDate: "" }, "PAYMENT_DATE_REQUIRED");
      expect(error.message).toContain("Payment date");

      expect(permissionChecks).toHaveLength(1);
      expect(acquiredLockKeys).toHaveLength(0);
      expect(expenseCreateInvocations()).toBe(0);
      expectNoWrites();
    });
  });

  describe("expense date validation", () => {
    test("rejects an expenseDate that is not in YYYY-MM format", async () => {
      const first = await expectConversionError({ expenseDate: "2026/09" }, "EXPENSE_DATE_INVALID");
      expect(first.message).toContain("YYYY-MM");
      await expectConversionError({ expenseDate: "09-2026" }, "EXPENSE_DATE_INVALID");

      expect(acquiredLockKeys).toHaveLength(0);
      expect(expenseCreateInvocations()).toBe(0);
      expectNoWrites();
    });

    test("honors an explicitly provided valid expenseDate", async () => {
      populateHappyPathFixtures();

      await convert({ expenseDate: "2026-10" });

      const auditRows = auditRowsForAction("CARRYOVER_TO_EXPENSE");
      expect(auditRows).toHaveLength(2);
      for (const row of auditRows) {
        expect(readMetadata(row).expenseDate).toBe("2026-10");
      }
    });
  });

  describe("default expense date", () => {
    test("derives the expense month from the payment date when expenseDate is omitted", async () => {
      populateHappyPathFixtures();

      await convert();

      const auditRows = auditRowsForAction("CARRYOVER_TO_EXPENSE");
      expect(auditRows).toHaveLength(2);
      for (const row of auditRows) {
        expect(readMetadata(row).expenseDate).toBe("2026-09");
      }
    });
  });
});

describe("CarryoverBalanceService.bulkCarryoverToExpense — idempotency and rollback", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("idempotent re-submit", () => {
    test("replays the first result for an identical re-submit without doubling writes", async () => {
      populateHappyPathFixtures();

      const first = await convert();
      const second = await convert();

      // The replay reconstructs the originally persisted result from the audit rows.
      expect(second).toEqual(first);
      expect(second.items.map(item => item.expenseId)).toEqual(first.items.map(item => item.expenseId));

      // No second conversion: rows were never re-locked, updated, or re-expensed.
      expect(lockedCarryoverReads).toHaveLength(1);
      expect(carryoverUpdates).toHaveLength(2);
      expect(sessionPatches).toHaveLength(3);
      expect(expenseCreateInvocations()).toBe(2);
      expect(auditRowsForAction("CARRYOVER_TO_EXPENSE")).toHaveLength(2);

      // The replay path still holds the batch advisory lock.
      expect(acquiredLockKeys).toHaveLength(2);
      expect(acquiredLockKeys[0]?.lockKey).toBe(acquiredLockKeys[1]?.lockKey);
    });
  });

  describe("expense ledger failure", () => {
    test("rolls back the entire batch when the ledger write rejects", async () => {
      populateHappyPathFixtures();
      createInternalError = new Error("expense ledger write failed");

      const error = await expectConversionError({}, "CARRYOVER_TO_EXPENSE_FAILED");
      expect(error.message).toContain("Failed to convert");
      expect(error.cause).toBe(createInternalError);

      // The ledger call threw before any settlement write, so the in-tx state is
      // empty — matching the real database's rollback of the aborted batch.
      expectNoWrites();

      // Neither fixture row moved into the paid state.
      expect(carryoverRows.get(CARRYOVER_A_ID)?.isPaid).toBe(false);
      expect(carryoverRows.get(CARRYOVER_B_ID)?.isPaid).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// TB.5 gap-fill: unknown rows, empty/duplicate selections, permission denial,
// corrupt replay rows, and mid-settle write failure
// ---------------------------------------------------------------------------

describe("CarryoverBalanceService.bulkCarryoverToExpense — residual branches", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("unknown carryover guard", () => {
    test("rejects a selection containing a carryover id that cannot be locked", async () => {
      populateHappyPathFixtures();

      const unknownId = "[CARD_REDACTED]-[CARD_REDACTED]-4baa-b99999999999";
      const error = await expectConversionError({ carryoverIds: [CARRYOVER_A_ID, unknownId] }, "CARRYOVER_NOT_FOUND");

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain("Carryover balance not found");
      expect(error.message).toContain(unknownId);
      expect(expenseCreateInvocations()).toBe(0);
      expectNoWrites();
    });
  });

  describe("empty selection", () => {
    test("rejects an empty carryover list before opening the transaction", async () => {
      const error = await expectConversionError({ carryoverIds: [] }, "VALIDATION");
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toContain("at least one carryover");

      expect(permissionChecks).toHaveLength(1);
      expect(acquiredLockKeys).toHaveLength(0);
      expectNoWrites();
    });
  });

  describe("duplicate id selection", () => {
    test("settles each carryover exactly once for a repeated id", async () => {
      populateHappyPathFixtures();

      const result = await convert({ carryoverIds: [CARRYOVER_A_ID, CARRYOVER_A_ID] });

      expect(result.items).toHaveLength(1);
      expect(lockedCarryoverReads[0]?.ids).toEqual([CARRYOVER_A_ID]);
      expect(carryoverUpdates).toHaveLength(1);
      expect(expenseCreateInvocations()).toBe(1);
    });
  });

  describe("permission gate", () => {
    test("propagates the insufficient-permissions error without opening a transaction", async () => {
      permissionError = new ForbiddenError("Insufficient permissions.");

      const error = await expectConversionError({}, "FORBIDDEN");
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toContain("Insufficient permissions");

      expect(dbTransactionMock).not.toHaveBeenCalled();
      expect(acquiredLockKeys).toHaveLength(0);
      expect(expenseCreateInvocations()).toBe(0);
      expectNoWrites();
    });
  });

  describe("replay with corrupt audit metadata", () => {
    test("ignores audit rows whose metadata cannot be reconstructed and re-runs the conversion", async () => {
      populateHappyPathFixtures();
      const expectedKey = deriveBulkToExpenseIdempotencyKey({
        carryoverIds: [CARRYOVER_A_ID, CARRYOVER_B_ID],
        paymentDate: PAYMENT_DATE,
        actorUserId: ACTOR_ID,
      });
      // Key matches but the expense payload fields are absent/mistyped — the
      // replay must refuse to fabricate items and fall through to a real settle.
      auditStore.push({
        id: "seeded-audit-1",
        actorUserId: ACTOR_ID,
        actorType: "USER",
        entityType: "CARRYOVER_BALANCE",
        entityId: CARRYOVER_A_ID,
        action: "CARRYOVER_TO_EXPENSE",
        description: null,
        previousState: null,
        newState: null,
        changes: null,
        ipAddress: null,
        userAgent: null,
        metadata: { idempotencyKey: expectedKey, expenseId: 42 },
        createdAt: new Date(),
      });

      const result = await convert();

      expect(result.items).toHaveLength(2);
      expect(carryoverUpdates).toHaveLength(2);
      expect(expenseCreateInvocations()).toBe(2);
    });
  });

  describe("settle write failure", () => {
    test("rejects with CARRYOVER_TO_EXPENSE_FAILED when the paid-state update misses its row", async () => {
      populateHappyPathFixtures();
      updateCarryoverMock.mockResolvedValueOnce(null);

      const error = await expectConversionError({ carryoverIds: [CARRYOVER_A_ID] }, "CARRYOVER_TO_EXPENSE_FAILED");
      expect(error.message).toContain("Failed to convert");
    });
  });
});
