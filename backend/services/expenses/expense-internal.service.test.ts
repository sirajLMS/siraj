import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { type AppPermission, ExpenseType } from "@/backend/enum";
import { DomainError, logger } from "@/backend/lib";
import type {
  AuditLogReturnType,
  CreateAuditLogInput,
  DBTransaction,
  ExpenseInsertType,
  ExpenseSelectType,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "ffff1111-1111-4cc1-8111-111111111111";
const TEACHER_ID = "ffff2222-2222-4cc2-8222-222222222222";
const CARRYOVER_ID = "ffff3333-3333-4cc3-8333-333333333333";

const EPOCH = new Date("2026-02-01T10:00:00.000Z");

// ---------------------------------------------------------------------------
// Caller-transaction simulator (staged writes + commit/rollback)
// ---------------------------------------------------------------------------

interface CallerTx {
  readonly marker: string;
  readonly stagedExpenses: Map<string, ExpenseSelectType>;
  readonly stagedAudit: AuditLogReturnType[];
}

interface CallerTxHandle {
  tx: CallerTx;
  commit: () => void;
  rollback: () => void;
}

/** Committed (visible) database state. */
let committedExpenses = new Map<string, ExpenseSelectType>();
let committedAudit: AuditLogReturnType[] = [];

function openCallerTx(): CallerTxHandle {
  const stagedExpenses = new Map(committedExpenses);
  const stagedAudit = [...committedAudit];
  return {
    tx: { marker: "caller-tx", stagedExpenses, stagedAudit },
    commit: () => {
      committedExpenses = stagedExpenses;
      committedAudit = stagedAudit;
    },
    rollback: () => {
      /* staged state is simply discarded */
    },
  };
}

function isCallerTx(value: unknown): value is CallerTx {
  return typeof value === "object" && value !== null && "stagedExpenses" in value;
}

function txStore(tx: unknown): Map<string, ExpenseSelectType> {
  return isCallerTx(tx) ? tx.stagedExpenses : committedExpenses;
}

function auditStoreFor(tx: unknown): { push: (row: AuditLogReturnType) => void } {
  return isCallerTx(tx) ? tx.stagedAudit : committedAudit;
}

// ---------------------------------------------------------------------------
// Repository / collaborator mocks
// ---------------------------------------------------------------------------

let expenseCounter = 0;
let auditCounter = 0;
const permissionChecks: AppPermission[] = [];
const mockCarryoverPaid = new Map<string, boolean>();

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
    createdAt: EPOCH,
    updatedAt: EPOCH,
  };
}

const expenseCreateMock = mock(async (input: ExpenseInsertType, tx: unknown): Promise<ExpenseSelectType> => {
  expenseCounter += 1;
  const row = buildExpenseRow(`ffff4444-4${String(expenseCounter).padStart(3, "0")}-4cc4-8444-444444444444`, input);
  txStore(tx).set(row.id, row);
  return row;
});

const expenseGetByIdMock = mock(async (id: string, tx?: unknown) => txStore(tx).get(id) ?? null);

const expenseSoftDeleteMock = mock(
  async (id: string, actorUserId: string, reason: string | null, tx?: unknown): Promise<ExpenseSelectType | null> => {
    const store = txStore(tx);
    const existing = store.get(id);
    if (existing == null) return null;
    const updated: ExpenseSelectType = {
      ...existing,
      deletedAt: new Date(),
      deletedByUserId: actorUserId,
      deletedReason: reason,
      updatedAt: new Date(),
    };
    store.set(id, updated);
    return updated;
  }
);

const carryoverLockMock = mock(
  async (ids: readonly string[]) =>
    ids.filter(id => mockCarryoverPaid.has(id)).map(id => ({ id, isPaid: mockCarryoverPaid.get(id) ?? false })) as {
      id: string;
      isPaid: boolean;
    }[]
);

const createManyAuditLogsMock = mock(async (inputs: readonly CreateAuditLogInput[], tx: unknown) => {
  const store = auditStoreFor(tx);
  return inputs.map(input => {
    auditCounter += 1;
    const row: AuditLogReturnType = {
      id: `internal-audit-${auditCounter}`,
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
    store.push(row);
    return row;
  });
});

await mock.module("@/backend/db/drizzleDb", () => ({
  db: { transaction: mock(async (fn: (tx: unknown) => Promise<unknown>) => fn({ fresh: "service-tx" })) },
  queryDb: () => ({ fresh: "bare-db" }),
}));

await mock.module("@/backend/db/repo", () => ({
  AuditRepository: { queryAuditLogs: mock(async () => ({ logs: [], total: 0, hasMore: false })) },
  CarryoverBalanceRepository: { getByIdsForUpdate: carryoverLockMock },
  ExpenseRepository: {
    create: expenseCreateMock,
    getById: expenseGetByIdMock,
    getByIdForUpdate: expenseGetByIdMock,
    softDelete: expenseSoftDeleteMock,
  },
  TeacherRepository: { findById: mock(async () => null) },
  UserRepository: { findByIds: mock(async () => new Map()) },
}));

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: mock(async (_actorUserId: string, permission: AppPermission) => {
    permissionChecks.push(permission);
  }),
}));

await mock.module("@/backend/services/system/audit.service", () => ({
  AuditService: { createManyAuditLogs: createManyAuditLogsMock },
}));

// ---------------------------------------------------------------------------
// Errors stub
// ---------------------------------------------------------------------------

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

/** Test-only narrowing: the caller-tx sentinel stands in for a real transaction (services forward it to mocked collaborators). */
function isDbTransaction(value: unknown): value is DBTransaction {
  return typeof value === "object" && value !== null && "stagedExpenses" in value;
}

function asTx(value: CallerTx): DBTransaction {
  if (!isDbTransaction(value)) throw new Error("expected a caller transaction sentinel");
  return value;
}

spyOn(logger, "info").mockImplementation(() => {});
spyOn(logger, "error").mockImplementation(() => {});

beforeEach(() => {
  committedExpenses = new Map();
  committedAudit = [];
  mockCarryoverPaid.clear();
  expenseCounter = 0;
  auditCounter = 0;
  permissionChecks.length = 0;
  expenseCreateMock.mockClear();
  expenseGetByIdMock.mockClear();
  expenseSoftDeleteMock.mockClear();
  carryoverLockMock.mockClear();
  createManyAuditLogsMock.mockClear();
});

async function importService(): Promise<typeof import("@/backend/services/expenses/expense.service")> {
  return import("@/backend/services/expenses/expense.service");
}

function settlementInput(): Parameters<
  Awaited<ReturnType<typeof importService>>["ExpenseService"]["createInternal"]
>[0] {
  return {
    teacherId: TEACHER_ID,
    teacherName: "Ustadh Ahmad",
    title: "Teacher payout — 2026-01-01 to 2026-01-31",
    type: ExpenseType.SALARIES,
    expenseValue: "2500.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-02-01",
    expenseDate: "2026-02",
    note: null,
    sourceEntity: "carryover_balances",
    sourceEntityId: CARRYOVER_ID,
    createdByUserId: ACTOR_ID,
  };
}

// ---------------------------------------------------------------------------
// Settlement cross-call atomicity (caller-owned transactions)
// ---------------------------------------------------------------------------

describe("ExpenseService settlement cross-call", () => {
  test("createInternal inside the caller tx becomes visible after the caller commits", async () => {
    const { ExpenseService } = await importService();
    const caller = openCallerTx();

    const created = await ExpenseService.createInternal(settlementInput(), asTx(caller.tx), tErrors);

    // Not yet visible on committed state.
    expect(await expenseGetByIdMock(created.id)).toBeNull();
    caller.commit();
    const visible = await expenseGetByIdMock(created.id);
    expect(visible?.type).toBe(ExpenseType.SALARIES);
    expect(visible?.sourceEntity).toBe("carryover_balances");
    expect(visible?.sourceEntityId).toBe(CARRYOVER_ID);
    expect(visible?.expenseValue).toBe("2500.00");

    // The audit row travels with the same transaction.
    expect(committedAudit).toHaveLength(1);
    expect(committedAudit[0]?.entityId).toBe(created.id);

    // No permission check on the internal path — the caller owns it.
    expect(permissionChecks).toHaveLength(0);
  });

  test("caller rollback leaves no orphan expense row or audit row", async () => {
    const { ExpenseService } = await importService();
    const caller = openCallerTx();

    const created = await ExpenseService.createInternal(settlementInput(), asTx(caller.tx), tErrors);
    caller.rollback();

    expect(await expenseGetByIdMock(created.id)).toBeNull();
    expect(committedAudit).toHaveLength(0);
  });

  test("softDelete inside the caller tx soft-deletes after commit", async () => {
    const seeded = expenseCreateMock;
    const insert = settlementInput();
    const seededRow = await seeded(insert, undefined);
    expect(committedExpenses.get(seededRow.id)).toBeDefined();

    const { ExpenseService } = await importService();
    const caller = openCallerTx();
    const deleted = await ExpenseService.softDelete(
      { id: seededRow.id, actorUserId: ACTOR_ID, reason: "unpay", tx: asTx(caller.tx) },
      tErrors
    );

    // Not yet applied on committed state.
    expect(committedExpenses.get(seededRow.id)?.deletedAt).toBeNull();
    caller.commit();
    expect(committedExpenses.get(seededRow.id)?.deletedAt).not.toBeNull();
    expect(deleted.deletedReason).toBe("unpay");
    expect(permissionChecks).toHaveLength(0);
  });

  test("caller rollback leaves the expense untouched", async () => {
    const seededRow = await expenseCreateMock(settlementInput(), undefined);

    const { ExpenseService } = await importService();
    const caller = openCallerTx();
    await ExpenseService.softDelete({ id: seededRow.id, actorUserId: ACTOR_ID, tx: asTx(caller.tx) }, tErrors);
    caller.rollback();

    expect(committedExpenses.get(seededRow.id)?.deletedAt).toBeNull();
    expect(committedAudit).toHaveLength(0);
  });

  test("softDelete rejects the protected (paid carryover) row inside the caller tx", async () => {
    mockCarryoverPaid.set(CARRYOVER_ID, true);
    const seededRow = await expenseCreateMock(settlementInput(), undefined);

    const { ExpenseService } = await importService();
    const caller = openCallerTx();
    let code: string | null = null;
    try {
      await ExpenseService.softDelete({ id: seededRow.id, actorUserId: ACTOR_ID, tx: asTx(caller.tx) }, tErrors);
    } catch (error) {
      if (error instanceof DomainError) code = error.code;
    }
    expect(code).toBe("EXPENSE_DELETE_VIA_UNPAY");
    caller.rollback();
    expect(committedExpenses.get(seededRow.id)?.deletedAt).toBeNull();
  });
});
