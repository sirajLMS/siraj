import { beforeEach, describe, expect, mock, test } from "bun:test";
import { type ExecutionResult, graphql } from "graphql";
import { DateTimeResolver } from "graphql-scalars";
import { AppPermission, CalculationStatus, ExpenseType, PaymentMethodType, UserRole } from "@/backend/enum";
import type { BaseContext } from "@/backend/graphql/gqlContext";
import { JSONScalar } from "@/backend/graphql/scalars/jsonScalar";
import { DomainError, ForbiddenError } from "@/backend/lib";
import type {
  ProfitLossExpenseRow,
  ProfitLossIncomeRow,
  ProfitLossPagination,
  ProfitLossPaymentRow,
  ProfitLossReport,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";

const USER_ID = "550e8400-e29b-41d4-a716-446655440001";

const tErrorsEn = getServerTranslations("en").errorsTranslations;
const tProfitLossEn = getServerTranslations("en").dashboardTranslations.accountingProfitLoss;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function buildPaymentRow(overrides: Partial<ProfitLossPaymentRow> = {}): ProfitLossPaymentRow {
  return {
    instanceId: "instance-1",
    scheduledStartAt: "2099-07-01T10:00:00.000Z",
    teacherName: "P&L Teacher",
    studentName: "P&L Student",
    subjectName: "Tajwid",
    durationMinutes: 60,
    studentPaidAmount: "100.00",
    studentPaidCurrency: CurrencyCode.SAR,
    convertedAmount: "100.00",
    manualSubtractCredits: null,
    manualSubtractCreditsCurrency: null,
    calculationStatus: CalculationStatus.PAID,
    ...overrides,
  };
}

function buildExpenseRow(overrides: Partial<ProfitLossExpenseRow> = {}): ProfitLossExpenseRow {
  return {
    id: "expense-1",
    title: "Facebook ads",
    type: ExpenseType.MARKETING,
    teacherName: null,
    expenseValue: "50.00",
    expenseCurrency: CurrencyCode.SAR,
    convertedAmount: "50.00",
    paymentDate: "2099-07-05",
    sourceEntity: null,
    sourceEntityId: null,
    note: null,
    ...overrides,
  };
}

function buildIncomeRow(overrides: Partial<ProfitLossIncomeRow> = {}): ProfitLossIncomeRow {
  return {
    paymentId: "payment-1",
    paymentDate: "2099-07-02T00:00:00.000Z",
    studentName: "P&L Student",
    parentName: "P&L Parent",
    amount: "250.00",
    currency: CurrencyCode.SAR,
    convertedAmount: "250.00",
    paymentMethodType: PaymentMethodType.CASH,
    packageName: "Tajwid Bundle",
    invoiceId: "invoice-1",
    ...overrides,
  };
}

function buildReport(overrides: Partial<ProfitLossReport> = {}): ProfitLossReport {
  return {
    month: "2099-07",
    currency: CurrencyCode.SAR,
    paymentsPage: {
      rows: [buildPaymentRow()],
      totalCount: 1,
      aggregate: {
        totalPayments: "100.00",
        totalOriginalCurrency: "100.00",
        dominantCurrency: CurrencyCode.SAR,
        excludedRowCount: 0,
      },
    },
    expensesPage: {
      rows: [buildExpenseRow()],
      totalCount: 1,
      aggregate: {
        totalExpenses: "50.00",
        dominantCurrency: CurrencyCode.SAR,
        excludedRowCount: 0,
        rowCountByType: {
          [ExpenseType.SALARIES]: 0,
          [ExpenseType.MARKETING]: 1,
          [ExpenseType.LOGISTICS]: 0,
          [ExpenseType.TECHNOLOGY]: 0,
        },
      },
    },
    incomePaymentsPage: {
      rows: [buildIncomeRow()],
      totalCount: 1,
      aggregate: {
        totalIncomePayments: "250.00",
        dominantCurrency: CurrencyCode.SAR,
        excludedRowCount: 0,
      },
    },
    profitsSummary: {
      totalIncomePayments: "250.00",
      totalPayments: "100.00",
      totalExpenses: "50.00",
      netProfit: "50.00",
      netProfitMargin: "50.0",
      currency: CurrencyCode.SAR,
    },
    fxWarnings: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the query module is imported. The query resolves
// the mocked `ProfitLossService` from the `@/backend/services` barrel, while
// the Pothos builder stays real so the scope-auth plugin runs.
// ---------------------------------------------------------------------------

interface GetReportCall {
  actorUserId: string;
  input: { month: string; currency: CurrencyCode };
  pagination: ProfitLossPagination;
  tErrors: ErrorsLabels;
  tLabels: ProfitLossLabels;
}

const getReportCalls: GetReportCall[] = [];
let reportResult: ProfitLossReport = buildReport();
let reportError: Error | null = null;

const getReportMock = mock(
  async (
    actorUserId: string,
    input: { month: string; currency: CurrencyCode },
    pagination: ProfitLossPagination,
    tErrors: ErrorsLabels,
    tLabels: ProfitLossLabels
  ): Promise<ProfitLossReport> => {
    getReportCalls.push({ actorUserId, input, pagination, tErrors, tLabels });
    if (reportError !== null) {
      throw reportError;
    }
    return reportResult;
  }
);

// Load the real services barrel first so every real export stays linkable for
// the builder's import graph, then substitute only the profit & loss service.
const realServices = await import("@/backend/services");

void mock.module("@/backend/services", () => ({
  ...realServices,
  ProfitLossService: { getReport: getReportMock },
}));

// The builder eagerly side-imports the full schema tree for its dev-mode HMR
// edge; neutralize it so the schema under test contains only the P&L types.
void mock.module("@/backend/graphql/gqlSchema.definitions", () => ({}));

// Import the real builder (with the scope-auth plugin stack the server uses)
// before replacing the module for the query under test.
const { gqlSchemaBuilder } = await import("@/backend/graphql/gqlSchemaBuilder");
void mock.module("@/backend/graphql/gqlSchemaBuilder", () => ({ gqlSchemaBuilder }));

// Register the scalars the P&L row types reference. Guarded by a shared global
// flag so every schema-backed report test file can reuse the same builder when
// bun runs them in a single process.
const SHARED_TEST_SCALARS = Symbol.for("siraj.payrollTest.scalarsRegistered");
const globalForSharedTest = globalThis as typeof globalThis & {
  [SHARED_TEST_SCALARS]?: boolean;
};

if (!globalForSharedTest[SHARED_TEST_SCALARS]) {
  gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
  gqlSchemaBuilder.addScalarType("JSON", JSONScalar);
  globalForSharedTest[SHARED_TEST_SCALARS] = true;
}

await import("@/backend/graphql/query/accounting/profit-loss.query");

gqlSchemaBuilder.queryType({});
const profitLossSchema = gqlSchemaBuilder.toSchema();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCtx(overrides: Partial<BaseContext> = {}): BaseContext {
  return {
    user: { id: USER_ID, displayCurrency: null },
    safeUser: undefined,
    permissions: [AppPermission.ACCOUNTING_PROFITS_VIEW],
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

interface ReportData {
  month: string;
  currency: string;
  paymentsPage: {
    rows: { instanceId: string; convertedAmount: string | null }[];
    totalCount: number;
    aggregate: { totalPayments: string; dominantCurrency: string; excludedRowCount: number };
  };
  expensesPage: {
    rows: { id: string; type: string }[];
    totalCount: number;
    aggregate: { totalExpenses: string; rowCountByType: Record<string, number> };
  };
  incomePaymentsPage: {
    rows: { paymentId: string; amount: string }[];
    totalCount: number;
    aggregate: { totalIncomePayments: string };
  };
  profitsSummary: {
    totalIncomePayments: string;
    totalPayments: string;
    totalExpenses: string;
    netProfit: string;
    netProfitMargin: string | null;
    currency: string;
  };
  fxWarnings: { originalCurrency: string; targetCurrency: string; rowCount: number }[];
}

function extractReport(result: ExecutionResult): ReportData | null {
  const data = result.data as { profitLossReport?: ReportData | null } | null | undefined;
  return data?.profitLossReport ?? null;
}

function expectErrorEnvelope(result: ExecutionResult, code: string, message: string): void {
  expect(result.errors).toBeDefined();
  expect(result.errors).toHaveLength(1);
  expect(result.errors?.[0]?.extensions.code).toBe(code);
  expect(result.errors?.[0]?.message).toBe(message);
}

function expectForbiddenRead(result: ExecutionResult): void {
  expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
  expect(extractReport(result)).toBeNull();
  expect(getReportCalls).toHaveLength(0);
}

const PROFIT_LOSS_REPORT_QUERY = `
  query ProfitLossReport(
    $month: String!
    $currency: CurrencyCode!
    $paymentsLimit: Int
    $paymentsOffset: Int
    $expensesLimit: Int
    $expensesOffset: Int
    $incomePaymentsLimit: Int
    $incomePaymentsOffset: Int
  ) {
    profitLossReport(
      month: $month
      currency: $currency
      paymentsLimit: $paymentsLimit
      paymentsOffset: $paymentsOffset
      expensesLimit: $expensesLimit
      expensesOffset: $expensesOffset
      incomePaymentsLimit: $incomePaymentsLimit
      incomePaymentsOffset: $incomePaymentsOffset
    ) {
      month
      currency
      paymentsPage {
        rows { id instanceId teacherName convertedAmount }
        totalCount
        aggregate { totalPayments totalOriginalCurrency dominantCurrency excludedRowCount }
      }
      expensesPage {
        rows { id title type }
        totalCount
        aggregate { totalExpenses dominantCurrency excludedRowCount rowCountByType }
      }
      incomePaymentsPage {
        rows { id paymentId studentName amount }
        totalCount
        aggregate { totalIncomePayments dominantCurrency excludedRowCount }
      }
      profitsSummary {
        totalIncomePayments
        totalPayments
        totalExpenses
        netProfit
        netProfitMargin
        currency
      }
      fxWarnings { originalCurrency targetCurrency rowCount }
    }
  }
`;

async function executeProfitLossReport(
  variableValues: Record<string, unknown>,
  ctx: BaseContext
): Promise<ExecutionResult> {
  return graphql({
    schema: profitLossSchema,
    source: PROFIT_LOSS_REPORT_QUERY,
    variableValues,
    contextValue: ctx,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("profitLossReport query", () => {
  beforeEach(() => {
    getReportCalls.length = 0;
    reportResult = buildReport();
    reportError = null;
  });

  test("returns the four-tab payload shape (tab pages + summary + FX warnings)", async () => {
    const result = await executeProfitLossReport({ month: "2099-07", currency: CurrencyCode.SAR }, makeCtx());

    expect(result.errors ?? []).toHaveLength(0);
    const report = extractReport(result);
    expect(report).not.toBeNull();
    expect(report?.month).toBe("2099-07");
    expect(report?.currency).toBe(CurrencyCode.SAR);

    expect(report?.paymentsPage.totalCount).toBe(1);
    expect(report?.paymentsPage.rows[0]?.instanceId).toBe("instance-1");
    expect(report?.paymentsPage.aggregate.totalPayments).toBe("100.00");
    expect(report?.paymentsPage.aggregate.dominantCurrency).toBe(CurrencyCode.SAR);

    expect(report?.expensesPage.totalCount).toBe(1);
    expect(report?.expensesPage.rows[0]?.type).toBe("MARKETING");
    expect(report?.expensesPage.aggregate.totalExpenses).toBe("50.00");
    expect(report?.expensesPage.aggregate.rowCountByType).toEqual({
      [ExpenseType.SALARIES]: 0,
      [ExpenseType.MARKETING]: 1,
      [ExpenseType.LOGISTICS]: 0,
      [ExpenseType.TECHNOLOGY]: 0,
    });

    expect(report?.incomePaymentsPage.totalCount).toBe(1);
    expect(report?.incomePaymentsPage.rows[0]?.paymentId).toBe("payment-1");
    expect(report?.incomePaymentsPage.aggregate.totalIncomePayments).toBe("250.00");

    expect(report?.profitsSummary.totalPayments).toBe("100.00");
    expect(report?.profitsSummary.totalExpenses).toBe("50.00");
    expect(report?.profitsSummary.netProfit).toBe("50.00");
    expect(report?.profitsSummary.netProfitMargin).toBe("50.0");
    expect(report?.fxWarnings).toEqual([]);

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
    expect(getReportCalls[0]?.input).toEqual({ month: "2099-07", currency: CurrencyCode.SAR });
    expect(getReportCalls[0]?.tErrors.insufficientPermissions).toBe(tErrorsEn.insufficientPermissions);
    expect(getReportCalls[0]?.tLabels.error.monthInvalid).toBe(tProfitLossEn.error.monthInvalid);
  });

  test("defaults the per-tab pagination to limit 50 / offset 0 when omitted", async () => {
    await executeProfitLossReport({ month: "2099-07", currency: CurrencyCode.SAR }, makeCtx());

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({
      paymentsLimit: 50,
      paymentsOffset: 0,
      expensesLimit: 50,
      expensesOffset: 0,
      incomePaymentsLimit: 50,
      incomePaymentsOffset: 0,
    });
  });

  test("passes explicit per-tab pagination args through to the service", async () => {
    await executeProfitLossReport(
      {
        month: "2099-07",
        currency: CurrencyCode.SAR,
        paymentsLimit: 10,
        paymentsOffset: 20,
        expensesLimit: 5,
        expensesOffset: 15,
        incomePaymentsLimit: 25,
        incomePaymentsOffset: 50,
      },
      makeCtx()
    );

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toEqual({
      paymentsLimit: 10,
      paymentsOffset: 20,
      expensesLimit: 5,
      expensesOffset: 15,
      incomePaymentsLimit: 25,
      incomePaymentsOffset: 50,
    });
  });

  test("rejects callers without the profits view permission with a FORBIDDEN GraphQL error", async () => {
    const result = await executeProfitLossReport(
      { month: "2099-07", currency: CurrencyCode.SAR },
      makeCtx({ permissions: [] })
    );

    expectForbiddenRead(result);
  });

  test.each([
    ["teacher", UserRole.TEACHER],
    ["student", UserRole.STUDENT],
    ["parent", UserRole.PARENT],
    ["staff/manager", UserRole.STAFF],
  ])(
    "rejects a logged-in %s lacking ACCOUNTING_PROFITS_VIEW before any report read (BOLA probe)",
    async (_label, role) => {
      const result = await executeProfitLossReport(
        { month: "2099-07", currency: CurrencyCode.SAR },
        makeCtx({ permissions: [], role })
      );

      expectForbiddenRead(result);
    }
  );

  test("rejects a logged-out caller with a FORBIDDEN GraphQL error", async () => {
    const result = await executeProfitLossReport(
      { month: "2099-07", currency: CurrencyCode.SAR },
      makeCtx({ user: undefined, permissions: [], role: UserRole.GUEST })
    );

    expectForbiddenRead(result);
  });

  test("the resolver itself rejects a permissioned context without a user id", async () => {
    const result = await executeProfitLossReport(
      { month: "2099-07", currency: CurrencyCode.SAR },
      makeCtx({ user: undefined, role: UserRole.GUEST })
    );

    expectErrorEnvelope(result, "UNAUTHENTICATED", tErrorsEn.unauthorized);
    expect(extractReport(result)).toBeNull();
    expect(getReportCalls).toHaveLength(0);
  });

  test("allows super admins without the explicit profits permission", async () => {
    const result = await executeProfitLossReport(
      { month: "2099-07", currency: CurrencyCode.SAR },
      makeCtx({ permissions: [], isSuperAdmin: true, role: UserRole.SUPER_ADMIN })
    );

    expect(result.errors ?? []).toHaveLength(0);
    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.actorUserId).toBe(USER_ID);
  });

  test("fails GraphQL validation when a required month argument is missing", async () => {
    const result = await executeProfitLossReport({ currency: CurrencyCode.SAR }, makeCtx());

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("month");
    expect(result.data).toBeUndefined();
    expect(getReportCalls).toHaveLength(0);
  });

  test("fails GraphQL validation when a required currency argument is missing", async () => {
    const result = await executeProfitLossReport({ month: "2099-07" }, makeCtx());

    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]?.message).toContain("currency");
    expect(result.data).toBeUndefined();
    expect(getReportCalls).toHaveLength(0);
  });

  test("rejects an invalid month format with a MONTH_INVALID GraphQL error", async () => {
    reportError = new DomainError("MONTH_INVALID", tProfitLossEn.error.monthInvalid);

    const result = await executeProfitLossReport({ month: "2099-13", currency: CurrencyCode.SAR }, makeCtx());

    expectErrorEnvelope(result, "MONTH_INVALID", "Month must be in YYYY-MM format.");
    expect(extractReport(result)).toBeNull();
    expect(getReportCalls).toHaveLength(1);
  });

  test.each(["%", ".*", "2024-1", "2024-00", "2024-01; DROP TABLE", "____-__"])(
    "rejects wildcard/regex/malformed months (%s) with a MONTH_INVALID GraphQL error before any tab read",
    async month => {
      reportError = new DomainError("MONTH_INVALID", tProfitLossEn.error.monthInvalid);

      const result = await executeProfitLossReport({ month, currency: CurrencyCode.SAR }, makeCtx());

      expectErrorEnvelope(result, "MONTH_INVALID", tProfitLossEn.error.monthInvalid);
      expect(extractReport(result)).toBeNull();
      expect(getReportCalls).toHaveLength(1);
    }
  );

  test("propagates a permission ForbiddenError from the service as a FORBIDDEN GraphQL error", async () => {
    reportError = new ForbiddenError(tErrorsEn.insufficientPermissions);

    const result = await executeProfitLossReport({ month: "2099-07", currency: CurrencyCode.SAR }, makeCtx());

    expectErrorEnvelope(result, "FORBIDDEN", tErrorsEn.insufficientPermissions);
    expect(extractReport(result)).toBeNull();
    expect(getReportCalls).toHaveLength(1);
  });

  test("forwards hostile pagination arguments to the service so the pagination guard runs", async () => {
    await executeProfitLossReport(
      {
        month: "2099-07",
        currency: CurrencyCode.SAR,
        paymentsLimit: -25,
        paymentsOffset: -1,
        expensesLimit: 0,
        expensesOffset: -999999,
        incomePaymentsLimit: 1_000_000,
        incomePaymentsOffset: -2_147_483_648,
      },
      makeCtx()
    );

    expect(getReportCalls).toHaveLength(1);
    expect(getReportCalls[0]?.pagination).toMatchObject({
      paymentsLimit: -25,
      paymentsOffset: -1,
      expensesLimit: 0,
      expensesOffset: -999999,
      incomePaymentsLimit: 1_000_000,
      incomePaymentsOffset: -2_147_483_648,
    });
  });
});
