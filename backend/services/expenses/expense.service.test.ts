import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AppPermission, ExpenseType } from "@/backend/enum";
import { DomainError, ForbiddenError, logger } from "@/backend/lib";
import type {
  AuditLogReturnType,
  CreateAuditLogInput,
  CreateExpenseInput,
  DBTransaction,
  ExpenseInsertType,
  ExpenseListRow,
  ExpenseRow,
  ExpenseSelectType,
  ExpenseUpdatePatch,
  UpdateExpenseInput,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "eeee1111-1111-4cc1-8111-111111111111";
const OTHER_USER_ID = "eeee1212-1212-4cc1-8112-121212121212";
const TEACHER_ID = "eeee2222-2222-4cc2-8222-222222222222";
const TEACHER_USER_ID = "eeee2323-2323-4cc2-8223-232323232323";
const CARRYOVER_ID = "eeee3333-3333-4cc3-8333-333333333333";
const EXPENSE_ID = "eeee4444-4444-4cc4-8444-444444444444";

const FIXED_NOW = new Date("2026-02-01T10:00:00.000Z");

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

const expenseStore = new Map<string, ExpenseSelectType>();
const mockTeachers = new Map<string, { id: string; userId: string }>();
const mockUsers = new Map<string, { id: string; name: string }>();
const mockCarryovers = new Map<string, { isPaid: boolean }>();
const auditStore: AuditLogReturnType[] = [];
const permissionChecks: { actorUserId: string; permission: AppPermission }[] = [];
const insertPayloads: ExpenseInsertType[] = [];

let expenseCounter = 0;
let auditCounter = 0;
let permissionError: Error | null = null;
let transactionChain: Promise<unknown> = Promise.resolve();

let reportRows: ExpenseListRow[] = [];
let reportTotalCount = 0;

/** Key-scoped lock acquisitions, in order, alongside replay scans — proves lock-then-replay ordering. */
const invocationOrder: string[] = [];

/**
 * Sentinel executor handed to the service callback. Repository mocks assert
 * they received this exact object, proving writes share the service
 * transaction; a thrown body restores the snapshot so the in-memory store
 * honours rollback semantics.
 */
const TX_SENTINEL = { executor: "expense-service-test-transaction" };

function cloneStore<V>(source: Map<string, V>): Map<string, V> {
  return new Map(source);
}

function restoreStore<V>(target: Map<string, V>, snapshot: Map<string, V>): void {
  target.clear();
  for (const [key, value] of snapshot) {
    target.set(key, value);
  }
}

const dbTransactionMock = mock(async (fn: (tx: unknown) => Promise<unknown>) => {
  const snapshot = cloneStore(expenseStore);
  const run = transactionChain.then(() => fn(TX_SENTINEL));
  transactionChain = run.catch(() => undefined);
  try {
    return await run;
  } catch (error) {
    restoreStore(expenseStore, snapshot);
    throw error;
  }
});

const expenseCreateMock = mock(async (input: ExpenseInsertType, tx: unknown): Promise<ExpenseSelectType> => {
  expect(tx).toBe(TX_SENTINEL);
  expenseCounter += 1;
  insertPayloads.push(input);
  const row = buildExpenseRow(`expense-${expenseCounter}`, input);
  expenseStore.set(row.id, row);
  return row;
});

const expenseGetByIdMock = mock(async (id: string, _tx?: unknown) => expenseStore.get(id) ?? null);
const expenseGetByIdForUpdateMock = mock(async (id: string, tx: unknown) => {
  expect(tx).toBe(TX_SENTINEL);
  invocationOrder.push("expense-lock");
  return expenseStore.get(id) ?? null;
});

const expenseUpdateMock = mock(
  async (id: string, patch: ExpenseUpdatePatch, tx: unknown): Promise<ExpenseSelectType | null> => {
    expect(tx).toBe(TX_SENTINEL);
    const existing = expenseStore.get(id);
    if (existing == null) return null;
    const updated: ExpenseSelectType = { ...existing, ...patch, updatedAt: new Date() };
    expenseStore.set(id, updated);
    return updated;
  }
);

const expenseSoftDeleteMock = mock(
  async (id: string, actorUserId: string, reason: string | null, tx: unknown): Promise<ExpenseSelectType | null> => {
    expect(tx).toBe(TX_SENTINEL);
    const existing = expenseStore.get(id);
    if (existing == null) return null;
    const updated: ExpenseSelectType = {
      ...existing,
      deletedAt: new Date(),
      deletedByUserId: actorUserId,
      deletedReason: reason,
      updatedAt: new Date(),
    };
    expenseStore.set(id, updated);
    return updated;
  }
);

const findFilteredMock = mock(async () => ({ rows: reportRows, totalCount: reportTotalCount }));

const teacherFindByIdMock = mock(async (teacherId: string, _tx?: unknown) => mockTeachers.get(teacherId) ?? null);

const userFindByIdsMock = mock(async (ids: readonly string[]) => {
  const map = new Map<string, { id: string; name: string } | null>();
  for (const id of ids) {
    map.set(id, mockUsers.get(id) ?? null);
  }
  return map;
});

const carryoverLockMock = mock(async (ids: readonly string[], tx: unknown) => {
  expect(tx).toBe(TX_SENTINEL);
  invocationOrder.push("carryover-lock");
  const found: { id: string; isPaid: boolean }[] = [];
  for (const id of ids) {
    const row = mockCarryovers.get(id);
    if (row != null) found.push({ id, isPaid: row.isPaid });
  }
  return found;
});

const acquireAdvisoryLockMock = mock(async (_tx: unknown, lockKey: string) => {
  invocationOrder.push(`lock:${lockKey}`);
});

const queryAuditLogsMock = mock(
  async (
    filters: { actorUserId?: string; action?: string; startDate?: Date; limit?: number; offset?: number },
    _tx: unknown
  ) => {
    invocationOrder.push("replay-scan");
    const windowStart = filters.startDate?.getTime() ?? Number.NEGATIVE_INFINITY;
    const filtered = auditStore
      .filter(
        row =>
          row.actorUserId === (filters.actorUserId ?? null) &&
          row.action === filters.action &&
          row.createdAt.getTime() >= windowStart
      )
      .toReversed();
    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? filtered.length;
    const logs = filtered.slice(offset, offset + limit);
    return { logs, total: filtered.length, hasMore: offset + logs.length < filtered.length };
  }
);

const createManyAuditLogsMock = mock(async (inputs: readonly CreateAuditLogInput[], tx: unknown) => {
  expect(tx).toBe(TX_SENTINEL);
  return inputs.map(input => {
    auditCounter += 1;
    const row: AuditLogReturnType = {
      id: `expense-audit-${auditCounter}`,
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

const requirePermissionMock = mock(async (actorUserId: string, permission: AppPermission) => {
  permissionChecks.push({ actorUserId, permission });
  if (permissionError !== null) throw permissionError;
});

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: dbTransactionMock },
  queryDb: () => TX_SENTINEL,
}));

await mock.module("@/backend/db/repo", () => ({
  AuditRepository: { queryAuditLogs: queryAuditLogsMock },
  CarryoverBalanceRepository: { getByIdsForUpdate: carryoverLockMock },
  ExpenseRepository: {
    create: expenseCreateMock,
    getById: expenseGetByIdMock,
    getByIdForUpdate: expenseGetByIdForUpdateMock,
    update: expenseUpdateMock,
    softDelete: expenseSoftDeleteMock,
    findFiltered: findFilteredMock,
  },
  TeacherRepository: { findById: teacherFindByIdMock },
  UserRepository: { findByIds: userFindByIdsMock },
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
// Builders + stubs
// ---------------------------------------------------------------------------

function buildExpenseRow(id: string, input: ExpenseInsertType): ExpenseSelectType {
  return {
    id,
    teacherId: input.teacherId ?? null,
    teacherName: input.teacherName ?? null,
    title: input.title,
    type: input.type,
    expenseValue: input.expenseValue,
    expenseCurrency: input.expenseCurrency,
    paymentDate: input.paymentDate,
    expenseDate: input.expenseDate,
    note: input.note ?? null,
    sourceEntity: input.sourceEntity ?? null,
    sourceEntityId: input.sourceEntityId ?? null,
    createdByUserId: input.createdByUserId,
    deletedAt: null,
    deletedByUserId: null,
    deletedReason: null,
    createdAt: FIXED_NOW,
    updatedAt: FIXED_NOW,
  };
}

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    insufficientPermissions: "Insufficient permissions.",
    invalidInput: "Invalid input.",
    internalServerError: "Internal server error.",
    unknownName: "Unknown",
    expenses: {
      notFound: "Expense not found.",
      alreadyDeleted: "Expense is already deleted.",
      deleteViaUnpay: "This salary expense must be removed via the carryover Unpay flow.",
      typeImmutableForSalaries: "Type is read-only for Salaries expenses.",
      valueImmutableForSalaries: "Value is read-only for Salaries expenses.",
      salariesViaCarryoverOnly: "Salaries expenses are created through the carryover settlement flow.",
      titleRequired: "Title is required.",
      valueRequired: "Expense value is required.",
      valueInvalid: "Expense value must be a valid non-negative amount.",
      valueNegative: "Expense value cannot be negative.",
      currencyRequired: "Currency is required.",
      paymentDateInvalid: "Payment date must be a valid YYYY-MM-DD date.",
      expenseDateInvalid: "Expense month must be in YYYY-MM format.",
      createFailed: "Failed to persist the expense record.",
    },
    teacher: {
      teacherNotFound: (id: string) => `Teacher not found: ${id}`,
    },
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

/** Test-only narrowing: the sentinel objects stand in for real transaction handles (services just forward them to mocked collaborators). */
function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null;
}

function asTx(value: object): DBTransaction {
  if (!isDbTransaction(value)) throw new Error("expected a transaction sentinel");
  return value;
}

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});
const loggerErrorSpy = spyOn(logger, "error").mockImplementation(() => {});

function resetMocks(): void {
  expenseStore.clear();
  mockTeachers.clear();
  mockUsers.clear();
  mockCarryovers.clear();
  auditStore.length = 0;
  permissionChecks.length = 0;
  insertPayloads.length = 0;
  invocationOrder.length = 0;
  expenseCounter = 0;
  auditCounter = 0;
  permissionError = null;
  transactionChain = Promise.resolve();
  reportRows = [];
  reportTotalCount = 0;
  dbTransactionMock.mockClear();
  expenseCreateMock.mockClear();
  expenseGetByIdMock.mockClear();
  expenseGetByIdForUpdateMock.mockClear();
  expenseUpdateMock.mockClear();
  expenseSoftDeleteMock.mockClear();
  findFilteredMock.mockClear();
  teacherFindByIdMock.mockClear();
  userFindByIdsMock.mockClear();
  carryoverLockMock.mockClear();
  acquireAdvisoryLockMock.mockClear();
  queryAuditLogsMock.mockClear();
  createManyAuditLogsMock.mockClear();
  requirePermissionMock.mockClear();
  loggerInfoSpy.mockClear();
  loggerErrorSpy.mockClear();
}

beforeEach(resetMocks);

// ---------------------------------------------------------------------------
// SUT access + assertion helpers
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/expenses/expense.service")> {
  return import("@/backend/services/expenses/expense.service");
}

function buildInput(overrides: Partial<CreateExpenseInput> = {}): CreateExpenseInput {
  return {
    title: "Office rent",
    type: ExpenseType.MARKETING,
    expenseValue: "100.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-01-15",
    expenseDate: "2026-01",
    createdByUserId: ACTOR_ID,
    ...overrides,
  };
}

async function createExpense(overrides: Partial<CreateExpenseInput> = {}): Promise<ExpenseRow> {
  const { ExpenseService } = await importService();
  return ExpenseService.create(buildInput(overrides), ACTOR_ID, tErrors);
}

async function expectDomainError(run: () => Promise<unknown>, code: string): Promise<DomainError> {
  let caught: unknown = null;
  try {
    await run();
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
  expect(insertPayloads).toHaveLength(0);
  expect(auditStore).toHaveLength(0);
}

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function treatAsMetadata(value: unknown): Record<string, unknown> {
  if (!isMetadataRecord(value)) throw new Error("expected metadata object");
  return value;
}

// ---------------------------------------------------------------------------
// create (UI entry point)
// ---------------------------------------------------------------------------

describe("ExpenseService.create", () => {
  test("creates a manual marketing expense with an audit row", async () => {
    mockUsers.set(ACTOR_ID, { id: ACTOR_ID, name: "Ops Admin" });
    const created = await createExpense({ clientRequestId: "req-100", note: "Q1 rent" });

    expect(created.title).toBe("Office rent");
    expect(created.type).toBe(ExpenseType.MARKETING);
    expect(created.expenseValue).toBe("100.00");
    expect(created.expenseCurrency).toBe(CurrencyCode.SAR);
    expect(created.createdByUserId).toBe(ACTOR_ID);
    expect(created.createdByName).toBe("Ops Admin");
    expect(created.sourceEntity).toBeNull();
    expect(created.deletedAt).toBeNull();

    expect(permissionChecks).toEqual([{ actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_EXPENSES_MANAGE }]);
    expect(auditStore).toHaveLength(1);
    const audit = auditStore[0];
    expect(audit?.action).toBe("EXPENSE_CREATE");
    expect(audit?.entityType).toBe("EXPENSE");
    expect(audit?.entityId).toBe(created.id);
    const metadata = treatAsMetadata(audit?.metadata);
    expect(metadata.type).toBe(ExpenseType.MARKETING);
    expect(metadata.value).toBe("100.00");
    expect(typeof metadata.idempotencyKey).toBe("string");
    expect(loggerInfoSpy).toHaveBeenCalled();
  });

  test("rejects a Salaries expense on the public entry point", async () => {
    await expectDomainError(() => createExpense({ type: ExpenseType.SALARIES }), "EXPENSE_SALARIES_VIA_CARRYOVER_ONLY");
    expectNoWrites();
  });

  test("permission denial rejects before any write", async () => {
    permissionError = new ForbiddenError("Insufficient permissions.");
    await expectDomainError(() => createExpense(), "FORBIDDEN");
    expectNoWrites();
  });

  test("validation rejections", async () => {
    await expectDomainError(() => createExpense({ title: " " }), "VALIDATION");
    await expectDomainError(() => createExpense({ expenseValue: "-1" }), "VALIDATION");
    await expectDomainError(() => createExpense({ paymentDate: "15/01/2026" }), "PAYMENT_DATE_INVALID");
    await expectDomainError(() => createExpense({ expenseDate: "2026-1" }), "EXPENSE_DATE_INVALID");
    expectNoWrites();
  });

  test("a repository insert failure surfaces as EXPENSE_CREATE_FAILED and is logged", async () => {
    expenseCreateMock.mockImplementationOnce(async () => {
      throw new Error("connection reset");
    });
    await expectDomainError(() => createExpense(), "EXPENSE_CREATE_FAILED");
    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(auditStore).toHaveLength(0);
  });

  test("falls back to the unknown-name marker when the creator user row is missing", async () => {
    const created = await createExpense();
    expect(created.createdByName).toBe("Unknown");
  });

  test("a same-key re-submit inside the window replays the original row", async () => {
    const first = await createExpense({ clientRequestId: "req-double-click" });
    const second = await createExpense({ clientRequestId: "req-double-click" });

    expect(second.id).toBe(first.id);
    expect(insertPayloads).toHaveLength(1);
    expect(auditStore).toHaveLength(1);
  });

  test("takes the key-scoped advisory lock before the replay scan", async () => {
    await createExpense({ clientRequestId: "req-lock-order" });

    const lockIndex = invocationOrder.findIndex(entry => entry.startsWith("lock:expense-create:"));
    const scanIndex = invocationOrder.indexOf("replay-scan");
    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(scanIndex).toBeGreaterThanOrEqual(0);
    expect(lockIndex).toBeLessThan(scanIndex);
    expect(acquireAdvisoryLockMock).toHaveBeenCalledTimes(1);
  });

  test("serializes a concurrent duplicate burst onto the first write", async () => {
    const [first, second] = await Promise.all([
      createExpense({ clientRequestId: "req-burst" }),
      createExpense({ clientRequestId: "req-burst" }),
    ]);

    expect(second.id).toBe(first.id);
    expect(insertPayloads).toHaveLength(1);
    expect(auditStore).toHaveLength(1);
    expect(acquireAdvisoryLockMock).toHaveBeenCalledTimes(2);
  });

  test("a create without clientRequestId takes no advisory lock", async () => {
    await createExpense();
    expect(acquireAdvisoryLockMock).not.toHaveBeenCalled();
  });

  test("canonicalizes the stored value to two decimals", async () => {
    const created = await createExpense({ expenseValue: " 1.5 " });

    expect(created.expenseValue).toBe("1.50");
    expect(insertPayloads[0]?.expenseValue).toBe("1.50");
  });

  test("different client request ids create distinct rows", async () => {
    const first = await createExpense({ clientRequestId: "req-a" });
    const second = await createExpense({ clientRequestId: "req-b" });
    expect(second.id).not.toBe(first.id);
    expect(insertPayloads).toHaveLength(2);
  });

  test("a create without clientRequestId never short-circuits", async () => {
    const first = await createExpense();
    const second = await createExpense();
    expect(second.id).not.toBe(first.id);
    expect(insertPayloads).toHaveLength(2);
  });

  function pushCorruptAuditRow(metadata: unknown): void {
    auditCounter += 1;
    auditStore.push({
      id: `seeded-audit-${auditCounter}`,
      actorUserId: ACTOR_ID,
      actorType: "USER",
      entityType: "EXPENSE",
      entityId: EXPENSE_ID,
      action: "EXPENSE_CREATE",
      description: null,
      previousState: null,
      newState: null,
      changes: null,
      ipAddress: null,
      userAgent: null,
      metadata,
      createdAt: new Date(),
    });
  }

  test("corrupt replay audit metadata is ignored and the create runs fresh", async () => {
    pushCorruptAuditRow(42);
    pushCorruptAuditRow({ idempotencyKey: 42 });

    const created = await createExpense({ clientRequestId: "req-corrupt" });

    expect(insertPayloads).toHaveLength(1);
    expect(expenseStore.get(created.id)).toBeDefined();
    // Both seeded rows are non-matching garbage; the third row is the real audit.
    expect(auditStore).toHaveLength(3);
  });

  test("a replay whose original row is gone re-creates instead of returning a ghost", async () => {
    const first = await createExpense({ clientRequestId: "req-vanished" });
    expenseStore.delete(first.id);

    const second = await createExpense({ clientRequestId: "req-vanished" });

    expect(second.id).not.toBe(first.id);
    expect(insertPayloads).toHaveLength(2);
    expect(auditStore).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// createInternal (settlement cross-call)
// ---------------------------------------------------------------------------

describe("ExpenseService.createInternal", () => {
  test("writes a Salaries row with carryover provenance and no permission check", async () => {
    const { ExpenseService } = await importService();
    const created = await ExpenseService.createInternal(
      buildInput({
        teacherId: TEACHER_ID,
        teacherName: "Ustadh Ahmad",
        title: "January salary payout",
        type: ExpenseType.SALARIES,
        expenseValue: "2500.00",
        note: null,
        sourceEntity: "carryover_balances",
        sourceEntityId: CARRYOVER_ID,
      }),
      asTx(TX_SENTINEL),
      tErrors
    );

    expect(created.type).toBe(ExpenseType.SALARIES);
    expect(created.teacherName).toBe("Ustadh Ahmad");
    expect(created.sourceEntity).toBe("carryover_balances");
    expect(created.sourceEntityId).toBe(CARRYOVER_ID);
    expect(permissionChecks).toHaveLength(0);
    expect(insertPayloads).toHaveLength(1);
    expect(auditStore[0]?.action).toBe("EXPENSE_CREATE");
  });

  test("resolves the teacher snapshot name from the teacher's user when not provided", async () => {
    mockTeachers.set(TEACHER_ID, { id: TEACHER_ID, userId: TEACHER_USER_ID });
    mockUsers.set(TEACHER_USER_ID, { id: TEACHER_USER_ID, name: "Resolved Name" });

    const { ExpenseService } = await importService();
    const created = await ExpenseService.createInternal(
      buildInput({ teacherId: TEACHER_ID, teacherName: undefined }),
      asTx(TX_SENTINEL),
      tErrors
    );
    expect(created.teacherName).toBe("Resolved Name");
  });

  test("rejects a dangling teacher reference", async () => {
    const { ExpenseService } = await importService();
    await expectDomainError(
      () => ExpenseService.createInternal(buildInput({ teacherId: TEACHER_ID }), asTx(TX_SENTINEL), tErrors),
      "TEACHER_NOT_FOUND"
    );
    expectNoWrites();
  });

  test("falls back to the unknown-name marker when the teacher's user row is missing", async () => {
    mockTeachers.set(TEACHER_ID, { id: TEACHER_ID, userId: TEACHER_USER_ID });

    const { ExpenseService } = await importService();
    const created = await ExpenseService.createInternal(
      buildInput({ teacherId: TEACHER_ID, teacherName: undefined }),
      asTx(TX_SENTINEL),
      tErrors
    );
    expect(created.teacherName).toBe("Unknown");
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

function seedExpense(input: Partial<ExpenseInsertType> = {}): ExpenseSelectType {
  expenseCounter += 1;
  const row = buildExpenseRow(
    `eeee5555-5${String(expenseCounter).padStart(3, "0")}-4cc5-8555-555555555555`,
    buildInput({
      title: input.title ?? "Office rent",
      type: input.type ?? ExpenseType.MARKETING,
      expenseValue: input.expenseValue ?? "100.00",
      note: input.note,
      sourceEntity: input.sourceEntity,
      sourceEntityId: input.sourceEntityId,
      teacherId: input.teacherId,
      teacherName: input.teacherName,
    })
  );
  expenseStore.set(row.id, row);
  return row;
}

describe("ExpenseService.update", () => {
  async function updateExpense(input: Partial<UpdateExpenseInput> & { id: string }): Promise<ExpenseRow> {
    const { ExpenseService } = await importService();
    return ExpenseService.update({ actorUserId: ACTOR_ID, ...input }, tErrors);
  }

  test("applies a partial patch and audits the changed fields", async () => {
    const existing = seedExpense({ note: "old note" });
    const updated = await updateExpense({ id: existing.id, title: "<b>Storage rent</b>", note: null });

    expect(updated.title).toBe("Storage rent");
    expect(updated.note).toBeNull();
    expect(updated.expenseValue).toBe("100.00");

    const audit = auditStore[0];
    expect(audit?.action).toBe("EXPENSE_UPDATE");
    const metadata = treatAsMetadata(audit?.metadata);
    expect(metadata.previousValues).toEqual({ title: "Office rent", note: "old note" });
  });

  test("rejects an unknown id", async () => {
    await expectDomainError(() => updateExpense({ id: EXPENSE_ID, title: "x" }), "EXPENSE_NOT_FOUND");
  });

  test("rejects a malformed id before hitting the store", async () => {
    await expectDomainError(() => updateExpense({ id: "junk", title: "x" }), "EXPENSE_NOT_FOUND");
  });

  test("rejects edits to a soft-deleted expense", async () => {
    const deleted = seedExpense();
    expenseStore.set(deleted.id, {
      ...deleted,
      deletedAt: new Date(),
      deletedByUserId: ACTOR_ID,
      deletedReason: "cleanup",
    });
    await expectDomainError(() => updateExpense({ id: deleted.id, title: "x" }), "EXPENSE_ALREADY_DELETED");
  });

  test("rejects a type change on a Salaries expense", async () => {
    const salaries = seedExpense({ type: ExpenseType.SALARIES, expenseValue: "2500.00" });
    await expectDomainError(
      () => updateExpense({ id: salaries.id, type: ExpenseType.LOGISTICS }),
      "EXPENSE_TYPE_IMMUTABLE_FOR_SALARIES"
    );
  });

  test("rejects re-typing an operational expense INTO Salaries", async () => {
    const existing = seedExpense({ type: ExpenseType.MARKETING });
    await expectDomainError(
      () => updateExpense({ id: existing.id, type: ExpenseType.SALARIES }),
      "EXPENSE_SALARIES_VIA_CARRYOVER_ONLY"
    );
    expect(expenseStore.get(existing.id)?.type).toBe(ExpenseType.MARKETING);
    expect(expenseUpdateMock).toHaveBeenCalledTimes(0);
    expect(auditStore).toHaveLength(0);
  });

  test("canonicalizes a patched value to two decimals", async () => {
    const existing = seedExpense();
    const updated = await updateExpense({ id: existing.id, expenseValue: "7.5" });

    expect(updated.expenseValue).toBe("7.50");
    const metadata = treatAsMetadata(auditStore[0]?.metadata);
    expect(metadata.previousValues).toEqual({ expenseValue: "100.00" });
    expect(metadata.newValues).toEqual({ expenseValue: "7.50" });
  });

  test("rejects linking a teacher that does not exist", async () => {
    const existing = seedExpense();
    await expectDomainError(() => updateExpense({ id: existing.id, teacherId: TEACHER_ID }), "TEACHER_NOT_FOUND");
    expect(teacherFindByIdMock).toHaveBeenCalledTimes(1);
    expect(expenseUpdateMock).toHaveBeenCalledTimes(0);
    expect(auditStore).toHaveLength(0);
  });

  test("rejects a malformed teacher id shape before the transaction opens", async () => {
    const existing = seedExpense();
    await expectDomainError(() => updateExpense({ id: existing.id, teacherId: "not-a-uuid" }), "TEACHER_NOT_FOUND");
    expect(expenseGetByIdForUpdateMock).toHaveBeenCalledTimes(0);
    expect(expenseUpdateMock).toHaveBeenCalledTimes(0);
  });

  test("relinks to an existing teacher with the caller-supplied snapshot", async () => {
    mockTeachers.set(TEACHER_ID, { id: TEACHER_ID, userId: TEACHER_USER_ID });
    const existing = seedExpense();
    const updated = await updateExpense({ id: existing.id, teacherId: TEACHER_ID, teacherName: "Ustadh Ahmad" });

    expect(updated.teacherId).toBe(TEACHER_ID);
    expect(updated.teacherName).toBe("Ustadh Ahmad");
    expect(teacherFindByIdMock).toHaveBeenCalledTimes(1);
  });

  test("clears the teacher link without touching the teachers read", async () => {
    const existing = seedExpense({ teacherId: TEACHER_ID, teacherName: "Old Snapshot" });
    const updated = await updateExpense({ id: existing.id, teacherId: null, teacherName: null });

    expect(updated.teacherId).toBeNull();
    expect(updated.teacherName).toBeNull();
    expect(teacherFindByIdMock).toHaveBeenCalledTimes(0);
  });

  test("rejects a value change on a Salaries expense", async () => {
    const salaries = seedExpense({ type: ExpenseType.SALARIES, expenseValue: "2500.00" });
    await expectDomainError(
      () => updateExpense({ id: salaries.id, expenseValue: "2600.00" }),
      "EXPENSE_VALUE_IMMUTABLE_FOR_SALARIES"
    );
  });

  test("accepts a no-op type/value patch on a Salaries expense", async () => {
    const salaries = seedExpense({ type: ExpenseType.SALARIES, expenseValue: "2500.00" });
    const updated = await updateExpense({ id: salaries.id, type: ExpenseType.SALARIES, expenseValue: " 2500.00 " });
    expect(updated.type).toBe(ExpenseType.SALARIES);
    expect(updated.expenseValue).toBe("2500.00");
  });

  test("rejects when the locked row vanishes before the update write lands", async () => {
    const existing = seedExpense();
    expenseUpdateMock.mockImplementationOnce(async () => null);
    await expectDomainError(() => updateExpense({ id: existing.id, title: "x" }), "EXPENSE_NOT_FOUND");
  });

  test("permission denial rejects before any write", async () => {
    const existing = seedExpense();
    permissionError = new ForbiddenError("Insufficient permissions.");
    await expectDomainError(() => updateExpense({ id: existing.id, title: "x" }), "FORBIDDEN");
    expect(auditStore).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// softDelete
// ---------------------------------------------------------------------------

describe("ExpenseService.softDelete", () => {
  async function deleteExpense(id: string, reason?: string | null): Promise<ExpenseRow> {
    const { ExpenseService } = await importService();
    return ExpenseService.softDelete({ id, actorUserId: ACTOR_ID, reason }, tErrors);
  }

  test("marks the row deleted with actor, reason, and an audit row", async () => {
    const existing = seedExpense({ title: "Printer ink" });
    const deleted = await deleteExpense(existing.id, "duplicate entry");

    expect(deleted.deletedAt).not.toBeNull();
    expect(deleted.deletedByUserId).toBe(ACTOR_ID);
    expect(deleted.deletedReason).toBe("duplicate entry");
    expect(permissionChecks).toEqual([{ actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_EXPENSES_MANAGE }]);
    const audit = auditStore[0];
    expect(audit?.action).toBe("EXPENSE_DELETE");
    expect(treatAsMetadata(audit?.metadata).reason).toBe("duplicate entry");
  });

  test("is idempotent for an already-deleted row", async () => {
    const existing = seedExpense();
    const first = await deleteExpense(existing.id, "first");
    const second = await deleteExpense(existing.id, "second");

    expect(second.id).toBe(first.id);
    expect(second.deletedReason).toBe("first");
    expect(auditStore).toHaveLength(1);
    expect(expenseSoftDeleteMock).toHaveBeenCalledTimes(1);
  });

  test("rejects an unknown id", async () => {
    await expectDomainError(() => deleteExpense(EXPENSE_ID), "EXPENSE_NOT_FOUND");
  });

  test("rejects a Salaries expense whose carryover is still paid", async () => {
    mockCarryovers.set(CARRYOVER_ID, { isPaid: true });
    const salaries = seedExpense({
      type: ExpenseType.SALARIES,
      sourceEntity: "carryover_balances",
      sourceEntityId: CARRYOVER_ID,
    });
    expect(expenseStore.get(salaries.id)?.sourceEntity).toBe("carryover_balances");
    await expectDomainError(() => deleteExpense(salaries.id), "EXPENSE_DELETE_VIA_UNPAY");
    expect(expenseStore.get(salaries.id)?.deletedAt).toBeNull();
  });

  test("accepts a Salaries expense whose carryover is unpaid", async () => {
    mockCarryovers.set(CARRYOVER_ID, { isPaid: false });
    const salaries = seedExpense({
      type: ExpenseType.SALARIES,
      sourceEntity: "carryover_balances",
      sourceEntityId: CARRYOVER_ID,
    });
    const deleted = await deleteExpense(salaries.id);
    expect(deleted.deletedAt).not.toBeNull();
  });

  test("locks the linked carryover before the expense row (canonical lock order)", async () => {
    mockCarryovers.set(CARRYOVER_ID, { isPaid: false });
    const salaries = seedExpense({
      type: ExpenseType.SALARIES,
      sourceEntity: "carryover_balances",
      sourceEntityId: CARRYOVER_ID,
    });

    const deleted = await deleteExpense(salaries.id);

    expect(deleted.deletedAt).not.toBeNull();
    const carryoverLockIndex = invocationOrder.indexOf("carryover-lock");
    const expenseLockIndex = invocationOrder.indexOf("expense-lock");
    expect(carryoverLockIndex).toBeGreaterThanOrEqual(0);
    expect(expenseLockIndex).toBeGreaterThanOrEqual(0);
    expect(carryoverLockIndex).toBeLessThan(expenseLockIndex);
  });

  test("skips the carryover guard when the provenance carries no source id", async () => {
    const orphanSource = seedExpense({ sourceEntity: "carryover_balances" });
    const deleted = await deleteExpense(orphanSource.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(carryoverLockMock).not.toHaveBeenCalled();
  });

  test("deletes when the linked carryover row is no longer lockable", async () => {
    const salaries = seedExpense({
      type: ExpenseType.SALARIES,
      sourceEntity: "carryover_balances",
      sourceEntityId: CARRYOVER_ID,
    });
    const deleted = await deleteExpense(salaries.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect(carryoverLockMock).toHaveBeenCalledTimes(1);
  });

  test("rejects when the locked row vanishes before the delete write lands", async () => {
    const existing = seedExpense();
    expenseSoftDeleteMock.mockImplementationOnce(async () => null);
    await expectDomainError(() => deleteExpense(existing.id), "EXPENSE_NOT_FOUND");
  });

  test("permission denial rejects the public path; caller-tx path skips the check", async () => {
    const existing = seedExpense();
    permissionError = new ForbiddenError("Insufficient permissions.");
    await expectDomainError(() => deleteExpense(existing.id), "FORBIDDEN");
    expect(expenseStore.get(existing.id)?.deletedAt).toBeNull();

    permissionError = null;
    const { ExpenseService } = await importService();
    const deleted = await ExpenseService.softDelete(
      { id: existing.id, actorUserId: ACTOR_ID, tx: asTx(TX_SENTINEL) },
      tErrors
    );
    expect(deleted.deletedAt).not.toBeNull();
    // The only check on record is the denied public-path attempt; the
    // caller-tx path adds none.
    expect(permissionChecks).toEqual([{ actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_EXPENSES_MANAGE }]);
  });
});

// ---------------------------------------------------------------------------
// bulkDelete (atomic)
// ---------------------------------------------------------------------------

describe("ExpenseService.bulkDelete", () => {
  test("soft-deletes every id and reports audit rows", async () => {
    const first = seedExpense({ title: "A" });
    const second = seedExpense({ title: "B" });
    const { ExpenseService } = await importService();

    const result = await ExpenseService.bulkDelete(
      { ids: [first.id, second.id], actorUserId: ACTOR_ID, reason: "quarterly cleanup" },
      tErrors
    );

    expect(result.deleted).toEqual([first.id, second.id]);
    expect(result.auditLogIds).toHaveLength(2);
    expect(expenseStore.get(first.id)?.deletedAt).not.toBeNull();
    expect(expenseStore.get(second.id)?.deletedAt).not.toBeNull();
  });

  test("one protected row rolls back the whole batch", async () => {
    mockCarryovers.set(CARRYOVER_ID, { isPaid: true });
    const plain = seedExpense({ title: "plain" });
    const protectedRow = seedExpense({
      type: ExpenseType.SALARIES,
      sourceEntity: "carryover_balances",
      sourceEntityId: CARRYOVER_ID,
    });
    const { ExpenseService } = await importService();

    await expectDomainError(
      () => ExpenseService.bulkDelete({ ids: [plain.id, protectedRow.id], actorUserId: ACTOR_ID }, tErrors),
      "EXPENSE_DELETE_VIA_UNPAY"
    );
    expect(expenseStore.get(plain.id)?.deletedAt).toBeNull();
    expect(expenseStore.get(protectedRow.id)?.deletedAt).toBeNull();
  });

  test("permission denial rejects before any write", async () => {
    const plain = seedExpense();
    permissionError = new ForbiddenError("Insufficient permissions.");
    const { ExpenseService } = await importService();
    await expectDomainError(
      () => ExpenseService.bulkDelete({ ids: [plain.id], actorUserId: ACTOR_ID }, tErrors),
      "FORBIDDEN"
    );
    expect(expenseStore.get(plain.id)?.deletedAt).toBeNull();
  });

  test("deduplicates repeated ids in the batch", async () => {
    const row = seedExpense();
    const { ExpenseService } = await importService();

    const result = await ExpenseService.bulkDelete({ ids: [row.id, row.id], actorUserId: ACTOR_ID }, tErrors);

    expect(result.deleted).toEqual([row.id]);
    expect(result.auditLogIds).toHaveLength(1);
    expect(auditStore).toHaveLength(1);
  });

  test("rejects a batch carrying a malformed id before the transaction opens", async () => {
    const row = seedExpense();
    const { ExpenseService } = await importService();

    await expectDomainError(
      () => ExpenseService.bulkDelete({ ids: [row.id, "junk"], actorUserId: ACTOR_ID }, tErrors),
      "EXPENSE_NOT_FOUND"
    );
    expect(expenseStore.get(row.id)?.deletedAt).toBeNull();
    expect(auditStore).toHaveLength(0);
  });

  test("an already-deleted row re-lists as deleted without a second audit row", async () => {
    const row = seedExpense();
    const { ExpenseService } = await importService();
    await ExpenseService.softDelete({ id: row.id, actorUserId: ACTOR_ID, reason: "first" }, tErrors);

    const result = await ExpenseService.bulkDelete({ ids: [row.id], actorUserId: ACTOR_ID }, tErrors);

    expect(result.deleted).toEqual([row.id]);
    expect(result.auditLogIds).toHaveLength(0);
    expect(auditStore).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// getById + getReport
// ---------------------------------------------------------------------------

function toListRow(row: ExpenseSelectType, createdByName: string): ExpenseListRow {
  return Object.assign({}, row, { createdByName });
}

describe("ExpenseService.getById", () => {
  test("returns the row with the resolved creator name", async () => {
    mockUsers.set(ACTOR_ID, { id: ACTOR_ID, name: "Ops Admin" });
    const existing = seedExpense();
    const { ExpenseService } = await importService();

    const row = await ExpenseService.getById(OTHER_USER_ID, existing.id, tErrors);
    expect(row.id).toBe(existing.id);
    expect(row.createdByName).toBe("Ops Admin");
    expect(permissionChecks).toEqual([
      { actorUserId: OTHER_USER_ID, permission: AppPermission.ACCOUNTING_EXPENSES_VIEW },
    ]);
  });

  test("unknown and malformed ids reject with EXPENSE_NOT_FOUND", async () => {
    const { ExpenseService } = await importService();
    await expectDomainError(() => ExpenseService.getById(ACTOR_ID, EXPENSE_ID, tErrors), "EXPENSE_NOT_FOUND");
    await expectDomainError(() => ExpenseService.getById(ACTOR_ID, "not-a-uuid", tErrors), "EXPENSE_NOT_FOUND");
  });
});

describe("ExpenseService.getReport", () => {
  test("returns rows with page-derived aggregates", async () => {
    const marketing = buildExpenseRow("page-1", buildInput({ expenseValue: "100.00" }));
    const salaries = buildExpenseRow(
      "page-2",
      buildInput({ type: ExpenseType.SALARIES, expenseValue: "2500.50", expenseCurrency: CurrencyCode.USD })
    );
    const logistics = buildExpenseRow("page-3", buildInput({ type: ExpenseType.LOGISTICS, expenseValue: "25.50" }));
    reportRows = [
      toListRow(marketing, "Ops Admin"),
      toListRow(salaries, "Ops Admin"),
      toListRow(logistics, "Ops Admin"),
    ];
    reportTotalCount = 9;

    const { ExpenseService } = await importService();
    const page = await ExpenseService.getReport(
      ACTOR_ID,
      { types: [ExpenseType.MARKETING] },
      { limit: 50, offset: 0 },
      tErrors
    );

    expect(page.totalCount).toBe(9);
    expect(page.rows).toHaveLength(3);
    expect(page.rows[0]?.createdByName).toBe("Ops Admin");
    expect(page.rows[0]?.createdAt).toBe(FIXED_NOW.toISOString());
    expect(page.aggregates.totalValue).toBe("2626.00");
    expect(page.aggregates.dominantCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByType).toEqual({
      [ExpenseType.SALARIES]: 1,
      [ExpenseType.MARKETING]: 1,
      [ExpenseType.LOGISTICS]: 1,
      [ExpenseType.TECHNOLOGY]: 0,
    });
    expect(permissionChecks).toEqual([{ actorUserId: ACTOR_ID, permission: AppPermission.ACCOUNTING_EXPENSES_VIEW }]);
  });

  test("empty page falls back to the default aggregate currency", async () => {
    reportRows = [];
    reportTotalCount = 0;
    const { ExpenseService } = await importService();
    const page = await ExpenseService.getReport(ACTOR_ID, {}, { limit: 50, offset: 0 }, tErrors);
    expect(page.aggregates.totalValue).toBe("0.00");
    expect(page.aggregates.dominantCurrency).toBe(CurrencyCode.SAR);
    expect(page.aggregates.rowCountByType[ExpenseType.SALARIES]).toBe(0);
  });

  test("permission denial rejects the read", async () => {
    permissionError = new ForbiddenError("Insufficient permissions.");
    const { ExpenseService } = await importService();
    await expectDomainError(
      () => ExpenseService.getReport(ACTOR_ID, {}, { limit: 50, offset: 0 }, tErrors),
      "FORBIDDEN"
    );
  });
});
