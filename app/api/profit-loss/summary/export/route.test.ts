import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

import { ExpenseType } from "@/backend/enum";
import type { ProfitLossInput, ProfitLossPagination, ProfitLossReport } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";
import type { ProfitLossLabels } from "@/shared/locale/types/dashboard/accounting";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "550e8400-e29b-41d4-a716-446655440001";
const EXPORT_URL = "http://localhost:3000/api/profit-loss/summary/export";
const MONTH = "2026-08";

function buildReport(overrides: Partial<ProfitLossReport> = {}): ProfitLossReport {
  return {
    month: MONTH,
    currency: CurrencyCode.SAR,
    paymentsPage: {
      rows: [],
      totalCount: 0,
      aggregate: {
        totalPayments: "110.00",
        totalOriginalCurrency: "110.00",
        dominantCurrency: CurrencyCode.SAR,
        excludedRowCount: 0,
      },
    },
    expensesPage: {
      rows: [],
      totalCount: 0,
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
      rows: [],
      totalCount: 0,
      aggregate: {
        totalIncomePayments: "250.00",
        dominantCurrency: CurrencyCode.SAR,
        excludedRowCount: 0,
      },
    },
    profitsSummary: {
      totalIncomePayments: "250.00",
      totalPayments: "110.00",
      totalExpenses: "50.00",
      netProfit: "90.00",
      netProfitMargin: "36.0",
      currency: CurrencyCode.SAR,
    },
    fxWarnings: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the route module is imported. The route reads
// everything from the `@/backend/lib` / `@/backend/services` barrels, so the
// barrel-level mocks replace them for the route under test. The CSV helpers
// are passed through to the real implementations so response-body assertions
// exercise the production escaping and column contract.
// ---------------------------------------------------------------------------

class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}
class ForbiddenError extends DomainError {}
class ValidationError extends DomainError {
  constructor(codeOrMessage: string, messageOrOptions?: string) {
    super(typeof messageOrOptions === "string" ? codeOrMessage : "VALIDATION", messageOrOptions ?? codeOrMessage);
  }
}

const getServerUserContextMock = mock(async (): Promise<{ userId: string | null }> => ({ userId: USER_ID }));

const getReportMock = mock(
  async (
    _actorUserId: string,
    _input: ProfitLossInput,
    _pagination: ProfitLossPagination,
    _tErrors: ErrorsLabels,
    _tLabels: ProfitLossLabels
  ): Promise<ProfitLossReport> => buildReport()
);

const checkRateLimitMock = mock(async () => ({
  success: true,
  limit: 10,
  remaining: 9,
  reset: Date.now() + 600_000,
}));

await mock.module("@/backend/lib/ratelimit", () => ({
  checkRateLimit: checkRateLimitMock,
  exportRateLimiter: {},
  storageUploadRateLimiter: {},
  apiRateLimiter: {},
  graphqlRateLimiter: {},
  authRateLimiter: {},
  clientLogsRateLimiter: {},
  getClientIdentifier: (request: Request) => request.headers.get("x-forwarded-for") ?? "test-ip",
}));

await mock.module("@/backend/lib", () => ({
  DomainError,
  ForbiddenError,
  ValidationError,
  getServerUserContext: getServerUserContextMock,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("@/backend/services", async () => {
  const serializer = await import("@/backend/services/accounting/profit-loss-csv.serializer");
  return {
    ProfitLossService: { getReport: getReportMock },
    buildProfitLossCsvHeaders: serializer.buildProfitLossCsvHeaders,
    isProfitLossExportTruncated: serializer.isProfitLossExportTruncated,
    parseProfitLossExportInput: serializer.parseProfitLossExportInput,
    PROFIT_LOSS_EXPORT_ROW_LIMIT: serializer.PROFIT_LOSS_EXPORT_ROW_LIMIT,
    serializeProfitLossSummaryCsv: serializer.serializeProfitLossSummaryCsv,
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function importRoute(): Promise<{ GET: (request: NextRequest) => Promise<Response> }> {
  return import("./route");
}

function makeExportRequest(queryString: string): NextRequest {
  const headers = new Headers();
  headers.set("accept-language", "en");
  return new NextRequest(`${EXPORT_URL}${queryString}`, { method: "GET", headers });
}

async function callExport(queryString = `?month=${MONTH}&currency=SAR`): Promise<Response> {
  const { GET } = await importRoute();
  return GET(makeExportRequest(queryString));
}

function isErrorBody(value: unknown): value is { error: unknown } {
  return typeof value === "object" && value !== null && "error" in value;
}

async function readErrorBody(response: Response): Promise<unknown> {
  const body: unknown = await response.json();
  return isErrorBody(body) ? body.error : undefined;
}

/** English label bundle — mirrors what the route passes for the summary metric names. */
function summaryLabels(): ProfitLossLabels["aggregate"] {
  return getServerTranslations("en").dashboardTranslations.accountingProfitLoss.aggregate;
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  getReportMock.mockClear();
  checkRateLimitMock.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/profit-loss/summary/export", () => {
  describe("authentication and permission gate", () => {
    test("returns 401 and never reads the report when no authenticated user", async () => {
      getServerUserContextMock.mockResolvedValueOnce({ userId: null });

      const response = await callExport();

      expect(response.status).toBe(401);
      expect(await readErrorBody(response)).toBe("You must be logged in first.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 403 with the localized message when the permission gate rejects", async () => {
      getReportMock.mockImplementationOnce(async () => {
        throw new ForbiddenError("FORBIDDEN", "insufficient permissions");
      });

      const response = await callExport();

      expect(response.status).toBe(403);
      expect(await readErrorBody(response)).toBe("You do not have sufficient permissions to perform this action.");
      expect(getReportMock).toHaveBeenCalledTimes(1);
    });

    test("returns 429 and never reads the report when the export rate limit is exceeded", async () => {
      checkRateLimitMock.mockResolvedValueOnce({ success: false, limit: 10, remaining: 0, reset: Date.now() + 60_000 });

      const response = await callExport();

      expect(response.status).toBe(429);
      expect(await readErrorBody(response)).toBe("Too many requests. Please try again later.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("happy path", () => {
    test("returns a CSV file with the four summary lines plus margin", async () => {
      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toBe(
        `attachment; filename="profit-loss-summary-${MONTH}.csv"`
      );
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
      expect(response.headers.get("X-Export-Truncated")).toBe("false");

      expect(getReportMock).toHaveBeenCalledTimes(1);
      expect(getReportMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual({ month: MONTH, currency: CurrencyCode.SAR });
      expect(getReportMock.mock.calls[0]?.[2]).toEqual({});

      const labels = summaryLabels();
      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[0]).toBe("metric,value,currency");
      expect(bodyLines[1]).toBe(`${labels.totalIncomePayments},250.00,${CurrencyCode.SAR}`);
      expect(bodyLines[2]).toBe(`${labels.totalPayments},110.00,${CurrencyCode.SAR}`);
      expect(bodyLines[3]).toBe(`${labels.totalExpenses},50.00,${CurrencyCode.SAR}`);
      expect(bodyLines[4]).toBe(`${labels.netProfit},90.00,${CurrencyCode.SAR}`);
      expect(bodyLines[5]).toBe(`${labels.netProfitMargin},36.0,`);
      expect(bodyLines[6]).toBe("");
    });

    test("renders an empty margin cell when the month has no income base", async () => {
      const report = buildReport();
      report.profitsSummary.netProfitMargin = null;
      getReportMock.mockResolvedValueOnce(report);

      const response = await callExport();

      expect(response.status).toBe(200);
      const labels = summaryLabels();
      const body = await response.text();
      expect(body).toContain(`${labels.netProfitMargin},,`);
    });
  });

  describe("input validation", () => {
    test("returns 400 when the month param is missing or blank", async () => {
      const missing = await callExport("?currency=SAR");
      expect(missing.status).toBe(400);
      expect(await readErrorBody(missing)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for an unsupported currency code", async () => {
      const response = await callExport(`?month=${MONTH}&currency=XYZ`);

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 with the localized month message when the service rejects the month shape", async () => {
      getReportMock.mockImplementationOnce(async () => {
        throw new ValidationError("MONTH_INVALID", "Month must be in YYYY-MM format.");
      });

      const response = await callExport("?month=2026-13&currency=SAR");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Month must be in YYYY-MM format.");
    });

    test.each(["%25", "%25%25", "2024-1", "%2e%2a", "2026-00", "abcdefghijklmnopqrstuvwxyz"])(
      "returns 400 for the wildcard or malformed month shape %s via the service month guard",
      async rawMonth => {
        getReportMock.mockImplementationOnce(async () => {
          throw new ValidationError("MONTH_INVALID", "Month must be in YYYY-MM format.");
        });

        const response = await callExport(`?month=${rawMonth}&currency=SAR`);

        expect(response.status).toBe(400);
        expect(await readErrorBody(response)).toBe("Month must be in YYYY-MM format.");
        expect(getReportMock).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe("CSV hardening", () => {
    test("neutralizes formula-prefixed summary metric labels", async () => {
      const report = buildReport();
      report.profitsSummary.totalIncomePayments = "=SUM(A1:A9)";
      getReportMock.mockResolvedValueOnce(report);

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("'=SUM(A1:A9)");
      expect(body).not.toContain(",=SUM(A1:A9)");
    });

    test("neutralizes the remaining OWASP formula prefixes (+, -, tab, CR) per cell", async () => {
      const report = buildReport();
      report.profitsSummary.totalIncomePayments = "+SUM(A1:A9)";
      report.profitsSummary.netProfit = "-2+5|cmd";
      report.profitsSummary.netProfitMargin = "\r=cmd";
      report.profitsSummary.totalPayments = '4"5';
      getReportMock.mockResolvedValueOnce(report);

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("'+SUM(A1:A9)");
      expect(body).toContain("'-2+5|cmd");
      expect(body).toContain('"\'\r=cmd"');
      expect(body).toContain('"4""5"');
      expect(body).not.toContain(",+SUM(A1:A9)");
      expect(body).not.toContain(",-2+5|cmd");
    });
  });

  describe("server errors", () => {
    test("returns 500 when the report read fails", async () => {
      getReportMock.mockRejectedValueOnce(new Error("db down"));

      const response = await callExport();

      expect(response.status).toBe(500);
      expect(await readErrorBody(response)).toBe("An unexpected error occurred. Please try again later.");
    });
  });
});
