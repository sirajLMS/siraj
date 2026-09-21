import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

import { AppPermission, ExpenseType } from "@/backend/enum";
import type { ExpenseFilters, ExpensePage, ExpenseRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const EXPENSE_ID = "df2ecf5f-d5b2-45eb-b2c4-93a2a462cc0e";
const TEACHER_ID = "55ad3ab2-71c4-4af2-9b68-7d0e1f2a3b4c";
const EXPORT_URL = "http://localhost:3000/api/expenses/export";
const EXPORT_ROW_LIMIT = 10_000;

const EXPECTED_CSV_HEADER =
  "id,teacherId,teacherName,title,type,expenseValue,expenseCurrency,paymentDate,expenseDate,note,sourceEntity," +
  "sourceEntityId,createdByUserId,createdByName,deletedAt,deletedByUserId,deletedReason,createdAt,updatedAt";

function buildExpenseRow(overrides: Partial<ExpenseRow> = {}): ExpenseRow {
  return {
    id: EXPENSE_ID,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    title: "Office rent August",
    type: ExpenseType.LOGISTICS,
    expenseValue: "1200.00",
    expenseCurrency: CurrencyCode.SAR,
    paymentDate: "2026-08-05",
    expenseDate: "2026-08",
    note: null,
    sourceEntity: null,
    sourceEntityId: null,
    createdByUserId: USER_ID,
    createdByName: "Admin User",
    deletedAt: null,
    deletedByUserId: null,
    deletedReason: null,
    createdAt: "2026-08-05T09:00:00.000Z",
    updatedAt: "2026-08-05T09:00:00.000Z",
    ...overrides,
  };
}

function buildExpensePage(rows: readonly ExpenseRow[], totalCount = rows.length): ExpensePage {
  return {
    rows: [...rows],
    totalCount,
    aggregates: {
      totalValue: "1200.00",
      dominantCurrency: CurrencyCode.SAR,
      rowCountByType: {
        [ExpenseType.SALARIES]: 0,
        [ExpenseType.MARKETING]: 0,
        [ExpenseType.LOGISTICS]: rows.length,
        [ExpenseType.TECHNOLOGY]: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the route module is imported. The route reads
// everything from the `@/backend/lib` / `@/backend/services` barrels, so the
// barrel-level mocks replace them for the route under test. The CSV
// serializer runs inline inside the route, so response-body assertions
// exercise the production escaping and column contract.
// ---------------------------------------------------------------------------

class ForbiddenError extends Error {}
class ValidationError extends Error {}

const getServerUserContextMock = mock(async (): Promise<{ userId: string | null }> => ({ userId: USER_ID }));

const requirePermissionMock = mock(
  async (_actorUserId: string, _permission: AppPermission, _tErrors: ErrorsLabels): Promise<void> => {}
);

let manageAllowed = true;

const hasPermissionMock = mock(async (_userId: string, _permission: AppPermission): Promise<boolean> => manageAllowed);

const getReportMock = mock(
  async (
    _actorUserId: string,
    _filters: ExpenseFilters,
    _pagination: { limit: number; offset: number },
    _tErrors: ErrorsLabels
  ): Promise<ExpensePage> => buildExpensePage([buildExpenseRow()])
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
  ForbiddenError,
  ValidationError,
  getServerUserContext: getServerUserContextMock,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("@/backend/services", () => ({
  ExpenseService: { getReport: getReportMock },
  PermissionsService: { hasPermission: hasPermissionMock },
  requirePermission: requirePermissionMock,
}));

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

async function callExport(queryString = ""): Promise<Response> {
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

function expectedHappyRowLine(): string {
  return [
    EXPENSE_ID,
    TEACHER_ID,
    "Sarah Ahmed",
    "Office rent August",
    ExpenseType.LOGISTICS,
    "1200.00",
    CurrencyCode.SAR,
    "2026-08-05",
    "2026-08",
    "",
    "",
    "",
    USER_ID,
    "Admin User",
    "",
    "",
    "",
    "2026-08-05T09:00:00.000Z",
    "2026-08-05T09:00:00.000Z",
  ].join(",");
}

function expectedFilters(overrides: Partial<ExpenseFilters> = {}): ExpenseFilters {
  return {
    title: null,
    types: null,
    expenseDate: null,
    paymentDateFrom: null,
    paymentDateTo: null,
    includeDeleted: null,
    ...overrides,
  };
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  requirePermissionMock.mockClear();
  getReportMock.mockClear();
  hasPermissionMock.mockClear();
  checkRateLimitMock.mockClear();
  manageAllowed = true;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/expenses/export", () => {
  describe("authentication and permission gate", () => {
    test("returns 401 and never reads the report when no authenticated user", async () => {
      getServerUserContextMock.mockResolvedValueOnce({ userId: null });

      const response = await callExport();

      expect(response.status).toBe(401);
      expect(await readErrorBody(response)).toBe("You must be logged in first.");
      expect(requirePermissionMock).toHaveBeenCalledTimes(0);
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("falls back to the Arabic error copy when the request carries no accept-language header", async () => {
      getServerUserContextMock.mockResolvedValueOnce({ userId: null });
      const { GET } = await importRoute();

      const response = await GET(new NextRequest(EXPORT_URL, { method: "GET" }));

      expect(response.status).toBe(401);
      expect(await readErrorBody(response)).toBe("يجب تسجيل الدخول أولاً.");
    });

    test("parses a compound accept-language header down to the primary subtag", async () => {
      getServerUserContextMock.mockResolvedValueOnce({ userId: null });
      const { GET } = await importRoute();
      const headers = new Headers();
      headers.set("accept-language", "en-US,en;q=0.9");

      const response = await GET(new NextRequest(EXPORT_URL, { method: "GET", headers }));

      expect(response.status).toBe(401);
      expect(await readErrorBody(response)).toBe("You must be logged in first.");
    });

    test("returns 403 and never queries the report when the permission gate rejects", async () => {
      requirePermissionMock.mockImplementationOnce(async () => {
        throw new ForbiddenError("insufficient permissions");
      });

      const response = await callExport("?title=rent");

      expect(response.status).toBe(403);
      expect(await readErrorBody(response)).toBe("You do not have sufficient permissions to perform this action.");
      expect(requirePermissionMock).toHaveBeenCalledTimes(1);
      expect(requirePermissionMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(requirePermissionMock.mock.calls[0]?.[1]).toBe(AppPermission.ACCOUNTING_EXPENSES_VIEW);
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 429 and never queries the report when the export rate limit is exceeded", async () => {
      checkRateLimitMock.mockResolvedValueOnce({ success: false, limit: 10, remaining: 0, reset: Date.now() + 60_000 });

      const response = await callExport();

      expect(response.status).toBe(429);
      expect(await readErrorBody(response)).toBe("Too many requests. Please try again later.");
      expect(requirePermissionMock).toHaveBeenCalledTimes(0);
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("happy path", () => {
    test("returns a CSV file with export headers, mapped filters, and the row payload", async () => {
      const response = await callExport(
        "?title=rent&types=Marketing,Technology&expenseDate=2026-08" +
          "&paymentDateFrom=2026-08-01&paymentDateTo=2026-08-31&includeDeleted=false"
      );

      const dateStamp = new Date().toISOString().slice(0, 10);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toBe(`attachment; filename="expenses-${dateStamp}.csv"`);
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
      expect(response.headers.get("X-Export-Truncated")).toBe("false");

      expect(getReportMock).toHaveBeenCalledTimes(1);
      expect(getReportMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual(
        expectedFilters({
          title: "rent",
          types: [ExpenseType.MARKETING, ExpenseType.TECHNOLOGY],
          expenseDate: "2026-08",
          paymentDateFrom: "2026-08-01",
          paymentDateTo: "2026-08-31",
          includeDeleted: false,
        })
      );
      expect(getReportMock.mock.calls[0]?.[2]).toEqual({ limit: EXPORT_ROW_LIMIT, offset: 0 });
      expect(getReportMock.mock.calls[0]?.[3]?.invalidInput).toBe("Invalid input.");

      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[0]).toBe(EXPECTED_CSV_HEADER);
      expect(bodyLines[1]).toBe(expectedHappyRowLine());
      expect(bodyLines[2]).toBe("");
    });

    test("sends the default filter set when no query params (or only blank values) are present", async () => {
      const response = await callExport();
      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual(expectedFilters());

      const blankResponse = await callExport("?title=&types=&expenseDate=&paymentDateFrom=&paymentDateTo=&title=%20");
      expect(blankResponse.status).toBe(200);
      expect(getReportMock.mock.calls[1]?.[1]).toEqual(expectedFilters());
    });

    test("marks the response truncated when the filtered set exceeds the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildExpensePage([buildExpenseRow()], EXPORT_ROW_LIMIT + 1));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("true");
      expect(getReportMock.mock.calls[0]?.[2]?.limit).toBe(EXPORT_ROW_LIMIT);
    });

    test("reports no truncation when the filtered set exactly equals the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildExpensePage([buildExpenseRow()], EXPORT_ROW_LIMIT));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("false");
    });
  });

  describe("includeDeleted gating", () => {
    test("passes includeDeleted through when the caller holds ACCOUNTING_EXPENSES_MANAGE", async () => {
      const response = await callExport("?includeDeleted=true");

      expect(response.status).toBe(200);
      expect(hasPermissionMock).toHaveBeenCalledWith(USER_ID, AppPermission.ACCOUNTING_EXPENSES_MANAGE);
      expect(getReportMock.mock.calls[0]?.[1].includeDeleted).toBe(true);
    });

    test("silently clears includeDeleted for a view-only caller", async () => {
      manageAllowed = false;

      const response = await callExport("?includeDeleted=true");

      expect(response.status).toBe(200);
      expect(hasPermissionMock).toHaveBeenCalledWith(USER_ID, AppPermission.ACCOUNTING_EXPENSES_MANAGE);
      expect(getReportMock.mock.calls[0]?.[1].includeDeleted).toBe(false);
    });

    test("skips the manage-permission check when includeDeleted is not requested", async () => {
      const response = await callExport("");

      expect(response.status).toBe(200);
      expect(hasPermissionMock).not.toHaveBeenCalled();
      expect(getReportMock.mock.calls[0]?.[1].includeDeleted).toBeNull();
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

  describe("input validation", () => {
    test("returns 400 for a malformed paymentDateFrom", async () => {
      const response = await callExport("?paymentDateFrom=01-08-2026");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for a paymentDateTo that is not a real calendar date", async () => {
      const response = await callExport("?paymentDateTo=2026-02-30");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("accepts a leap-day payment date on a leap year", async () => {
      const response = await callExport("?paymentDateFrom=2024-02-29");

      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.paymentDateFrom).toBe("2024-02-29");
    });

    test("returns 400 for a malformed expenseDate accounting month", async () => {
      const response = await callExport("?expenseDate=2026-13");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for an unknown types value", async () => {
      const response = await callExport("?types=Marketing,Rent");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for a non-boolean includeDeleted value", async () => {
      const response = await callExport("?includeDeleted=yes");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for an over-long title and accepts the exact limit", async () => {
      const tooLong = await callExport(`?title=${"a".repeat(201)}`);
      expect(tooLong.status).toBe(400);
      expect(getReportMock).toHaveBeenCalledTimes(0);

      const atLimit = await callExport(`?title=${"b".repeat(200)}`);
      expect(atLimit.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.title).toBe("b".repeat(200));
    });

    test("returns 400 when the service rejects a reversed payment-date range", async () => {
      getReportMock.mockRejectedValueOnce(new ValidationError("Invalid input."));

      const response = await callExport("?paymentDateFrom=2026-08-31&paymentDateTo=2026-08-01");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("CSV hardening", () => {
    test("neutralizes formula-prefixed cells and quotes separator-bearing cells", async () => {
      getReportMock.mockResolvedValueOnce(
        buildExpensePage([
          buildExpenseRow({
            title: "=SUM(A1:A9)",
            note: `Balance: -2+"3", verified`,
            deletedReason: "duplicate",
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[1]).toBe(
        [
          EXPENSE_ID,
          TEACHER_ID,
          "Sarah Ahmed",
          "'=SUM(A1:A9)",
          ExpenseType.LOGISTICS,
          "1200.00",
          CurrencyCode.SAR,
          "2026-08-05",
          "2026-08",
          '"Balance: -2+""3"", verified"',
          "",
          "",
          USER_ID,
          "Admin User",
          "",
          "",
          "duplicate",
          "2026-08-05T09:00:00.000Z",
          "2026-08-05T09:00:00.000Z",
        ].join(",")
      );
      expect(body).not.toContain(",=SUM(A1:A9)");
    });

    test("neutralizes tab- and CR-led formula cells (OWASP 0x09/0x0D prefixes)", async () => {
      getReportMock.mockResolvedValueOnce(
        buildExpensePage([
          buildExpenseRow({
            title: '\t=HYPERLINK("http://evil.example","click")',
            note: "\r=1+1",
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      const expectedTabCell = '"\'\t=HYPERLINK(""http://evil.example"",""click"")"';
      const expectedCrCell = '"\'\r=1+1"';
      expect(body).toContain(expectedTabCell);
      expect(body).toContain(expectedCrCell);
      expect(body).not.toMatch(/(^|,)\t=/);
      expect(body).not.toMatch(/(^|,)\r=/);
    });

    test("neutralizes the remaining OWASP formula prefixes (+, -, @)", async () => {
      getReportMock.mockResolvedValueOnce(
        buildExpensePage([
          buildExpenseRow({
            title: "@Cmd(1,1)",
            note: "+2+2",
            deletedReason: "-10.50",
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain(`"'@Cmd(1,1)"`);
      expect(body).toContain(",'+2+2,");
      expect(body).toContain(",'-10.50,");
      expect(body).not.toContain(",@Cmd");
      expect(body).not.toContain(",+2+2,");
      expect(body).not.toContain(",-10.50,");
    });

    test("passes Arabic/RTL cell content through unmodified (no encoding mangling)", async () => {
      getReportMock.mockResolvedValueOnce(
        buildExpensePage([
          buildExpenseRow({
            teacherName: "سارة الأحمد",
            title: "إيجار المكتب",
            note: "تحويل مصروف أغسطس, دفعة أولى",
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("سارة الأحمد");
      expect(body).toContain("إيجار المكتب");
      expect(body).toContain('"تحويل مصروف أغسطس, دفعة أولى"');
    });
  });
});
