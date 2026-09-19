import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AppPermission, CalculationStatus, ExpenseType, PaymentMethodType } from "@/backend/enum";
import { DomainError, ForbiddenError, logger } from "@/backend/lib";
import type {
  ProfitLossExpenseRow,
  ProfitLossIncomeRow,
  ProfitLossPagination,
  ProfitLossPaymentRepoRow,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "550e8400-e29b-41d4-a716-446655440001";
const MONTH = "2099-07";
const MONTH_INVALID_MESSAGE = "Month must be in YYYY-MM format.";
const PAGINATION_INVALID_MESSAGE = "Page size and offset must be positive numbers within the allowed range.";

type PaymentRepoRow = Omit<
  ProfitLossPaymentRepoRow,
  "convertedAmount" | "manualSubtractCredits" | "manualSubtractCreditsCurrency"
>;

function buildPaymentRepoRow(overrides: Partial<PaymentRepoRow> = {}): PaymentRepoRow {
  return {
    instanceId: "instance-1",
    scheduledStartAt: "2099-07-01T10:00:00.000Z",
    teacherName: "P&L Teacher",
    studentName: "P&L Student",
    subjectName: "Tajwid",
    durationMinutes: 60,
    teacherPaidAmount: "100.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.PAID,
    ...overrides,
  };
}

function buildExpenseRepoRow(overrides: Partial<ProfitLossExpenseRow> = {}): ProfitLossExpenseRow {
  return {
    id: "expense-1",
    title: "Facebook ads",
    type: ExpenseType.MARKETING,
    teacherName: null,
    expenseValue: "50.00",
    expenseCurrency: CurrencyCode.SAR,
    convertedAmount: null,
    paymentDate: "2099-07-05",
    sourceEntity: null,
    sourceEntityId: null,
    note: null,
    ...overrides,
  };
}

function buildIncomeRepoRow(overrides: Partial<ProfitLossIncomeRow> = {}): ProfitLossIncomeRow {
  return {
    paymentId: "payment-1",
    paymentDate: "2099-07-02T00:00:00.000Z",
    studentName: "P&L Student",
    parentName: "P&L Parent",
    amount: "250.00",
    currency: CurrencyCode.SAR,
    convertedAmount: null,
    paymentMethodType: PaymentMethodType.CASH,
    packageName: "Tajwid Bundle",
    invoiceId: "invoice-1",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

interface FxRateSnapshot {
  rate: string | null;
  stale: boolean;
}

const fxRatesByPair = new Map<string, FxRateSnapshot>();

const fxRateMock = mock(async (from: CurrencyCode, to: CurrencyCode): Promise<FxRateSnapshot> => {
  return fxRatesByPair.get(`${from}->${to}`) ?? { rate: null, stale: false };
});

interface PaymentPageCall {
  month: string;
  limit: number;
  offset: number;
}

interface ExpensePageCall {
  month: string;
  limit: number;
  offset: number;
}

interface IncomePageCall {
  month: string;
  limit: number;
  offset: number;
}

interface SubtractCreditsCall {
  instanceIds: string[];
}

const paymentPageCalls: PaymentPageCall[] = [];
const expensePageCalls: ExpensePageCall[] = [];
const incomePageCalls: IncomePageCall[] = [];
const subtractCreditsCalls: SubtractCreditsCall[] = [];

let queuedPaymentPages: { rows: PaymentRepoRow[]; totalCount: number }[] = [];
let queuedExpensePages: { rows: ProfitLossExpenseRow[]; totalCount: number }[] = [];
let queuedIncomePages: { rows: ProfitLossIncomeRow[]; totalCount: number }[] = [];
let subtractCreditsByInstance: Map<string, { amount: number; currency: null }> = new Map();
let permissionError: Error | null = null;

const findProfitLossPaymentsMock = mock(async (options: { month: string; limit: number; offset: number }) => {
  paymentPageCalls.push({ month: options.month, limit: options.limit, offset: options.offset });
  return queuedPaymentPages.shift() ?? { rows: [], totalCount: 0 };
});

const findProfitLossExpensesMock = mock(async (input: { month: string; limit: number; offset: number }) => {
  expensePageCalls.push({ month: input.month, limit: input.limit, offset: input.offset });
  return queuedExpensePages.shift() ?? { rows: [], totalCount: 0 };
});

const findProfitLossIncomeMock = mock(
  async (filters: { month: string }, pagination: { limit: number; offset: number }) => {
    incomePageCalls.push({ month: filters.month, limit: pagination.limit, offset: pagination.offset });
    return queuedIncomePages.shift() ?? { rows: [], totalCount: 0 };
  }
);

const findSubtractCreditsByInstanceIdsMock = mock(async (instanceIds: string[]) => {
  subtractCreditsCalls.push({ instanceIds: [...instanceIds] });
  return new Map(subtractCreditsByInstance);
});

const requirePermissionMock = mock(async (_actorUserId: string, _permission: AppPermission, _tErrors: ErrorsLabels) => {
  if (permissionError !== null) {
    throw permissionError;
  }
});

await mock.module("@/backend/db/repo/scheduling", () => ({
  SchedulingRepository: { findProfitLossPayments: findProfitLossPaymentsMock },
}));

await mock.module("@/backend/db/repo/expenses", () => ({
  ExpenseRepository: { findProfitLossExpenses: findProfitLossExpensesMock },
}));

await mock.module("@/backend/db/repo/billing", () => ({
  AccountingPaymentRepository: { findProfitLossIncome: findProfitLossIncomeMock },
  BillingRepository: { getLatestExchangeRateForDisplay: fxRateMock },
  CreditRepository: { findSubtractCreditsByInstanceIds: findSubtractCreditsByInstanceIdsMock },
}));

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
}));

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first).
// ---------------------------------------------------------------------------

type ProfitLossServiceModule = typeof import("@/backend/services/accounting/profit-loss.service");
const serviceModule: ProfitLossServiceModule = await import("@/backend/services/accounting/profit-loss.service");
const { ProfitLossService } = serviceModule;

// ---------------------------------------------------------------------------
// Labels / errors stubs (only the fields the service actually reads).
// ---------------------------------------------------------------------------

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = { insufficientPermissions: "insufficient permissions" };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

function assertIsProfitLossLabels(value: unknown): asserts value is ProfitLossLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tLabelsStub must be an object");
  }
}

function buildProfitLossLabelsStub(): ProfitLossLabels {
  const stub = {
    error: { monthInvalid: MONTH_INVALID_MESSAGE, paginationInvalid: PAGINATION_INVALID_MESSAGE },
  } satisfies Partial<ProfitLossLabels>;
  assertIsProfitLossLabels(stub);
  return stub;
}

function assertIsDomainError(value: unknown): asserts value is DomainError {
  if (!(value instanceof DomainError)) {
    throw new Error(`expected a DomainError but got ${String(value)}`);
  }
}

const tLabels = buildProfitLossLabelsStub();

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function readReport(pagination: ProfitLossPagination = {}, month: string = MONTH) {
  return ProfitLossService.getReport(ACTOR_ID, { month, currency: CurrencyCode.SAR }, pagination, tErrors, tLabels);
}

async function expectServiceError(action: () => Promise<unknown>): Promise<Error> {
  let caught: unknown = null;
  try {
    await action();
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (caught instanceof Error) return caught;
  throw new Error("service threw a non-Error value");
}

function resetMocks(): void {
  paymentPageCalls.length = 0;
  expensePageCalls.length = 0;
  incomePageCalls.length = 0;
  subtractCreditsCalls.length = 0;
  queuedPaymentPages = [];
  queuedExpensePages = [];
  queuedIncomePages = [];
  subtractCreditsByInstance = new Map();
  fxRatesByPair.clear();
  permissionError = null;
  findProfitLossPaymentsMock.mockClear();
  findProfitLossExpensesMock.mockClear();
  findProfitLossIncomeMock.mockClear();
  findSubtractCreditsByInstanceIdsMock.mockClear();
  fxRateMock.mockClear();
  requirePermissionMock.mockClear();
  loggerInfoSpy.mockClear();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ProfitLossService.getReport", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("permission and validation", () => {
    test("denies actors without the accounting-profits permission", async () => {
      permissionError = new ForbiddenError(tErrors.insufficientPermissions);

      const error = await expectServiceError(() => readReport());

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe(tErrors.insufficientPermissions);
      expect(findProfitLossPaymentsMock).not.toHaveBeenCalled();
      expect(findProfitLossExpensesMock).not.toHaveBeenCalled();
      expect(findProfitLossIncomeMock).not.toHaveBeenCalled();
    });

    test("rejects a malformed month with MONTH_INVALID before any tab read", async () => {
      const error = await expectServiceError(() => readReport({}, "2024-13"));

      expect(error).toBeInstanceOf(DomainError);
      assertIsDomainError(error);
      expect(error.code).toBe("MONTH_INVALID");
      expect(error.message).toBe(MONTH_INVALID_MESSAGE);
      expect(findProfitLossPaymentsMock).not.toHaveBeenCalled();
    });

    test.each([
      ["a negative payments offset", { paymentsOffset: -1 }],
      ["a negative expenses offset", { expensesOffset: -1 }],
      ["a negative income offset", { incomePaymentsOffset: -1 }],
      ["a zero payments limit", { paymentsLimit: 0 }],
      ["a negative expenses limit", { expensesLimit: -5 }],
      ["a fractional income limit", { incomePaymentsLimit: 10.5 }],
      ["a fractional payments offset", { paymentsOffset: 2.5 }],
      ["an oversized payments limit", { paymentsLimit: 10_000 }],
      ["an oversized expenses limit", { expensesLimit: 1_000_000 }],
      ["an oversized income limit", { incomePaymentsLimit: Number.MAX_SAFE_INTEGER }],
    ])("rejects %s with PAGINATION_INVALID before any tab read", async (_label, pagination) => {
      const error = await expectServiceError(() => readReport(pagination));

      expect(error).toBeInstanceOf(DomainError);
      assertIsDomainError(error);
      expect(error.code).toBe("PAGINATION_INVALID");
      expect(error.message).toBe(PAGINATION_INVALID_MESSAGE);
      expect(findProfitLossPaymentsMock).not.toHaveBeenCalled();
      expect(findProfitLossExpensesMock).not.toHaveBeenCalled();
      expect(findProfitLossIncomeMock).not.toHaveBeenCalled();
    });

    test.each([
      [{ paymentsLimit: 200 }],
      [{ paymentsOffset: 0 }],
      [{ expensesLimit: 1 }],
      [{ incomePaymentsOffset: 123_456 }],
    ])("accepts pagination values inside the allowed window (%j)", async pagination => {
      const report = await readReport(pagination);
      expect(report.month).toBe(MONTH);
    });
  });

  describe("happy path", () => {
    test("returns the four-tab payload with aggregates, summary, warnings, and logging", async () => {
      queuedPaymentPages = [
        {
          rows: [
            buildPaymentRepoRow({ instanceId: "i-1", teacherPaidAmount: "150.00" }),
            buildPaymentRepoRow({ instanceId: "i-2", teacherPaidAmount: "200.00" }),
          ],
          totalCount: 5,
        },
      ];
      queuedExpensePages = [
        {
          rows: [
            buildExpenseRepoRow({ id: "e-1", expenseValue: "80.00" }),
            buildExpenseRepoRow({ id: "e-2", expenseValue: "20.00", type: ExpenseType.TECHNOLOGY }),
          ],
          totalCount: 3,
        },
      ];
      queuedIncomePages = [
        {
          rows: [
            buildIncomeRepoRow({ paymentId: "p-1", amount: "300.00" }),
            buildIncomeRepoRow({ paymentId: "p-2", amount: "450.00" }),
          ],
          totalCount: 4,
        },
      ];

      const report = await readReport({ paymentsLimit: 10, expensesLimit: 10, incomePaymentsLimit: 10 });

      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_PROFITS_VIEW, tErrors);
      expect(report.month).toBe(MONTH);
      expect(report.currency).toBe(CurrencyCode.SAR);

      expect(paymentPageCalls).toEqual([{ month: MONTH, limit: 10, offset: 0 }]);
      expect(expensePageCalls).toEqual([{ month: MONTH, limit: 10, offset: 0 }]);
      expect(incomePageCalls).toEqual([{ month: MONTH, limit: 10, offset: 0 }]);

      expect(report.paymentsPage.totalCount).toBe(5);
      expect(report.paymentsPage.rows).toHaveLength(2);
      expect(report.paymentsPage.rows[0]?.convertedAmount).toBe("150.00");
      expect(report.paymentsPage.rows[0]?.manualSubtractCredits).toBeNull();
      expect(report.paymentsPage.aggregate.totalPayments).toBe("350.00");
      expect(report.paymentsPage.aggregate.dominantCurrency).toBe(CurrencyCode.SAR);
      expect(report.paymentsPage.aggregate.excludedRowCount).toBe(0);

      expect(report.expensesPage.totalCount).toBe(3);
      expect(report.expensesPage.aggregate.totalExpenses).toBe("100.00");
      expect(report.expensesPage.aggregate.rowCountByType[ExpenseType.MARKETING]).toBe(1);
      expect(report.expensesPage.aggregate.rowCountByType[ExpenseType.TECHNOLOGY]).toBe(1);

      expect(report.incomePaymentsPage.totalCount).toBe(4);
      expect(report.incomePaymentsPage.aggregate.totalIncomePayments).toBe("750.00");

      expect(report.profitsSummary.currency).toBe(CurrencyCode.SAR);
      expect(report.profitsSummary.totalIncomePayments).toBe("750.00");
      expect(report.profitsSummary.totalPayments).toBe("350.00");
      expect(report.profitsSummary.totalExpenses).toBe("100.00");
      expect(report.profitsSummary.netProfit).toBe("250.00");
      expect(report.profitsSummary.netProfitMargin).toBe("71.4");

      expect(report.fxWarnings).toEqual([]);

      expect(loggerInfoSpy).toHaveBeenCalledWith("Profit & loss report generated", {
        actorUserId: ACTOR_ID,
        month: MONTH,
        currency: CurrencyCode.SAR,
        paymentsCount: 2,
        expensesCount: 2,
        incomePaymentsCount: 2,
        excludedRowCount: 0,
      });
    });

    test("defaults every tab page size when the caller supplies no pagination", async () => {
      await readReport();

      expect(paymentPageCalls).toEqual([{ month: MONTH, limit: 50, offset: 0 }]);
      expect(expensePageCalls).toEqual([{ month: MONTH, limit: 50, offset: 0 }]);
      expect(incomePageCalls).toEqual([{ month: MONTH, limit: 50, offset: 0 }]);
    });
  });

  describe("empty month", () => {
    test("returns empty tabs, zero aggregates, and a zeroed net profit", async () => {
      const report = await readReport();

      expect(report.paymentsPage.rows).toEqual([]);
      expect(report.expensesPage.rows).toEqual([]);
      expect(report.incomePaymentsPage.rows).toEqual([]);
      expect(report.paymentsPage.aggregate.totalPayments).toBe("0.00");
      expect(report.expensesPage.aggregate.totalExpenses).toBe("0.00");
      expect(report.incomePaymentsPage.aggregate.totalIncomePayments).toBe("0.00");
      expect(report.profitsSummary.netProfit).toBe("0.00");
      expect(report.profitsSummary.netProfitMargin).toBeNull();
      expect(report.fxWarnings).toEqual([]);
      expect(subtractCreditsCalls).toEqual([{ instanceIds: [] }]);
    });
  });

  describe("mixed-currency FX conversion", () => {
    test("converts per-row amounts, keeps the dominant currency, and counts excluded rows", async () => {
      fxRatesByPair.set(`${CurrencyCode.USD}->${CurrencyCode.SAR}`, { rate: "3.75", stale: false });
      queuedPaymentPages = [
        {
          rows: [
            buildPaymentRepoRow({
              instanceId: "i-sar",
              teacherPaidAmount: "100.00",
              teacherPaidCurrency: CurrencyCode.SAR,
            }),
            buildPaymentRepoRow({
              instanceId: "i-usd",
              teacherPaidAmount: "40.00",
              teacherPaidCurrency: CurrencyCode.USD,
            }),
            buildPaymentRepoRow({
              instanceId: "i-egp-excluded",
              teacherPaidAmount: "10.00",
              teacherPaidCurrency: CurrencyCode.EGP,
            }),
            buildPaymentRepoRow({
              instanceId: "i-usd-2",
              teacherPaidAmount: "60.00",
              teacherPaidCurrency: CurrencyCode.USD,
            }),
          ],
          totalCount: 4,
        },
      ];
      queuedExpensePages = [
        {
          rows: [buildExpenseRepoRow({ id: "e-usd", expenseValue: "20.00", expenseCurrency: CurrencyCode.USD })],
          totalCount: 1,
        },
      ];
      queuedIncomePages = [
        {
          rows: [buildIncomeRepoRow({ paymentId: "p-egp", amount: "100.00", currency: CurrencyCode.EGP })],
          totalCount: 1,
        },
      ];

      const report = await readReport();

      const paymentsByInstance = new Map(report.paymentsPage.rows.map(row => [row.instanceId, row]));
      expect(paymentsByInstance.get("i-sar")?.convertedAmount).toBe("100.00");
      expect(paymentsByInstance.get("i-usd")?.convertedAmount).toBe("150.00");
      expect(paymentsByInstance.get("i-egp-excluded")?.convertedAmount).toBeNull();
      expect(paymentsByInstance.get("i-usd-2")?.convertedAmount).toBe("225.00");

      expect(report.paymentsPage.aggregate.totalPayments).toBe("475.00");
      expect(report.paymentsPage.aggregate.dominantCurrency).toBe(CurrencyCode.USD);
      expect(report.paymentsPage.aggregate.excludedRowCount).toBe(1);

      expect(report.expensesPage.rows[0]?.convertedAmount).toBe("75.00");
      expect(report.expensesPage.aggregate.totalExpenses).toBe("75.00");

      expect(report.incomePaymentsPage.rows[0]?.convertedAmount).toBeNull();
      expect(report.incomePaymentsPage.aggregate.totalIncomePayments).toBe("0.00");
      expect(report.incomePaymentsPage.aggregate.excludedRowCount).toBe(1);
    });
  });

  describe("missing FX rate", () => {
    test("populates fxWarnings grouped by currency pair and excludes rows from aggregates", async () => {
      queuedPaymentPages = [
        {
          rows: [
            buildPaymentRepoRow({
              instanceId: "i-1",
              teacherPaidAmount: "10.00",
              teacherPaidCurrency: CurrencyCode.USD,
            }),
            buildPaymentRepoRow({
              instanceId: "i-2",
              teacherPaidAmount: "20.00",
              teacherPaidCurrency: CurrencyCode.USD,
            }),
          ],
          totalCount: 2,
        },
      ];
      queuedExpensePages = [
        {
          rows: [buildExpenseRepoRow({ id: "e-1", expenseValue: "5.00", expenseCurrency: CurrencyCode.EGP })],
          totalCount: 1,
        },
      ];
      queuedIncomePages = [{ rows: [], totalCount: 0 }];

      const report = await readReport();

      expect(report.fxWarnings).toEqual([
        { originalCurrency: CurrencyCode.USD, targetCurrency: CurrencyCode.SAR, rowCount: 2 },
        { originalCurrency: CurrencyCode.EGP, targetCurrency: CurrencyCode.SAR, rowCount: 1 },
      ]);
      expect(report.paymentsPage.aggregate.totalPayments).toBe("0.00");
      expect(report.paymentsPage.aggregate.excludedRowCount).toBe(2);
      expect(report.expensesPage.aggregate.totalExpenses).toBe("0.00");
      expect(report.expensesPage.aggregate.excludedRowCount).toBe(1);
    });
  });

  describe("tab read scope (forwarded to the repositories)", () => {
    test("forwards the accounting month for the expenses page so soft-deleted rows never surface", async () => {
      queuedExpensePages = [{ rows: [buildExpenseRepoRow({ id: "e-alive" })], totalCount: 1 }];

      const report = await readReport();

      expect(expensePageCalls).toEqual([{ month: MONTH, limit: 50, offset: 0 }]);
      expect(report.expensesPage.rows).toHaveLength(1);
      expect(report.expensesPage.rows[0]?.id).toBe("e-alive");
    });

    test("forwards the accounting month for the payments page so NOT_CALCULATED sessions never surface", async () => {
      queuedPaymentPages = [
        {
          rows: [buildPaymentRepoRow({ instanceId: "i-calculated", calculationStatus: CalculationStatus.CALCULATED })],
          totalCount: 1,
        },
      ];

      const report = await readReport();

      expect(paymentPageCalls).toEqual([{ month: MONTH, limit: 50, offset: 0 }]);
      expect(report.paymentsPage.rows).toHaveLength(1);
      expect(report.paymentsPage.rows[0]?.calculationStatus).toBe(CalculationStatus.CALCULATED);
    });
  });

  describe("manual subtract credits", () => {
    test("sums the subtract credits into the payments total and stamps them per row", async () => {
      fxRatesByPair.set(`${CurrencyCode.USD}->${CurrencyCode.SAR}`, { rate: "3.75", stale: false });
      queuedPaymentPages = [
        {
          rows: [
            buildPaymentRepoRow({ instanceId: "i-1", teacherPaidAmount: "100.00" }),
            buildPaymentRepoRow({
              instanceId: "i-2",
              teacherPaidAmount: "40.00",
              teacherPaidCurrency: CurrencyCode.USD,
            }),
            buildPaymentRepoRow({ instanceId: "i-3", teacherPaidAmount: "60.00" }),
          ],
          totalCount: 3,
        },
      ];
      subtractCreditsByInstance = new Map([
        ["i-1", { amount: 3, currency: null }],
        ["i-3", { amount: 2, currency: null }],
      ]);

      const report = await readReport();

      expect(subtractCreditsCalls).toEqual([{ instanceIds: ["i-1", "i-2", "i-3"] }]);

      const byInstance = new Map(report.paymentsPage.rows.map(row => [row.instanceId, row]));
      expect(byInstance.get("i-1")?.manualSubtractCredits).toBe("3");
      expect(byInstance.get("i-1")?.manualSubtractCreditsCurrency).toBeNull();
      expect(byInstance.get("i-2")?.manualSubtractCredits).toBeNull();
      expect(byInstance.get("i-3")?.manualSubtractCredits).toBe("2");

      expect(report.paymentsPage.aggregate.totalPayments).toBe("315.00");
    });

    test("an FX-excluded session contributes neither its payout nor its subtract credits to the total", async () => {
      queuedPaymentPages = [
        {
          rows: [
            buildPaymentRepoRow({ instanceId: "i-ok", teacherPaidAmount: "100.00" }),
            buildPaymentRepoRow({
              instanceId: "i-excluded",
              teacherPaidAmount: "40.00",
              teacherPaidCurrency: CurrencyCode.USD,
            }),
          ],
          totalCount: 2,
        },
      ];
      subtractCreditsByInstance = new Map([["i-excluded", { amount: 5, currency: null }]]);

      const report = await readReport();

      const byInstance = new Map(report.paymentsPage.rows.map(row => [row.instanceId, row]));
      // The credits still stamp onto the row for transparency ...
      expect(byInstance.get("i-excluded")?.manualSubtractCredits).toBe("5");
      expect(byInstance.get("i-excluded")?.convertedAmount).toBeNull();
      // ... but skip the total while the row stays FX-excluded.
      expect(report.paymentsPage.aggregate.totalPayments).toBe("100.00");
      expect(report.paymentsPage.aggregate.excludedRowCount).toBe(1);
    });
  });

  describe("net profit margin", () => {
    test("is negative when expenses exceed payments", async () => {
      queuedPaymentPages = [
        { rows: [buildPaymentRepoRow({ instanceId: "i-1", teacherPaidAmount: "100.00" })], totalCount: 1 },
      ];
      queuedExpensePages = [{ rows: [buildExpenseRepoRow({ id: "e-1", expenseValue: "250.00" })], totalCount: 1 }];
      queuedIncomePages = [{ rows: [], totalCount: 0 }];

      const report = await readReport();

      expect(report.profitsSummary.netProfit).toBe("-150.00");
      expect(report.profitsSummary.netProfitMargin).toBe("-150.0");
    });

    test("is null when the payments base is zero", async () => {
      queuedPaymentPages = [{ rows: [], totalCount: 0 }];
      queuedExpensePages = [{ rows: [buildExpenseRepoRow({ id: "e-1", expenseValue: "50.00" })], totalCount: 1 }];
      queuedIncomePages = [{ rows: [], totalCount: 0 }];

      const report = await readReport();

      expect(report.profitsSummary.netProfit).toBe("-50.00");
      expect(report.profitsSummary.netProfitMargin).toBeNull();
    });
  });
});
