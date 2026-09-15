import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

import { AppPermission } from "@/backend/enum";
import type { CarryoverFilters, CarryoverPage, CarryoverRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const CARRYOVER_ID = "[CARD_REDACTED]-[CARD_REDACTED]";
const TEACHER_ID = "55ad3ab2-71c4-4af2-9b68-7d0e1f2a3b4c";
const EXPORT_URL = "http://localhost:3000/api/carryover/export";
const EXPORT_ROW_LIMIT = 10_000;

const EXPECTED_CSV_HEADER =
  "id,teacherId,teacherName,teacherAvatarUrl,studentsCount,studentsText,totalDuration,payable,teacherCurrency," +
  "paid,fromDate,toDate,paymentDate,isDisabledTeacher,isPaid,expenseId,note,createdAt,paidAt";

function buildCarryoverRow(overrides: Partial<CarryoverRow> = {}): CarryoverRow {
  return {
    id: CARRYOVER_ID,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    teacherAvatarUrl: null,
    studentsCount: 2,
    studentsText: "Omar Khaled, Lina Hassan",
    totalDuration: "4.00",
    payable: "464.00",
    teacherCurrency: CurrencyCode.SAR,
    paid: "0.00",
    fromDate: "2026-08-01",
    toDate: "2026-08-31",
    paymentDate: null,
    isDisabledTeacher: false,
    isPaid: false,
    expenseId: null,
    note: null,
    createdAt: "2026-09-01T08:00:00.000Z",
    paidAt: null,
    ...overrides,
  };
}

function buildCarryoverPage(rows: readonly CarryoverRow[], totalCount = rows.length): CarryoverPage {
  return {
    rows: [...rows],
    totalCount,
    aggregates: {
      totalPayable: "464.00",
      totalPaid: "0.00",
      dominantCurrency: CurrencyCode.SAR,
      rowCountByPaid: { paid: 0, unpaid: rows.length },
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

const getReportMock = mock(
  async (
    _actorUserId: string,
    _filters: CarryoverFilters,
    _pagination: { limit: number; offset: number },
    _tErrors: ErrorsLabels
  ): Promise<CarryoverPage> => buildCarryoverPage([buildCarryoverRow()])
);

await mock.module("@/backend/lib", () => ({
  ForbiddenError,
  ValidationError,
  getServerUserContext: getServerUserContextMock,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("@/backend/services", () => ({
  CarryoverBalanceService: { getReport: getReportMock },
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
    CARRYOVER_ID,
    TEACHER_ID,
    "Sarah Ahmed",
    "",
    "2",
    '"Omar Khaled, Lina Hassan"',
    "4.00",
    "464.00",
    CurrencyCode.SAR,
    "0.00",
    "2026-08-01",
    "2026-08-31",
    "",
    "false",
    "false",
    "",
    "",
    "2026-09-01T08:00:00.000Z",
    "",
  ].join(",");
}

function expectedFilters(overrides: Partial<CarryoverFilters> = {}): CarryoverFilters {
  return {
    teacherId: null,
    paidStatus: null,
    dateFrom: null,
    dateTo: null,
    includeDisabledTeachers: null,
    search: null,
    ...overrides,
  };
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  requirePermissionMock.mockClear();
  getReportMock.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/carryover/export", () => {
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

    test("returns 403 and never queries the report when the permission gate rejects", async () => {
      requirePermissionMock.mockImplementationOnce(async () => {
        throw new ForbiddenError("insufficient permissions");
      });

      const response = await callExport(`?teacherId=${TEACHER_ID}`);

      expect(response.status).toBe(403);
      expect(await readErrorBody(response)).toBe("You do not have sufficient permissions to perform this action.");
      expect(requirePermissionMock).toHaveBeenCalledTimes(1);
      expect(requirePermissionMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(requirePermissionMock.mock.calls[0]?.[1]).toBe(AppPermission.ACCOUNTING_CARRYOVER_VIEW);
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("happy path", () => {
    test("returns a CSV file with export headers, mapped filters, and the row payload", async () => {
      const response = await callExport(
        `?teacherId=${TEACHER_ID}&paidStatus=Unpaid&dateFrom=2026-08-01&dateTo=2026-08-31` +
          "&includeDisabledTeachers=true&search=Sarah"
      );

      const dateStamp = new Date().toISOString().slice(0, 10);
      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toBe(
        `attachment; filename="carryover-balances-${dateStamp}.csv"`
      );
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
      expect(response.headers.get("X-Export-Truncated")).toBe("false");

      expect(getReportMock).toHaveBeenCalledTimes(1);
      expect(getReportMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual(
        expectedFilters({
          teacherId: TEACHER_ID,
          paidStatus: "Unpaid",
          dateFrom: "2026-08-01",
          dateTo: "2026-08-31",
          includeDisabledTeachers: true,
          search: "Sarah",
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

      const blankResponse = await callExport("?teacherId=&paidStatus=&dateFrom=&search=%20&includeDisabledTeachers=");
      expect(blankResponse.status).toBe(200);
      expect(getReportMock.mock.calls[1]?.[1]).toEqual(expectedFilters());
    });

    test("marks the response truncated when the filtered set exceeds the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildCarryoverPage([buildCarryoverRow()], EXPORT_ROW_LIMIT + 1));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("true");
      expect(getReportMock.mock.calls[0]?.[2]?.limit).toBe(EXPORT_ROW_LIMIT);
    });

    test("reports no truncation when the filtered set exactly equals the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildCarryoverPage([buildCarryoverRow()], EXPORT_ROW_LIMIT));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("false");
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
    test("returns 400 for a malformed dateFrom", async () => {
      const response = await callExport("?dateFrom=20-08-2026");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for a dateTo that is not a real calendar date", async () => {
      const response = await callExport("?dateTo=2026-02-30");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for an unknown paidStatus value", async () => {
      const response = await callExport("?paidStatus=Partially");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for a malformed teacherId instead of surfacing a uuid-cast database error", async () => {
      const response = await callExport("?teacherId=not-a-uuid");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for a non-boolean includeDisabledTeachers value", async () => {
      const response = await callExport("?includeDisabledTeachers=yes");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for an over-long search term and accepts the exact limit", async () => {
      const tooLong = await callExport(`?search=${"a".repeat(201)}`);
      expect(tooLong.status).toBe(400);
      expect(getReportMock).toHaveBeenCalledTimes(0);

      const atLimit = await callExport(`?search=${"b".repeat(200)}`);
      expect(atLimit.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.search).toBe("b".repeat(200));
    });

    test("returns 400 when the service rejects a reversed date range", async () => {
      getReportMock.mockRejectedValueOnce(new ValidationError("Invalid input."));

      const response = await callExport("?dateFrom=2026-08-31&dateTo=2026-08-01");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("CSV hardening", () => {
    test("neutralizes formula-prefixed cells and quotes separator-bearing cells", async () => {
      getReportMock.mockResolvedValueOnce(
        buildCarryoverPage([
          buildCarryoverRow({
            teacherName: "=SUM(A1:A9)",
            studentsText: "Khaled, Omar",
            note: `-2+"3"`,
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[1]).toBe(
        [
          CARRYOVER_ID,
          TEACHER_ID,
          "'=SUM(A1:A9)",
          "",
          "2",
          '"Khaled, Omar"',
          "4.00",
          "464.00",
          CurrencyCode.SAR,
          "0.00",
          "2026-08-01",
          "2026-08-31",
          "",
          "false",
          "false",
          "",
          `"'-2+""3"""`,
          "2026-09-01T08:00:00.000Z",
          "",
        ].join(",")
      );
      expect(body).not.toContain(",=SUM(A1:A9)");
    });

    test("neutralizes tab- and CR-led formula cells (OWASP 0x09/0x0D prefixes)", async () => {
      getReportMock.mockResolvedValueOnce(
        buildCarryoverPage([
          buildCarryoverRow({
            studentsText: '\t=HYPERLINK("http://evil.example","click")',
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

    test("passes Arabic/RTL cell content through unmodified (no encoding mangling)", async () => {
      getReportMock.mockResolvedValueOnce(
        buildCarryoverPage([
          buildCarryoverRow({
            teacherName: "سارة الأحمد",
            studentsText: "خالد \u202eعمر\u202c",
            note: "تحويل الرصيد المتراكم, دفعة أغسطس",
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      expect(body).toContain("سارة الأحمد");
      expect(body).toContain("خالد \u202eعمر\u202c");
      expect(body).toContain('"تحويل الرصيد المتراكم, دفعة أغسطس"');
    });
  });
});
