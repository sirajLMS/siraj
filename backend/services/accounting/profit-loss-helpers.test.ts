import { beforeEach, describe, expect, mock, test } from "bun:test";
import { ExpenseType } from "@/backend/enum";
import { DomainError } from "@/backend/lib";
import type {
  ProfitLossExpensesPage,
  ProfitLossIncomePage,
  ProfitLossPaymentsPage,
  ProfitLossSummary,
} from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";

// ---------------------------------------------------------------------------
// FX rate mocks — registered before the helpers module is imported.
// ---------------------------------------------------------------------------

interface FxRateSnapshot {
  rate: string | null;
  stale: boolean;
}

const fxRatesByPair = new Map<string, FxRateSnapshot>();
const fxRateCalls: string[] = [];

const fxRateMock = mock(async (from: CurrencyCode, to: CurrencyCode): Promise<FxRateSnapshot> => {
  fxRateCalls.push(`${from}->${to}`);
  return fxRatesByPair.get(`${from}->${to}`) ?? { rate: null, stale: false };
});

await mock.module("@/backend/db/repo/billing", () => ({
  BillingRepository: { getLatestExchangeRateForDisplay: fxRateMock },
}));

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first).
// ---------------------------------------------------------------------------

type ProfitLossHelpersModule = typeof import("@/backend/services/accounting/profit-loss-helpers");
const helpers: ProfitLossHelpersModule = await import("@/backend/services/accounting/profit-loss-helpers");

const {
  aggregateWithFx,
  collectFxWarnings,
  composeProfitsSummary,
  convertCurrency,
  validateMonth,
  validatePagination,
} = helpers;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const MONTH_INVALID_MESSAGE = "Month must be in YYYY-MM format.";
const PAGINATION_INVALID_MESSAGE = "Page size and offset must be positive numbers within the allowed range.";

/** Full P&L labels stub — only `error.monthInvalid` is actually read by validateMonth. */
function buildProfitLossLabelsStub(): ProfitLossLabels {
  return {
    title: "Profit & Loss",
    filter: { month: "Month", currency: "Currency" },
    fx: {
      chip: count => `${count} rows excluded (FX rate missing)`,
      tooltip: pairs => `Excluded pairs: ${pairs}`,
    },
    tab: { payments: "Payments", expenses: "Expenses", incomePayments: "Income Payments", profits: "Profits" },
    column: {
      scheduledStart: "Scheduled start",
      calculationStatus: "Calculation status",
      teacher: "Teacher",
      student: "Student",
      subject: "Subject",
      duration: "Duration (min)",
      studentPaidAmount: "Student paid",
      manualSubtractCredits: "Subtract credits",
      title: "Title",
      type: "Type",
      value: "Value",
      paymentDate: "Payment date",
      paymentMethod: "Payment method",
      parentName: "Parent",
      packageName: "Package",
      invoiceId: "Invoice",
      source: "Source",
    },
    aggregate: {
      totalPayments: "Total Payments",
      totalExpenses: "Total Expenses",
      totalIncomePayments: "Total Income Payments",
      netProfit: "Net Profit",
      netProfitMargin: "Net Profit Margin",
      dominantCurrency: "Dominant currency",
      excludedRows: count => `${count} rows excluded (FX rate missing)`,
    },
    action: { exportCsv: "Export CSV" },
    status: { positive: "Profit", negative: "Loss", breakeven: "Break-even" },
    empty: { title: "No data for this month", description: "Try a different month or check back later." },
    error: { monthInvalid: MONTH_INVALID_MESSAGE, paginationInvalid: PAGINATION_INVALID_MESSAGE },
  };
}

const tErrors = buildProfitLossLabelsStub();

function buildPaymentsAggregate(
  overrides: Partial<ProfitLossPaymentsPage["aggregate"]> = {}
): ProfitLossPaymentsPage["aggregate"] {
  return {
    totalPayments: "0.00",
    totalOriginalCurrency: "0.00",
    dominantCurrency: CurrencyCode.SAR,
    excludedRowCount: 0,
    ...overrides,
  };
}

function buildExpensesAggregate(
  overrides: Partial<ProfitLossExpensesPage["aggregate"]> = {}
): ProfitLossExpensesPage["aggregate"] {
  return {
    totalExpenses: "0.00",
    dominantCurrency: CurrencyCode.SAR,
    excludedRowCount: 0,
    rowCountByType: {
      [ExpenseType.SALARIES]: 0,
      [ExpenseType.MARKETING]: 0,
      [ExpenseType.LOGISTICS]: 0,
      [ExpenseType.TECHNOLOGY]: 0,
    },
    ...overrides,
  };
}

function buildIncomeAggregate(
  overrides: Partial<ProfitLossIncomePage["aggregate"]> = {}
): ProfitLossIncomePage["aggregate"] {
  return {
    totalIncomePayments: "0.00",
    dominantCurrency: CurrencyCode.SAR,
    excludedRowCount: 0,
    ...overrides,
  };
}

interface AmountRow {
  amount: string;
  currency: CurrencyCode;
}

function buildAmountRow(currency: CurrencyCode, amount: string): AmountRow {
  return { amount, currency };
}

/** Standard aggregation into USD with the row's own amount/currency accessors. */
async function aggregateAmountRows(rows: readonly AmountRow[]) {
  return aggregateWithFx(
    rows,
    row => row.amount,
    row => row.currency,
    CurrencyCode.USD
  );
}

/** Standard summary from the three tab totals. */
function composeSummaryWith(
  currency: CurrencyCode,
  paymentsTotal: string,
  expensesTotal: string,
  incomeTotal: string
): ProfitLossSummary {
  return composeProfitsSummary(
    currency,
    buildPaymentsAggregate({ totalPayments: paymentsTotal }),
    buildExpensesAggregate({ totalExpenses: expensesTotal }),
    buildIncomeAggregate({ totalIncomePayments: incomeTotal })
  );
}

function expectDomainError(validate: () => void, code: string, message?: string): void {
  let caught: unknown = null;
  try {
    validate();
  } catch (error) {
    caught = error;
  }
  expect(caught).not.toBeNull();
  if (!(caught instanceof DomainError)) {
    throw new Error(`expected a DomainError but got ${String(caught)}`);
  }
  expect(caught.code).toBe(code);
  if (message !== undefined) {
    expect(caught.message).toBe(message);
  }
}

beforeEach(() => {
  fxRatesByPair.clear();
  fxRateCalls.length = 0;
});

describe("convertCurrency", () => {
  test("converts through the latest FX rate", async () => {
    fxRatesByPair.set(`${CurrencyCode.EGP}->${CurrencyCode.USD}`, { rate: "0.5", stale: false });
    expect(await convertCurrency("100.00", CurrencyCode.EGP, CurrencyCode.USD)).toBe("50.00");
    expect(fxRateCalls).toEqual([`${CurrencyCode.EGP}->${CurrencyCode.USD}`]);
  });

  test("passes same-currency amounts through without a rate lookup", async () => {
    expect(await convertCurrency("100.00", CurrencyCode.USD, CurrencyCode.USD)).toBe("100.00");
    expect(fxRateCalls).toEqual([]);
  });

  test("returns null when the rate is missing", async () => {
    expect(await convertCurrency("100.00", CurrencyCode.EGP, CurrencyCode.USD)).toBeNull();
    expect(fxRateCalls).toHaveLength(1);
  });

  test("returns null when the rate is stale", async () => {
    fxRatesByPair.set(`${CurrencyCode.EGP}->${CurrencyCode.USD}`, { rate: "0.5", stale: true });
    expect(await convertCurrency("100.00", CurrencyCode.EGP, CurrencyCode.USD)).toBeNull();
  });

  test("renders unparseable amounts as zero", async () => {
    expect(await convertCurrency("not-a-number", CurrencyCode.USD, CurrencyCode.USD)).toBe("0");
  });

  test("normalizes same-currency amounts to two decimals", async () => {
    expect(await convertCurrency("1.5", CurrencyCode.SAR, CurrencyCode.SAR)).toBe("1.50");
  });
});

describe("aggregateWithFx", () => {
  test("sums converted amounts and counts FX-missing rows", async () => {
    fxRatesByPair.set(`${CurrencyCode.EGP}->${CurrencyCode.USD}`, { rate: "0.5", stale: false });
    const rows = [
      buildAmountRow(CurrencyCode.EGP, "100.00"),
      buildAmountRow(CurrencyCode.EGP, "50.00"),
      buildAmountRow(CurrencyCode.SAR, "30.00"),
    ];
    const result = await aggregateAmountRows(rows);
    expect(result.sum).toBe("75.00");
    expect(result.excludedRowCount).toBe(1);
    expect(result.dominantCurrency).toBe(CurrencyCode.EGP);
  });

  test("picks the most frequent source currency among included rows", async () => {
    fxRatesByPair.set(`${CurrencyCode.EGP}->${CurrencyCode.USD}`, { rate: "0.5", stale: false });
    const rows = [
      buildAmountRow(CurrencyCode.USD, "10.00"),
      buildAmountRow(CurrencyCode.EGP, "20.00"),
      buildAmountRow(CurrencyCode.EGP, "30.00"),
    ];
    const result = await aggregateAmountRows(rows);
    expect(result.dominantCurrency).toBe(CurrencyCode.EGP);
  });

  test("ties resolve to the currency that reached the leading count first", async () => {
    fxRatesByPair.set(`${CurrencyCode.EGP}->${CurrencyCode.USD}`, { rate: "0.5", stale: false });
    const rows = [buildAmountRow(CurrencyCode.USD, "10.00"), buildAmountRow(CurrencyCode.EGP, "20.00")];
    const result = await aggregateAmountRows(rows);
    expect(result.dominantCurrency).toBe(CurrencyCode.USD);
  });

  test("does not count excluded rows toward the dominant currency", async () => {
    fxRatesByPair.set(`${CurrencyCode.EGP}->${CurrencyCode.USD}`, { rate: "0.5", stale: false });
    const rows = [
      buildAmountRow(CurrencyCode.SAR, "10.00"),
      buildAmountRow(CurrencyCode.SAR, "20.00"),
      buildAmountRow(CurrencyCode.SAR, "30.00"),
      buildAmountRow(CurrencyCode.EGP, "20.00"),
    ];
    const result = await aggregateAmountRows(rows);
    expect(result.dominantCurrency).toBe(CurrencyCode.EGP);
    expect(result.excludedRowCount).toBe(3);
  });

  test("falls back to the default currency when every row is excluded", async () => {
    const rows = [buildAmountRow(CurrencyCode.SAR, "10.00"), buildAmountRow(CurrencyCode.EGP, "20.00")];
    const result = await aggregateAmountRows(rows);
    expect(result.sum).toBe("0.00");
    expect(result.excludedRowCount).toBe(2);
    expect(result.dominantCurrency).toBe(CurrencyCode.SAR);
  });

  test("aggregates an empty page to zero with the default currency", async () => {
    const result = await aggregateAmountRows([]);
    expect(result.sum).toBe("0.00");
    expect(result.excludedRowCount).toBe(0);
    expect(result.dominantCurrency).toBe(CurrencyCode.SAR);
  });
});

describe("collectFxWarnings", () => {
  test("groups excluded rows by currency pair with counts", () => {
    const warnings = collectFxWarnings(
      [
        [
          { originalCurrency: CurrencyCode.EGP, convertedAmount: null },
          { originalCurrency: CurrencyCode.EGP, convertedAmount: null },
        ],
        [{ originalCurrency: CurrencyCode.SAR, convertedAmount: "10.00" }],
      ],
      CurrencyCode.USD
    );
    expect(warnings).toEqual([{ originalCurrency: CurrencyCode.EGP, targetCurrency: CurrencyCode.USD, rowCount: 2 }]);
  });

  test("returns one warning per currency pair", () => {
    const warnings = collectFxWarnings(
      [
        [{ originalCurrency: CurrencyCode.EGP, convertedAmount: null }],
        [
          { originalCurrency: CurrencyCode.SAR, convertedAmount: null },
          { originalCurrency: CurrencyCode.SAR, convertedAmount: null },
        ],
      ],
      CurrencyCode.USD
    );
    expect(warnings).toEqual([
      { originalCurrency: CurrencyCode.EGP, targetCurrency: CurrencyCode.USD, rowCount: 1 },
      { originalCurrency: CurrencyCode.SAR, targetCurrency: CurrencyCode.USD, rowCount: 2 },
    ]);
  });

  test("returns an empty array when no rows are excluded", () => {
    const warnings = collectFxWarnings(
      [
        [{ originalCurrency: CurrencyCode.EGP, convertedAmount: "10.00" }],
        [{ originalCurrency: CurrencyCode.SAR, convertedAmount: null }],
      ],
      CurrencyCode.USD
    );
    expect(warnings).toEqual([{ originalCurrency: CurrencyCode.SAR, targetCurrency: CurrencyCode.USD, rowCount: 1 }]);
  });

  test("returns an empty array for an empty group set", () => {
    expect(collectFxWarnings([], CurrencyCode.USD)).toEqual([]);
  });
});

describe("composeProfitsSummary", () => {
  test("computes net profit and margin with one-decimal percentage", () => {
    const summary = composeSummaryWith(CurrencyCode.USD, "1000.00", "250.00", "300.00");
    expect(summary.totalPayments).toBe("1000.00");
    expect(summary.totalExpenses).toBe("250.00");
    expect(summary.totalIncomePayments).toBe("300.00");
    expect(summary.netProfit).toBe("750.00");
    expect(summary.netProfitMargin).toBe("75.0");
    expect(summary.currency).toBe(CurrencyCode.USD);
  });

  test("computes a negative net profit in red-sign territory", () => {
    const summary = composeSummaryWith(CurrencyCode.USD, "100.00", "250.00", "0.00");
    expect(summary.netProfit).toBe("-150.00");
    expect(summary.netProfitMargin).toBe("-150.0");
  });

  test("returns a null margin when total payments are zero", () => {
    const summary = composeSummaryWith(CurrencyCode.USD, "0.00", "40.00", "0.00");
    expect(summary.netProfit).toBe("-40.00");
    expect(summary.netProfitMargin).toBeNull();
  });

  test("formats all values as two-decimal strings", () => {
    const summary = composeSummaryWith(CurrencyCode.SAR, "100", "0", "300");
    expect(summary.totalPayments).toBe("100.00");
    expect(summary.totalExpenses).toBe("0.00");
    expect(summary.totalIncomePayments).toBe("300.00");
    expect(summary.netProfit).toBe("100.00");
    expect(summary.netProfitMargin).toBe("100.0");
  });
});

describe("validateMonth", () => {
  test("accepts well-shaped real months", () => {
    expect(() => validateMonth("2024-01", tErrors)).not.toThrow();
    expect(() => validateMonth("2026-12", tErrors)).not.toThrow();
  });

  test("rejects a single-digit month", () => {
    expectDomainError(() => validateMonth("2024-1", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects an out-of-range month", () => {
    expectDomainError(() => validateMonth("2024-13", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects a SQL wildcard pattern", () => {
    expectDomainError(() => validateMonth("%", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects a regex pattern", () => {
    expectDomainError(() => validateMonth(".*", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects an empty month", () => {
    expectDomainError(() => validateMonth("", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects a full date string", () => {
    expectDomainError(() => validateMonth("2024-01-15", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects month 00 (passes the shape pattern, fails the calendar-range check)", () => {
    expectDomainError(() => validateMonth("2024-00", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });

  test("rejects injection attempts that survive trimming", () => {
    expectDomainError(() => validateMonth("2024-01; DROP TABLE", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
    expectDomainError(() => validateMonth("____-__", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
    // Wildcard/regex metacharacters: the month feeds a to_char comparison and
    // a LIKE-adjacent filter, so any pattern character must be rejected.
    expectDomainError(() => validateMonth("2024-%1", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
    expectDomainError(() => validateMonth("20.*-01", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
    expectDomainError(() => validateMonth("2024-1_", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
    expectDomainError(() => validateMonth("2024-13", tErrors), "MONTH_INVALID", MONTH_INVALID_MESSAGE);
  });
});

describe("validatePagination", () => {
  test("accepts omitted pagination (defaults apply downstream)", () => {
    expect(() => validatePagination({}, tErrors)).not.toThrow();
  });

  test("accepts the boundary limit of 200 and a zero offset", () => {
    expect(() =>
      validatePagination(
        { paymentsLimit: 200, paymentsOffset: 0, expensesLimit: 200, incomePaymentsLimit: 200 },
        tErrors
      )
    ).not.toThrow();
  });

  test("accepts every per-tab knob independently", () => {
    expect(() =>
      validatePagination(
        {
          paymentsLimit: 50,
          paymentsOffset: 100,
          expensesLimit: 25,
          expensesOffset: 75,
          incomePaymentsLimit: 1,
          incomePaymentsOffset: 500,
        },
        tErrors
      )
    ).not.toThrow();
  });

  test("rejects negative offsets on any tab", () => {
    for (const offset of [{ paymentsOffset: -1 }, { expensesOffset: -10 }, { incomePaymentsOffset: -0.5 }]) {
      expectDomainError(() => validatePagination(offset, tErrors), "PAGINATION_INVALID", PAGINATION_INVALID_MESSAGE);
    }
  });

  test("rejects zero and negative limits", () => {
    for (const limit of [{ paymentsLimit: 0 }, { expensesLimit: -1 }]) {
      expectDomainError(() => validatePagination(limit, tErrors), "PAGINATION_INVALID", PAGINATION_INVALID_MESSAGE);
    }
  });

  test("rejects oversized limits beyond the page ceiling", () => {
    for (const limit of [
      { paymentsLimit: 501 },
      { expensesLimit: 1_000_000 },
      { incomePaymentsLimit: Number.MAX_SAFE_INTEGER },
    ]) {
      expectDomainError(() => validatePagination(limit, tErrors), "PAGINATION_INVALID", PAGINATION_INVALID_MESSAGE);
    }
  });

  test("rejects non-integer limits and offsets", () => {
    for (const value of [{ paymentsLimit: 10.5 }, { paymentsOffset: 2.5 }]) {
      expectDomainError(() => validatePagination(value, tErrors), "PAGINATION_INVALID", PAGINATION_INVALID_MESSAGE);
    }
  });

  test("rejects NaN and Infinity abuse values", () => {
    for (const value of [{ paymentsLimit: Number.NaN }, { paymentsOffset: Number.POSITIVE_INFINITY }]) {
      expectDomainError(() => validatePagination(value, tErrors), "PAGINATION_INVALID", PAGINATION_INVALID_MESSAGE);
    }
  });
});
