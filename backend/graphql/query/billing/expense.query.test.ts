import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, ExpenseType, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import type { ExpenseFilters, ExpensePage, ExpenseRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

const USER_ID = "6f118f7a-158a-447a-94a7-c815f326bebf";
const EXPENSE_ID = "e2f1a8b5-6c3d-4e90-8b7a-1d2c3e4f5a6b";
const EXPENSE_ID_2 = "a5c2d607-06cc-4f1e-9a44-40c9f8d61ab2";
const TEACHER_ID = "77d3f278-20e8-4d2d-9b6a-8f0c1e5a4d90";
const CREATOR_ID = "3b6f8d97-8b4e-4c8e-9f02-5b7c6f0b03a1";

const tErrorsEn = getServerTranslations("en").errorsTranslations;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildExpenseRow(overrides: Partial<ExpenseRow> = {}): ExpenseRow {
  return {
    id: EXPENSE_ID,
    teacherId: null,
    teacherName: null,
    title: "Office rent — September",
    type: ExpenseType.MARKETING,
    expenseValue: "1500.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-09-01",
    expenseDate: "2026-09",
    note: "Paid via bank transfer",
    sourceEntity: null,
    sourceEntityId: null,
    createdByUserId: CREATOR_ID,
    createdByName: "Layla Nasser",
    deletedAt: null,
    deletedByUserId: null,
    deletedReason: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-02T08:00:00.000Z",
    ...overrides,
  };
}

function buildExpensePage(rows: readonly ExpenseRow[]): ExpensePage {
  return {
    rows: [...rows],
    totalCount: rows.length,
    aggregates: {
      totalValue: "1500.00",
      dominantCurrency: CurrencyCode.SAR,
      rowCountByType: {
        [ExpenseType.SALARIES]: 0,
        [ExpenseType.MARKETING]: rows.length,
        [ExpenseType.LOGISTICS]: 0,
        [ExpenseType.TECHNOLOGY]: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the query module is imported. The query resolves
// the mocked `ExpenseService` from the `@/backend/services` barrel, while the
// Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface GetReportCall {
  actorUserId: string;
  filters: ExpenseFilters;
  pagination: { limit: number; offset: number };
  tErrors: ErrorsLabels;
}

interface GetByIdCall {
  actorUserId: string;
  id: string;
  tErrors: ErrorsLabels;
}

const getReportCalls: GetReportCall[] = [];
const getByIdCalls: GetByIdCall[] = [];
let reportResult: ExpensePage = buildExpensePage([buildExpenseRow()]);
let byIdResult: ExpenseRow = buildExpenseRow();

const getReportMock = mock(
  async (
    actorUserId: string,
    filters: ExpenseFilters,
    pagination: { limit: number; offset: number },
    tErrors: ErrorsLabels
  ): Promise<ExpensePage> => {
    getReportCalls.push({ actorUserId, filters, pagination, tErrors });
    return reportResult;
  }
);

const getByIdMock = mock(async (actorUserId: string, id: string, tErrors: ErrorsLabels): Promise<ExpenseRow> => {
  getByIdCalls.push({ actorUserId, id, tErrors });
  return byIdResult;
});

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph (lib, db, and repo modules resolve named exports
// from this barrel), then substitute only the expense service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  ExpenseService: {
    getReport: getReportMock,
    getById: getByIdMock,
  },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the expense types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the query under test, so the expense types
// register against the real pipeline and the schema executes identically.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the expense types reference. Guarded by the shared
// global flag so every schema-backed report test file can reuse the same
// builder when bun runs them in a single process (module caches persist).
const SHARED_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForSharedTest = globalThis as typeof globalThis & {
  [SHARED_TEST_SCALARS]?: boolean;
};

if (!globalForSharedTest[SHARED_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForSharedTest[SHARED_TEST_SCALARS] = true;
}

await import("@/backend/graphql/query/billing/expense.query");

gqlSchemaBuilder.queryType({});
const expenseSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_EXPENSES_VIEW],
    permissionGroups: [],
    isSuperAdmin: false,
    isImpersonating: false,
    isSimulatingGroup: false,
    refreshToken: undefined,
    sessionId: undefined,
    role: UserRole.USER,
    locale: "en",
    t: () => getServerTranslations("en"),
    ...overrides,
  };
}

interface ExpenseRowData {
  id: string;
  teacherId: string | null;
  teacherName: string | null;
  title: string;
  type: string;
  expenseValue: string;
  expenseCurrency: CurrencyCode;
  paymentDate: string;
  expenseDate: string;
  note: string | null;
  sourceEntity: string | null;
  sourceEntityId: string | null;
  createdByUserId: string;
  createdByName: string;
  deletedAt: string | null;
  deletedByUserId: string | null;
  deletedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ExpensePageData {
  totalCount: number;
  rows: ExpenseRowData[];
  totalValue: string;
  dominantCurrency: CurrencyCode;
  rowCountByType: Record<string, number>;
}

function extractPage(result: ExecutionResult): ExpensePageData | null {
  const data = result.data as { expenses?: ExpensePageData | null } | null | undefined;
  return data?.expenses ?? null;
}

function extractRow(result: ExecutionResult): ExpenseRowData | null {
  const data = result.data as { expense?: ExpenseRowData | null } | null | undefined;
  return data?.expense ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

const EXPENSES_QUERY = `
  query Expenses($filter: ExpenseFilter, $limit: Int, $offset: Int) {
    expenses(filter: $filter, limit: $limit, offset: $offset) {
      rows {
        id
        teacherId
        teacherName
        title
        type
        expenseValue
        expenseCurrency
        paymentDate
        expenseDate
        note
        sourceEntity
        sourceEntityId
        createdByUserId
        createdByName
        deletedAt
        deletedByUserId
        deletedReason
        createdAt
        updatedAt
      }
      totalCount
      totalValue
      dominantCurrency
      rowCountByType
    }
  }
`;

const EXPENSE_QUERY = `
  query Expense($id: ID!) {
    expense(id: $id) {
      id
      teacherId
      teacherName
      title
      type
      expenseValue
      expenseCurrency
      paymentDate
      expenseDate
      note
      sourceEntity
      sourceEntityId
      createdByUserId
      createdByName
      deletedAt
      deletedByUserId
      deletedReason
      createdAt
      updatedAt
    }
  }
`;

async function executeExpense(
  source: string,
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({
    schema: expenseSchema,
    source,
    variableValues,
    contextValue: ctx,
  });
}

const executeExpenses = (variableValues: Record<string, unknown>, ctx: BaseContext) =>
  executeExpense(EXPENSES_QUERY, variableValues, ctx);
const executeExpenseById = (variableValues: Record<string, unknown>, ctx: BaseContext) =>
  executeExpense(EXPENSE_QUERY, variableValues, ctx);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("expenses query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    getByIdCalls.length = 0;
    reportResult = buildExpensePage([
      buildExpenseRow(),
      buildExpenseRow({ id: EXPENSE_ID_2, type: ExpenseType.LOGISTICS, title: "Courier fees" }),
    ]);
  });

  test("returns the page shape with rows, totalCount, and flattened aggregates", async () => {
    const result = await executeExpenses({}, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const page = extractPage(result);
    expect(page).not.toBeNull();
    expect(page?.totalCount).toBe(2);
    expect(page?.rows).toHaveLength(2);

    const row = page?.rows[0];
    expect(row?.id).toBe(EXPENSE_ID);
    expect(row?.teacherId).toBeNull();
    expect(row?.teacherName).toBeNull();
    expect(row?.title).toBe("Office rent — September");
    // GraphQL serializes enums by name; the service receives the TS enum values.
    expect(row?.type).toBe("MARKETING");
    expect(row?.expenseValue).toBe("1500.00");
    expect(row?.expenseCurrency).toBe(CurrencyCode.SAR);
    expect(row?.paymentDate).toBe("2026-09-01");
    expect(row?.expenseDate).toBe("2026-09");
    expect(row?.note).toBe("Paid via bank transfer");
    expect(row?.sourceEntity).toBeNull();
    expect(row?.sourceEntityId).toBeNull();
    expect(row?.createdByUserId).toBe(CREATOR_ID);
    expect(row?.createdByName).toBe("Layla Nasser");
    expect(row?.deletedAt).toBeNull();
    expect(row?.deletedByUserId).toBeNull();
    expect(row?.deletedReason).toBeNull();
    // The DateTime scalar serializes the row timestamp; compare the instant.
    expect(row && new Date(row.createdAt).toISOString()).toBe("2026-09-01T08:00:00.000Z");
    expect(row && new Date(row.updatedAt).toISOString()).toBe("2026-09-02T08:00:00.000Z");

    expect(page?.rows[1]?.type).toBe("LOGISTICS");
    expect(page?.totalValue).toBe("1500.00");
    expect(page?.dominantCurrency).toBe(CurrencyCode.SAR);
    expect(page?.rowCountByType).toEqual({
      Salaries: 0,
      Marketing: 2,
      Logistics: 0,
      Technology: 0,
    });

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
    expect(getReportCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("passes explicit limit and offset through as the service pagination", async () => {
    await executeExpenses({ limit: 25, offset: 40 }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 25, offset: 40 });
  });

  test("falls back to the default pagination when limit and offset are null", async () => {
    await executeExpenses({ limit: null, offset: null }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({ limit: 50, offset: 0 });
  });

  test("maps the filter input onto the service filters", async () => {
    // Variables carry the GraphQL enum names; the service receives the TS enum values.
    const variables = {
      filter: {
        title: "office",
        types: ["MARKETING", "LOGISTICS"],
        expenseDate: "2026-09",
        paymentDateFrom: "2026-09-01",
        paymentDateTo: "2026-09-30",
        includeDeleted: false,
      },
    };

    await executeExpenses(variables, makeCtx());

    const expected: ExpenseFilters = {
      title: "office",
      types: [ExpenseType.MARKETING, ExpenseType.LOGISTICS],
      expenseDate: "2026-09",
      paymentDateFrom: "2026-09-01",
      paymentDateTo: "2026-09-30",
      includeDeleted: false,
    };
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters).toEqual(expected);
  });

  test("maps an absent filter to all-null service filters", async () => {
    await executeExpenses({ filter: null }, makeCtx());
    await executeExpenses({}, makeCtx());

    const expected: ExpenseFilters = {
      title: null,
      types: null,
      expenseDate: null,
      paymentDateFrom: null,
      paymentDateTo: null,
      includeDeleted: null,
    };
    expect(getReportCalls).toHaveLength(2);
    expect(getReportCalls[0]?.filters).toEqual(expected);
    expect(getReportCalls[1]?.filters).toEqual(expected);
  });

  test("strips includeDeleted for view-only callers requesting deleted rows", async () => {
    const result = await executeExpenses({ filter: { includeDeleted: true } }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(false);
  });

  test("keeps includeDeleted for callers holding the expenses manage permission", async () => {
    const result = await executeExpenses(
      { filter: { includeDeleted: true } },
      makeCtx({ permissions: [AppPermission.ACCOUNTING_EXPENSES_VIEW, AppPermission.ACCOUNTING_EXPENSES_MANAGE] })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(true);
  });

  test("keeps includeDeleted for super admins without the explicit manage permission", async () => {
    const result = await executeExpenses(
      { filter: { includeDeleted: true } },
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(true);
  });

  test("passes an explicit includeDeleted false through unchanged", async () => {
    await executeExpenses({ filter: { includeDeleted: false } }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.filters.includeDeleted).toBe(false);
  });

  test("rejects callers without the expense view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executeExpenses({}, makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("rejects logged-out callers with a FORBIDDEN GraphQL error", async () => {
    const result = await executeExpenses({}, makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("the resolver itself rejects a permissioned context without a user id", async () => {
    const result = await executeExpenses({}, makeCtx({ user: undefined, role: UserRole.GUEST }));

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(extractPage(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("allows super admins without the explicit expense permission", async () => {
    const result = await executeExpenses(
      {},
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
  });
});

describe("expense query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    getByIdCalls.length = 0;
    byIdResult = buildExpenseRow({
      type: ExpenseType.SALARIES,
      title: "Carryover settlement — Sarah Ahmed",
      teacherId: TEACHER_ID,
      teacherName: "Sarah Ahmed",
      sourceEntity: "carryover_balances",
      sourceEntityId: "0f4a9b3c-2d5e-4a1b-8c7d-9e2f1a3b5c7d",
    });
  });

  test("returns the expense row resolved by id with provenance fields", async () => {
    const result = await executeExpenseById({ id: EXPENSE_ID }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const row = extractRow(result);
    expect(row?.id).toBe(EXPENSE_ID);
    expect(row?.title).toBe("Carryover settlement — Sarah Ahmed");
    expect(row?.type).toBe("SALARIES");
    expect(row?.teacherId).toBe(TEACHER_ID);
    expect(row?.teacherName).toBe("Sarah Ahmed");
    expect(row?.sourceEntity).toBe("carryover_balances");
    expect(row?.sourceEntityId).toBe("0f4a9b3c-2d5e-4a1b-8c7d-9e2f1a3b5c7d");
    expect(row?.expenseValue).toBe("1500.00");
    expect(row?.expenseCurrency).toBe(CurrencyCode.SAR);
    expect(row?.createdByName).toBe("Layla Nasser");
    expect(row && new Date(row.createdAt).toISOString()).toBe("2026-09-01T08:00:00.000Z");
    expect(row && new Date(row.updatedAt).toISOString()).toBe("2026-09-02T08:00:00.000Z");

    expect(getByIdCalls).toHaveLength(1);
    expect(getByIdCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getByIdCalls[0]?.id).toBe(EXPENSE_ID);
    expect(getByIdCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
  });

  test("rejects callers without the expense view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executeExpenseById({ id: EXPENSE_ID }, makeCtx({ permissions: [] }));

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractRow(result)).toBeNull();
    expect(getByIdCalls).toHaveLength(0);
  });
});

describe("expense queries — unrelated permission holders", () => {
  test("an unrelated permission holder gets FORBIDDEN on both expense reads", async () => {
    getReportCalls.length = 0;
    getByIdCalls.length = 0;
    const ctx = makeCtx({ permissions: [AppPermission.SESSION_RESCHEDULE] });

    const page = await executeExpenses({}, ctx);
    const byId = await executeExpenseById({ id: EXPENSE_ID }, ctx);

    for (const result of [page, byId]) {
      expect(result.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      expect(result.errors?.[0]?.message).toBe(tErrorsEn.insufficientPermissions);
    }
    expect(getReportCalls).toHaveLength(0);
    expect(getByIdCalls).toHaveLength(0);
  });
});
