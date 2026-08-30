import { beforeEach, describe, expect, mock, test } from "bun:test";
import { AppPermission, CreditAdjustmentType, CreditReason } from "@/backend/enum";
import { DomainError, ForbiddenError, NotFoundError, ValidationError } from "@/backend/lib";
import type { CarryoverHandoffPayload } from "@/backend/services/billing/carryover-handoff";
import { deriveAdjustmentIdempotencyKey } from "@/backend/services/billing/credit-adjustment.idempotency";
import type {
  CreateAuditLogInput,
  CreditAdjustmentInput,
  CreditAdjustmentInsertInput,
  CreditBalanceReturnType,
  CreditTransactionSelectType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

const ACTOR_ID = "11111111-1111-1111-1111-111111111111";
const SECOND_ACTOR_ID = "77777777-7777-4777-8777-777777777777";
const STUDENT_ID = "44444444-4444-4444-4444-444444444444";
const TEACHER_ID = "77777777-7777-7777-7777-777777777777";
const LEDGER_ROW_ID = "88888888-8888-8888-8888-888888888888";
const UNKNOWN_TEACHER_ID = "66666666-6666-6666-6666-666666666666";

const CARRYOVER_FROM_DATE = "2026-08-01";
const CARRYOVER_TO_DATE = "2026-08-14";
const CARRYOVER_PAYMENT_DATE = "2026-08-15";

function buildLedgerRow(overrides: Partial<CreditTransactionSelectType> = {}): CreditTransactionSelectType {
  return {
    id: LEDGER_ROW_ID,
    studentId: STUDENT_ID,
    changeAmount: 3,
    changeAmountHours: null,
    reason: CreditReason.CREDIT_ADJUSTMENT_ADD,
    sourcePaymentId: null,
    classInstanceId: null,
    notes: null,
    creditedByUserId: ACTOR_ID,
    idempotencyKey: "test-idempotency-key",
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
    adjustmentType: CreditAdjustmentType.ADD,
    carryoverTeacherId: null,
    carryoverFromDate: null,
    carryoverToDate: null,
    carryoverPaymentDate: null,
    ...overrides,
  };
}

function buildAddInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
  return {
    studentId: STUDENT_ID,
    adjustmentType: CreditAdjustmentType.ADD,
    hours: 3,
    notes: "manual top-up",
    ...overrides,
  };
}

function buildSubtractInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
  return {
    studentId: STUDENT_ID,
    adjustmentType: CreditAdjustmentType.SUBTRACT,
    hours: 4,
    notes: "manual deduction",
    ...overrides,
  };
}

function buildCarryoverInput(overrides: Partial<CreditAdjustmentInput> = {}): CreditAdjustmentInput {
  return {
    studentId: STUDENT_ID,
    adjustmentType: CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER,
    hours: 2,
    notes: "carryover settlement",
    carryoverTeacherId: TEACHER_ID,
    carryoverFromDate: CARRYOVER_FROM_DATE,
    carryoverToDate: CARRYOVER_TO_DATE,
    carryoverPaymentDate: CARRYOVER_PAYMENT_DATE,
    ...overrides,
  };
}

function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Simulates the Postgres unique-violation driver surface (SQLSTATE 23505). */
class UniqueViolationError extends Error {
  readonly code = "23505";
}

// --- Capture buffers -------------------------------------------------------

const adjustmentInserts: CreditAdjustmentInsertInput[] = [];
const createdRows: CreditTransactionSelectType[] = [];
const idempotencyLookups: { keys: string[]; insideTransaction: boolean }[] = [];
const addClassesCalls: { studentId: string; hours: number }[] = [];
const deductClassesCalls: { studentId: string; hours: number }[] = [];
const carryoverHandoffCalls: CarryoverHandoffPayload[] = [];
const refreshQuotaCalls: string[] = [];
const acquiredLockKeys: string[] = [];

function defaultInsert(_tx: unknown, input: CreditAdjustmentInsertInput): CreditTransactionSelectType {
  adjustmentInserts.push(input);
  const row = buildLedgerRow({
    changeAmount: input.changeAmount,
    reason: input.reason,
    adjustmentType: input.adjustmentType,
    notes: input.notes ?? null,
    creditedByUserId: input.creditedByUserId,
    idempotencyKey: input.idempotencyKey,
    carryoverTeacherId: input.carryoverTeacherId ?? null,
    carryoverFromDate: input.carryoverFromDate ?? null,
    carryoverToDate: input.carryoverToDate ?? null,
    carryoverPaymentDate: input.carryoverPaymentDate ?? null,
  });
  createdRows.push(row);
  return row;
}

// --- Repo / service mocks --------------------------------------------------

const createAdjustmentMock = mock(async (tx: unknown, input: CreditAdjustmentInsertInput) =>
  Promise.resolve(defaultInsert(tx, input))
);

const findByIdempotencyKeysMock = mock(async (keys: string[], tx?: unknown): Promise<CreditTransactionSelectType[]> => {
  idempotencyLookups.push({ keys: [...keys], insideTransaction: tx !== undefined });
  return [];
});

const getBalanceMock = mock(
  async (_tx: unknown, studentId: string): Promise<CreditBalanceReturnType> => ({
    studentId,
    classesTotal: 10,
    classesRemaining: 10,
  })
);

await mock.module("@/backend/db/repo/billing", () => ({
  CreditRepository: {
    createAdjustment: createAdjustmentMock,
    findByIdempotencyKeys: findByIdempotencyKeysMock,
    getBalance: getBalanceMock,
  },
}));

const studentFindByIdMock = mock(async (): Promise<{ id: string } | null> => ({ id: STUDENT_ID }));

const addClassesMock = mock(async (studentId: string, _tErrors: unknown, hours: number) => {
  addClassesCalls.push({ studentId, hours });
});

const deductClassesMock = mock(async (studentId: string, _tErrors: unknown, hours: number) => {
  deductClassesCalls.push({ studentId, hours });
});

await mock.module("@/backend/db/repo/students", () => ({
  StudentRepository: {
    findById: studentFindByIdMock,
    findActiveById: studentFindByIdMock,
    addClasses: addClassesMock,
    deductClasses: deductClassesMock,
  },
}));

const teacherFindByIdMock = mock(async (): Promise<{ id: string } | null> => ({ id: TEACHER_ID }));

await mock.module("@/backend/db/repo/teachers", () => ({
  TeacherRepository: {
    findById: teacherFindByIdMock,
    findActiveById: teacherFindByIdMock,
  },
}));

const acquireAdvisoryLockMock = mock(async (_tx: unknown, lockKey: string) => {
  acquiredLockKeys.push(lockKey);
});

await mock.module("@/backend/db/repo/shared", () => ({
  acquireAdvisoryLock: acquireAdvisoryLockMock,
}));

const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => fn({}));

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: () => ({}),
}));

const requirePermissionMock = mock(async () => undefined);

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
  assertAssociatedOrManage: async () => undefined,
}));

const refreshQuotaMock = mock(async (studentId: string) => {
  refreshQuotaCalls.push(studentId);
});

await mock.module("@/backend/services/billing/quota.service", () => ({
  QuotaService: { refreshStudentOndemandInstances: refreshQuotaMock },
}));

const carryoverHandoffMock = mock(async (_tx: unknown, payload: CarryoverHandoffPayload) => {
  carryoverHandoffCalls.push(payload);
});

await mock.module("@/backend/services/billing/carryover-handoff", () => ({
  maybeInsertCarryoverBalanceEntry: carryoverHandoffMock,
}));

// Post-commit audit writes are best-effort side effects; capture them so tests
// can assert the emitted shape and prove a failed audit never fails the adjustment.
const auditLogEntries: CreateAuditLogInput[] = [];
let auditFailure: Error | null = null;

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: {
    createManyAuditLogs: async (entries: CreateAuditLogInput[]) => {
      auditLogEntries.push(...entries);
      if (auditFailure) throw auditFailure;
      return entries;
    },
  },
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
    credit: {
      invalidInput: "invalid credit adjustment input",
      insufficientBalance: ({ studentId, remaining }: { studentId: string; remaining: number }) =>
        `insufficient balance for ${studentId}: ${remaining} remaining`,
    },
    studentNotFound: (id: string) => `student ${id} not found`,
    teacher: {
      teacherNotFound: (id: string) => `teacher ${id} not found`,
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrorsStub = buildErrorsStub();

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/billing/credit.service")> {
  return import("@/backend/services/billing/credit.service");
}

async function recordAdjustment(input: CreditAdjustmentInput, actorUserId: string = ACTOR_ID) {
  const { CreditService } = await importService();
  return CreditService.recordAdjustment(actorUserId, input, tErrorsStub);
}

async function expectRecordError(input: CreditAdjustmentInput, code: string): Promise<DomainError> {
  let caught: unknown = null;
  try {
    await recordAdjustment(input);
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

function expectZeroWrites(): void {
  expect(createAdjustmentMock).not.toHaveBeenCalled();
  expect(addClassesMock).not.toHaveBeenCalled();
  expect(deductClassesMock).not.toHaveBeenCalled();
  expect(carryoverHandoffMock).not.toHaveBeenCalled();
  expect(refreshQuotaMock).not.toHaveBeenCalled();
  expect(auditLogEntries).toHaveLength(0);
}

function resetMocks(): void {
  adjustmentInserts.length = 0;
  createdRows.length = 0;
  idempotencyLookups.length = 0;
  addClassesCalls.length = 0;
  deductClassesCalls.length = 0;
  carryoverHandoffCalls.length = 0;
  refreshQuotaCalls.length = 0;
  acquiredLockKeys.length = 0;
  auditLogEntries.length = 0;
  auditFailure = null;

  createAdjustmentMock.mockReset();
  createAdjustmentMock.mockImplementation(async (tx, input) => Promise.resolve(defaultInsert(tx, input)));

  findByIdempotencyKeysMock.mockReset();
  findByIdempotencyKeysMock.mockImplementation(async (keys: string[], tx?: unknown) => {
    idempotencyLookups.push({ keys: [...keys], insideTransaction: tx !== undefined });
    return [];
  });

  getBalanceMock.mockReset();
  getBalanceMock.mockResolvedValue({ studentId: STUDENT_ID, classesTotal: 10, classesRemaining: 10 });

  studentFindByIdMock.mockReset();
  studentFindByIdMock.mockResolvedValue({ id: STUDENT_ID });

  teacherFindByIdMock.mockReset();
  teacherFindByIdMock.mockResolvedValue({ id: TEACHER_ID });

  requirePermissionMock.mockReset();
  requirePermissionMock.mockResolvedValue(undefined);

  addClassesMock.mockClear();
  deductClassesMock.mockClear();
  refreshQuotaMock.mockClear();
  carryoverHandoffMock.mockClear();
  acquireAdvisoryLockMock.mockClear();
  dbTransactionMock.mockClear();
}

describe("CreditService.recordAdjustment", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("adjustment flows", () => {
    test("ADD increases the balance and persists a positive ledger row", async () => {
      const input = buildAddInput();
      const result = await recordAdjustment(input);

      expect(result.changeAmount).toBe(3);
      expect(result.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_ADD);
      expect(result.adjustmentType).toBe(CreditAdjustmentType.ADD);

      expect(addClassesCalls).toEqual([{ studentId: STUDENT_ID, hours: 3 }]);
      expect(deductClassesCalls).toHaveLength(0);
      expect(carryoverHandoffCalls).toHaveLength(0);

      expect(adjustmentInserts).toHaveLength(1);
      const insert = adjustmentInserts[0];
      expect(insert?.changeAmount).toBe(3);
      expect(insert?.adjustmentType).toBe(CreditAdjustmentType.ADD);
      expect(insert?.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_ADD);
      expect(insert?.idempotencyKey).toBe(deriveAdjustmentIdempotencyKey(ACTOR_ID, input));

      expect(refreshQuotaCalls).toEqual([STUDENT_ID]);
      expect(acquiredLockKeys).toEqual([`student_${STUDENT_ID}`]);
      expect(requirePermissionMock).toHaveBeenCalledWith(
        ACTOR_ID,
        AppPermission.ACCOUNTING_CREDITS_MANAGE,
        tErrorsStub
      );
    });

    test("SUBTRACT decreases the balance and persists a negative ledger row", async () => {
      const result = await recordAdjustment(buildSubtractInput());

      expect(result.changeAmount).toBe(-4);
      expect(result.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_SUBTRACT);

      expect(deductClassesCalls).toEqual([{ studentId: STUDENT_ID, hours: 4 }]);
      expect(addClassesCalls).toHaveLength(0);

      expect(adjustmentInserts).toHaveLength(1);
      expect(adjustmentInserts[0]?.changeAmount).toBe(-4);
      expect(adjustmentInserts[0]?.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_SUBTRACT);
    });

    test("SUBTRACT_WITH_CARRYOVER stamps the carryover columns and hands off exactly once", async () => {
      const input = buildCarryoverInput();
      const result = await recordAdjustment(input);

      expect(result.changeAmount).toBe(-2);
      expect(result.reason).toBe(CreditReason.CREDIT_ADJUSTMENT_CARRYOVER);
      expect(result.adjustmentType).toBe(CreditAdjustmentType.SUBTRACT_WITH_CARRYOVER);
      expect(result.carryoverTeacherId).toBe(TEACHER_ID);
      expect(result.carryoverFromDate).toBe(CARRYOVER_FROM_DATE);
      expect(result.carryoverToDate).toBe(CARRYOVER_TO_DATE);
      expect(result.carryoverPaymentDate).toBe(CARRYOVER_PAYMENT_DATE);

      expect(teacherFindByIdMock).toHaveBeenCalledTimes(1);
      expect(deductClassesCalls).toEqual([{ studentId: STUDENT_ID, hours: 2 }]);

      const insert = adjustmentInserts[0];
      expect(insert?.carryoverTeacherId).toBe(TEACHER_ID);
      expect(insert?.carryoverFromDate).toBe(CARRYOVER_FROM_DATE);
      expect(insert?.carryoverToDate).toBe(CARRYOVER_TO_DATE);
      expect(insert?.carryoverPaymentDate).toBe(CARRYOVER_PAYMENT_DATE);

      expect(carryoverHandoffCalls).toHaveLength(1);
      expect(carryoverHandoffCalls[0]).toEqual({
        creditTransactionId: result.id,
        teacherId: TEACHER_ID,
        studentId: STUDENT_ID,
        fromDate: CARRYOVER_FROM_DATE,
        toDate: CARRYOVER_TO_DATE,
        paymentDate: CARRYOVER_PAYMENT_DATE,
        hours: 2,
        approvedByUserId: ACTOR_ID,
      });
    });
  });

  describe("guard failures write nothing", () => {
    test("rejects a SUBTRACT beyond the remaining balance with INSUFFICIENT_CLASSES", async () => {
      getBalanceMock.mockResolvedValue({ studentId: STUDENT_ID, classesTotal: 1, classesRemaining: 1 });

      const error = await expectRecordError(buildSubtractInput(), "INSUFFICIENT_CLASSES");
      expect(error.message).toContain("insufficient balance");
      expectZeroWrites();
    });

    test("rejects a carryover subtraction beyond the balance — no row, no handoff", async () => {
      getBalanceMock.mockResolvedValue({ studentId: STUDENT_ID, classesTotal: 1, classesRemaining: 1 });

      const error = await expectRecordError(buildCarryoverInput(), "INSUFFICIENT_CLASSES");
      expect(error.message).toContain("insufficient balance");
      expect(teacherFindByIdMock).toHaveBeenCalledTimes(1);
      expectZeroWrites();
    });

    test("returns TEACHER_NOT_FOUND when the carryover teacher does not exist", async () => {
      teacherFindByIdMock.mockResolvedValue(null);

      const error = await expectRecordError(
        buildCarryoverInput({ carryoverTeacherId: UNKNOWN_TEACHER_ID }),
        "TEACHER_NOT_FOUND"
      );
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain("not found");
      expectZeroWrites();
    });

    test("returns STUDENT_NOT_FOUND when the adjustment target student does not exist", async () => {
      studentFindByIdMock.mockResolvedValue(null);

      const error = await expectRecordError(buildAddInput(), "STUDENT_NOT_FOUND");
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toContain("not found");
      expectZeroWrites();
      // The in-transaction idempotency pre-check runs before the student guard.
      expect(idempotencyLookups).toHaveLength(1);
    });

    test("rejects a carryover whose fromDate is after its toDate", async () => {
      const error = await expectRecordError(
        buildCarryoverInput({ carryoverFromDate: "2026-08-20", carryoverToDate: "2026-08-10" }),
        "VALIDATION"
      );
      expect(error).toBeInstanceOf(ValidationError);
      expectZeroWrites();
    });

    test("rejects a carryover whose paymentDate is more than one day in the future", async () => {
      const error = await expectRecordError(
        buildCarryoverInput({ carryoverPaymentDate: isoDaysFromNow(7) }),
        "VALIDATION"
      );
      expect(error).toBeInstanceOf(ValidationError);
      expectZeroWrites();
    });

    test("rejects an actor without ACCOUNTING_CREDITS_MANAGE before any validation or write", async () => {
      requirePermissionMock.mockRejectedValue(new ForbiddenError("insufficient permissions"));

      const error = await expectRecordError(buildAddInput({ hours: 0 }), "FORBIDDEN");
      expect(error).toBeInstanceOf(ForbiddenError);
      expectZeroWrites();
      expect(idempotencyLookups).toHaveLength(0);
    });
  });

  describe("idempotency", () => {
    test("a re-submitted adjustment returns the first row without a second insert or balance change", async () => {
      const input = buildAddInput({ notes: "first submission" });

      const first = await recordAdjustment(input);
      expect(createAdjustmentMock).toHaveBeenCalledTimes(1);

      const firstRow = createdRows[0];
      if (!firstRow) throw new Error("expected the first insert to produce a ledger row");
      findByIdempotencyKeysMock.mockResolvedValue([firstRow]);

      const second = await recordAdjustment({ ...input, notes: "retried with another reason text" });

      expect(second.id).toBe(first.id);
      expect(second.notes).toBe("first submission");
      expect(second.idempotencyKey).toBe(deriveAdjustmentIdempotencyKey(ACTOR_ID, input));
      expect(createAdjustmentMock).toHaveBeenCalledTimes(1);
      expect(addClassesMock).toHaveBeenCalledTimes(1);
      // Only the original insert observability-records; the replay stays silent.
      expect(auditLogEntries).toHaveLength(1);
    });

    test("a replay after the balance was drained returns the first row instead of failing the balance guard", async () => {
      const input = buildSubtractInput();
      getBalanceMock.mockResolvedValue({ studentId: STUDENT_ID, classesTotal: 4, classesRemaining: 4 });

      const first = await recordAdjustment(input);
      expect(deductClassesCalls).toHaveLength(1);

      // The balance is now drained; a guard-first implementation would throw
      // INSUFFICIENT_CLASSES here instead of returning the original row.
      getBalanceMock.mockResolvedValue({ studentId: STUDENT_ID, classesTotal: 4, classesRemaining: 0 });
      const firstRow = createdRows[0];
      if (!firstRow) throw new Error("expected the first insert to produce a ledger row");
      findByIdempotencyKeysMock.mockResolvedValue([firstRow]);

      const second = await recordAdjustment(input);

      expect(second.id).toBe(first.id);
      expect(createAdjustmentMock).toHaveBeenCalledTimes(1);
      expect(deductClassesCalls).toHaveLength(1);
      expect(auditLogEntries).toHaveLength(1);
    });

    test("two operators submitting the same payload each persist their own ledger row", async () => {
      const input = buildSubtractInput();
      createAdjustmentMock.mockImplementation(async (tx, insertInput) => {
        const row = defaultInsert(tx, insertInput);
        return Promise.resolve({ ...row, id: `ledger-row-${adjustmentInserts.length}` });
      });

      const first = await recordAdjustment(input);
      const second = await recordAdjustment(input, SECOND_ACTOR_ID);

      expect(second.id).not.toBe(first.id);
      expect(adjustmentInserts).toHaveLength(2);
      expect(adjustmentInserts[0]?.idempotencyKey).toBe(deriveAdjustmentIdempotencyKey(ACTOR_ID, input));
      expect(adjustmentInserts[1]?.idempotencyKey).toBe(deriveAdjustmentIdempotencyKey(SECOND_ACTOR_ID, input));
      expect(adjustmentInserts[0]?.creditedByUserId).toBe(ACTOR_ID);
      expect(adjustmentInserts[1]?.creditedByUserId).toBe(SECOND_ACTOR_ID);
      expect(deductClassesCalls).toHaveLength(2);
      expect(auditLogEntries).toHaveLength(2);
    });

    test("a unique-violation race resolves to the winner row", async () => {
      const input = buildAddInput();
      createAdjustmentMock.mockRejectedValueOnce(new UniqueViolationError("duplicate key value"));
      findByIdempotencyKeysMock.mockImplementation(async (keys: string[], tx?: unknown) => {
        idempotencyLookups.push({ keys: [...keys], insideTransaction: tx !== undefined });
        return tx === undefined ? [buildLedgerRow({ idempotencyKey: keys[0] ?? "" })] : [];
      });

      const result = await recordAdjustment(input);

      expect(result.id).toBe(LEDGER_ROW_ID);
      expect(createAdjustmentMock).toHaveBeenCalledTimes(1);
      expect(addClassesMock).not.toHaveBeenCalled();
      const recoveryLookups = idempotencyLookups.filter(l => !l.insideTransaction);
      expect(recoveryLookups).toHaveLength(1);
    });

    test("two concurrent identical submissions collapse onto a single ledger row", async () => {
      const input = buildAddInput();
      createAdjustmentMock.mockImplementation(async (tx, insertInput) => {
        if (adjustmentInserts.length > 0) throw new UniqueViolationError("duplicate key value");
        return Promise.resolve(defaultInsert(tx, insertInput));
      });
      findByIdempotencyKeysMock.mockImplementation(async (keys: string[], tx?: unknown) => {
        idempotencyLookups.push({ keys: [...keys], insideTransaction: tx !== undefined });
        return tx === undefined ? createdRows : [];
      });

      const [a, b] = await Promise.all([recordAdjustment(input), recordAdjustment(input)]);

      expect(a.id).toBe(b.id);
      expect(createAdjustmentMock).toHaveBeenCalledTimes(2);
      expect(adjustmentInserts).toHaveLength(1);
      expect(addClassesMock).toHaveBeenCalledTimes(1);
      expect(auditLogEntries).toHaveLength(1);
    });

    test("rethrows a unique violation when no winning row exists to recover", async () => {
      createAdjustmentMock.mockRejectedValueOnce(new UniqueViolationError("duplicate key value"));

      let caught: unknown = null;
      try {
        await recordAdjustment(buildAddInput());
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(UniqueViolationError);
      const recoveryLookups = idempotencyLookups.filter(l => !l.insideTransaction);
      expect(recoveryLookups).toHaveLength(1);
    });

    test("propagates non-unique transaction errors without attempting recovery", async () => {
      createAdjustmentMock.mockRejectedValueOnce(new Error("connection reset by peer"));

      let caught: unknown = null;
      try {
        await recordAdjustment(buildAddInput());
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(Error);
      if (!(caught instanceof Error)) throw new Error("expected an Error from the transaction");
      expect(caught.message).toBe("connection reset by peer");
      const recoveryLookups = idempotencyLookups.filter(l => !l.insideTransaction);
      expect(recoveryLookups).toHaveLength(0);
    });

    test("maps an unrecognized persisted reason to the ADJUSTMENT fallback on idempotent return", async () => {
      const input = buildAddInput();
      await recordAdjustment(input);
      const firstRow = createdRows[0];
      if (!firstRow) throw new Error("expected the first insert to produce a ledger row");

      const legacyRow = { ...firstRow };
      Object.assign(legacyRow, { reason: "LEGACY_UNKNOWN_REASON" });
      findByIdempotencyKeysMock.mockResolvedValue([legacyRow]);

      const result = await recordAdjustment(input);

      expect(result.id).toBe(firstRow.id);
      expect(result.reason).toBe(CreditReason.ADJUSTMENT);
      expect(createAdjustmentMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("observability", () => {
    test("emits one audit entry after commit with the adjustment summary", async () => {
      const result = await recordAdjustment(buildAddInput());

      expect(auditLogEntries).toHaveLength(1);
      const entry = auditLogEntries[0];
      expect(entry?.actorUserId).toBe(ACTOR_ID);
      expect(entry?.actorType).toBe("USER");
      expect(entry?.entityType).toBe("STUDENT");
      expect(entry?.entityId).toBe(STUDENT_ID);
      expect(entry?.action).toBe("UPDATE");
      expect(entry?.description).toBe(`Credit adjustment ${CreditAdjustmentType.ADD}`);
      expect(entry?.newState).toEqual({
        creditTransactionId: result.id,
        adjustmentType: CreditAdjustmentType.ADD,
        changeAmount: 3,
        carryoverTeacherId: null,
      });
    });

    test("still returns the committed adjustment when the audit write fails", async () => {
      auditFailure = new Error("audit store unavailable");

      const result = await recordAdjustment(buildAddInput());

      expect(result.id).toBe(LEDGER_ROW_ID);
      expect(result.changeAmount).toBe(3);
      expect(auditLogEntries).toHaveLength(1);
      expect(addClassesCalls).toEqual([{ studentId: STUDENT_ID, hours: 3 }]);
    });
  });

  describe("input validation", () => {
    const invalidInputs: [string, CreditAdjustmentInput][] = [
      ["a blank studentId", buildAddInput({ studentId: "   " })],
      ["zero hours", buildAddInput({ hours: 0 })],
      ["non-finite hours", buildAddInput({ hours: Number.NaN })],
      ["sub-unit hours", buildAddInput({ hours: 0.5 })],
      ["hours above the accepted bound", buildAddInput({ hours: 100_001 })],
      ["a missing carryover teacher", buildCarryoverInput({ carryoverTeacherId: null })],
      ["a whitespace-only carryover teacher", buildCarryoverInput({ carryoverTeacherId: "   " })],
      ["a missing carryover from-date", buildCarryoverInput({ carryoverFromDate: null })],
      ["a missing carryover to-date", buildCarryoverInput({ carryoverToDate: null })],
      ["a missing carryover payment date", buildCarryoverInput({ carryoverPaymentDate: null })],
    ];

    for (const [label, input] of invalidInputs) {
      test(`rejects ${label} with a validation error and writes nothing`, async () => {
        const error = await expectRecordError(input, "VALIDATION");
        expect(error).toBeInstanceOf(ValidationError);
        expectZeroWrites();
      });
    }

    test("rejects an unknown adjustment type at the dispatcher default branch", async () => {
      const input = buildAddInput();
      Object.assign(input, { adjustmentType: "NOT_A_REAL_TYPE" });

      const error = await expectRecordError(input, "VALIDATION");
      expect(error).toBeInstanceOf(ValidationError);
      expectZeroWrites();
    });
  });

  describe("boundaries", () => {
    test("accepts hours = 1 (lower boundary) for both signs", async () => {
      const added = await recordAdjustment(buildAddInput({ hours: 1 }));
      expect(added.changeAmount).toBe(1);

      resetMocks();
      const subtracted = await recordAdjustment(buildSubtractInput({ hours: 1 }));
      expect(subtracted.changeAmount).toBe(-1);
      expect(deductClassesCalls).toEqual([{ studentId: STUDENT_ID, hours: 1 }]);
    });

    test("subtracting exactly the full remaining balance succeeds (check is strictly-greater)", async () => {
      getBalanceMock.mockResolvedValue({ studentId: STUDENT_ID, classesTotal: 4, classesRemaining: 4 });

      const result = await recordAdjustment(buildSubtractInput({ hours: 4 }));

      expect(result.changeAmount).toBe(-4);
      expect(deductClassesCalls).toEqual([{ studentId: STUDENT_ID, hours: 4 }]);
    });

    test("persists unicode and RTL notes byte-identical", async () => {
      const notes = "تعديل رصيد <b>مهم</b> ✅";
      await recordAdjustment(buildAddInput({ notes }));

      expect(adjustmentInserts[0]?.notes).toBe(notes);
    });

    test("persists blank or fully-stripped notes as NULL", async () => {
      await recordAdjustment(buildAddInput({ notes: "   " }));
      await recordAdjustment(buildSubtractInput({ notes: "<script></script>" }));

      expect(adjustmentInserts).toHaveLength(2);
      expect(adjustmentInserts[0]?.notes).toBeNull();
      expect(adjustmentInserts[1]?.notes).toBeNull();
    });
  });

  describe("notes sanitization", () => {
    test("strips script containers while keeping allowed formatting tags", async () => {
      await recordAdjustment(buildAddInput({ notes: '<p>Monthly correction</p><script>alert("x")</script>' }));

      const persisted = adjustmentInserts[0]?.notes;
      expect(persisted).toBe("<p>Monthly correction</p>");
    });

    const attackPayloads: { label: string; payload: string; forbidden: string[] }[] = [
      {
        label: "nested script obfuscation",
        payload: "<scr<script>ipt>alert(1)</script>ipt>",
        forbidden: ["<script", "alert(1)"],
      },
      {
        label: "image error handler",
        payload: '<img src="x" onerror="alert(1)">',
        forbidden: ["onerror", "<img"],
      },
      {
        label: "svg onload handler",
        payload: "<svg onload=alert(1)></svg>",
        forbidden: ["<svg", "onload"],
      },
      {
        label: "javascript: URL",
        payload: '<a href="javascript:alert(1)">click</a>',
        forbidden: ["javascript:", "href"],
      },
      {
        label: "iframe embed",
        payload: '<iframe src="https://example.invalid"></iframe>',
        forbidden: ["<iframe"],
      },
      {
        label: "event handler on an allowed tag",
        payload: '<p onclick="alert(1)">ok</p>',
        forbidden: ["onclick", "alert(1)"],
      },
    ];

    for (const { label, payload, forbidden } of attackPayloads) {
      test(`neutralizes ${label} before persisting`, async () => {
        await recordAdjustment(buildAddInput({ notes: payload }));

        const persisted = adjustmentInserts[0]?.notes ?? null;
        expect(persisted).not.toBe(payload);
        if (persisted !== null) {
          for (const fragment of forbidden) {
            expect(persisted).not.toContain(fragment);
          }
        }
      });
    }
  });
});
