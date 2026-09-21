import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

import { AppPermission, CalculationStatus } from "@/backend/enum";
import { isUuidShape } from "@/backend/lib/id-shape";
import { serializeSessionAuditCsv } from "@/backend/services/accounting/session-audit-csv.serializer";
import type { SessionAuditReportFilters, SessionAuditReportPage, SessionAuditReportRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "3f8a2c1e-5b47-4d69-9c2a-8e1f4a7b6d01";
const INSTANCE_ID = "6c4d8e2f-1a37-4b58-8d9e-2f5a7c9b3e02";
const TEACHER_ID = "55ad3ab2-71c4-4af2-9b68-7d0e1f2a3b4c";
const STUDENT_ID = "9b1f4c3d-7e28-4a5f-8c6d-3e2b1a9f8c03";
const SUBJECT_ID = "1d2c3b4a-5e6f-4789-8a9b-0c1d2e3f4a04";
const EXPORT_URL = "http://localhost:3000/api/accounting/reports/export";
const EXPORT_ROW_LIMIT = 10_000;

const EXPECTED_CSV_HEADER =
  "scheduledStartAt,teacherName,currentStatus,studentName,subjectName,actualStartAt,actualEndAt," +
  "durationMinutes,calculatedDuration,teacherPaidAmount,calculationStatus,isPartialPercentage,payrollNote," +
  "teacherDuePaymentDate,scheduledEndAt,subjectId,bookingTimezone,teacherPaidCurrency,payrollCalculatedAt," +
  "teacherId,studentId,instanceId";

function buildReportRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    instanceId: INSTANCE_ID,
    scheduledStartAt: "2026-08-20T10:00:00.000Z",
    scheduledEndAt: "2026-08-20T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-20T10:02:00.000Z",
    actualEndAt: "2026-08-20T11:00:00.000Z",
    bookingTimezone: "Asia/Riyadh",
    currentStatus: "end",
    calculatedDuration: 58,
    teacherPaidAmount: "116.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.PAID,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: "2026-08-21T08:00:00.000Z",
    carryoverBalanceId: null,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    studentId: STUDENT_ID,
    studentName: "Omar Khaled",
    subjectId: SUBJECT_ID,
    subjectName: "Mathematics",
    teacherDuePaymentDate: "2026-08-31",
    ...overrides,
  };
}

function buildReportPage(rows: readonly SessionAuditReportRow[], totalCount = rows.length): SessionAuditReportPage {
  return {
    rows: [...rows],
    totalCount,
    aggregates: {
      rowCountByStatus: { open: 0, end: rows.length, Absent: 0, absent_student: 0 },
      rowCountByPaid: { paid: rows.length, unpaid: 0 },
      totalPaidAmount: "116.00",
      totalPaidCurrency: CurrencyCode.SAR,
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the route module is imported. The route reads
// everything from the `@/backend/lib` / `@/backend/services` barrels, so the
// barrel-level mocks replace them for the route under test. The CSV
// serializer is passed through to the real implementation so response-body
// assertions exercise the production escaping and column contract.
// ---------------------------------------------------------------------------

class ForbiddenError extends Error {}
class ValidationError extends Error {}

const getServerUserContextMock = mock(async (): Promise<{ userId: string | null }> => ({ userId: USER_ID }));

const requirePermissionMock = mock(
  async (_actorUserId: string, _permission: AppPermission, _tErrors: ErrorsLabels): Promise<void> => {}
);

const hasPermissionMock = mock(async (_userId: string, _permission: AppPermission): Promise<boolean> => false);

const getReportMock = mock(
  async (
    _actorUserId: string,
    _filters: SessionAuditReportFilters,
    _sort: { field: string; direction: "asc" | "desc" } | null | undefined,
    _pagination: { limit: number; offset: number },
    _tErrors: ErrorsLabels
  ): Promise<SessionAuditReportPage> => buildReportPage([buildReportRow()])
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
  isUuidShape,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("@/backend/services", () => ({
  PermissionsService: { hasPermission: hasPermissionMock },
  SessionAuditService: { getReport: getReportMock },
  requirePermission: requirePermissionMock,
  serializeSessionAuditCsv,
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
    "2026-08-20T10:00:00.000Z",
    "Sarah Ahmed",
    "end",
    "Omar Khaled",
    "Mathematics",
    "2026-08-20T10:02:00.000Z",
    "2026-08-20T11:00:00.000Z",
    "60",
    "58",
    "116.00",
    CalculationStatus.PAID,
    "",
    "",
    "2026-08-31",
    "2026-08-20T11:00:00.000Z",
    SUBJECT_ID,
    "Asia/Riyadh",
    CurrencyCode.SAR,
    "2026-08-21T08:00:00.000Z",
    TEACHER_ID,
    STUDENT_ID,
    INSTANCE_ID,
  ].join(",");
}

function expectedFilters(overrides: Partial<SessionAuditReportFilters> = {}): SessionAuditReportFilters {
  return {
    teacherId: null,
    studentId: null,
    dateFrom: null,
    dateTo: null,
    currentStatuses: null,
    search: null,
    includeDeleted: false,
    ...overrides,
  };
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  requirePermissionMock.mockClear();
  hasPermissionMock.mockClear();
  getReportMock.mockClear();
  checkRateLimitMock.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/accounting/reports/export", () => {
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

    test("uses the primary subtag of a compound accept-language header", async () => {
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

      const response = await callExport(`?teacherId=${TEACHER_ID}`);

      expect(response.status).toBe(403);
      expect(await readErrorBody(response)).toBe("You do not have sufficient permissions to perform this action.");
      expect(requirePermissionMock).toHaveBeenCalledTimes(1);
      expect(requirePermissionMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(requirePermissionMock.mock.calls[0]?.[1]).toBe(AppPermission.ACCOUNTING_REPORTS_VIEW);
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
    test("returns a CSV file with export headers, mapped filters, sort, and the row payload", async () => {
      const response = await callExport(
        `?teacherId=${TEACHER_ID}&studentId=${STUDENT_ID}&dateFrom=2026-08-01&dateTo=2026-08-31` +
          "&currentStatuses=end,Absent&search=Sarah&sortField=teacherName&sortDirection=asc"
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="session-audit-report.csv"');
      expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(response.headers.get("Content-Security-Policy")).toBe("default-src 'none'; sandbox");
      expect(response.headers.get("X-Export-Truncated")).toBe("false");

      expect(getReportMock).toHaveBeenCalledTimes(1);
      expect(getReportMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual(
        expectedFilters({
          teacherId: TEACHER_ID,
          studentId: STUDENT_ID,
          dateFrom: "2026-08-01",
          dateTo: "2026-08-31",
          currentStatuses: ["end", "Absent"],
          search: "Sarah",
        })
      );
      expect(getReportMock.mock.calls[0]?.[2]).toEqual({ field: "teacherName", direction: "asc" });
      expect(getReportMock.mock.calls[0]?.[3]).toEqual({ limit: EXPORT_ROW_LIMIT, offset: 0 });
      expect(getReportMock.mock.calls[0]?.[4]?.invalidInput).toBe("Invalid input.");

      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[0]).toBe(EXPECTED_CSV_HEADER);
      expect(bodyLines[1]).toBe(expectedHappyRowLine());
      expect(bodyLines[2]).toBe("");
    });

    test("parses repeatable currentStatuses params into the status filter", async () => {
      const response = await callExport("?currentStatuses=open&currentStatuses=end,absent_student");

      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.currentStatuses).toEqual(["open", "end", "absent_student"]);
    });

    test("sends the default filter set and a null sort when no query params (or only blank values) are present", async () => {
      const response = await callExport();
      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual(expectedFilters());
      expect(getReportMock.mock.calls[0]?.[2]).toBeNull();

      const blankResponse = await callExport("?teacherId=&search=%20&currentStatuses=&sortField=&includeDeleted=");
      expect(blankResponse.status).toBe(200);
      expect(getReportMock.mock.calls[1]?.[1]).toEqual(expectedFilters());
      expect(getReportMock.mock.calls[1]?.[2]).toBeNull();
    });

    test("marks the response truncated when the filtered set exceeds the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildReportPage([buildReportRow()], EXPORT_ROW_LIMIT + 1));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("true");
      expect(getReportMock.mock.calls[0]?.[3]?.limit).toBe(EXPORT_ROW_LIMIT);
    });

    test("reports no truncation when the filtered set exactly equals the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildReportPage([buildReportRow()], EXPORT_ROW_LIMIT));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("false");
    });

    test("treats a comma-only currentStatuses param as absent", async () => {
      const response = await callExport("?currentStatuses=,,,");

      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.currentStatuses).toBeNull();
    });
  });

  describe("includeDeleted gating", () => {
    test("passes includeDeleted through when the caller holds ACCOUNTING_REPORTS_MANAGE", async () => {
      hasPermissionMock.mockResolvedValueOnce(true);

      const response = await callExport("?includeDeleted=true");

      expect(response.status).toBe(200);
      expect(hasPermissionMock).toHaveBeenCalledWith(USER_ID, AppPermission.ACCOUNTING_REPORTS_MANAGE);
      expect(getReportMock.mock.calls[0]?.[1]?.includeDeleted).toBe(true);
    });

    test("clears includeDeleted when the caller lacks ACCOUNTING_REPORTS_MANAGE", async () => {
      const response = await callExport("?includeDeleted=true");

      expect(response.status).toBe(200);
      expect(hasPermissionMock).toHaveBeenCalledWith(USER_ID, AppPermission.ACCOUNTING_REPORTS_MANAGE);
      expect(getReportMock.mock.calls[0]?.[1]?.includeDeleted).toBe(false);
    });

    test("skips the manage-permission check when includeDeleted is not requested", async () => {
      const response = await callExport();

      expect(response.status).toBe(200);
      expect(hasPermissionMock).toHaveBeenCalledTimes(0);
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

    test("returns 400 when the service rejects a reversed date range", async () => {
      getReportMock.mockRejectedValueOnce(new ValidationError("Invalid input."));

      const response = await callExport("?dateFrom=2026-08-31&dateTo=2026-08-01");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(1);
    });

    test("returns 400 for an unknown audit status value", async () => {
      const response = await callExport("?currentStatuses=end,BOGUS");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for an over-long search term", async () => {
      const response = await callExport(`?search=${"a".repeat(201)}`);

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("accepts a search term at exactly the length limit", async () => {
      const response = await callExport(`?search=${"b".repeat(200)}`);

      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.search).toBe("b".repeat(200));
    });

    test("returns 400 for an unknown sort field", async () => {
      const response = await callExport("?sortField=payrollNote&sortDirection=asc");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 when only one half of the sort pair is present", async () => {
      const missingDirection = await callExport("?sortField=teacherName");
      expect(missingDirection.status).toBe(400);

      const missingField = await callExport("?sortDirection=desc");
      expect(missingField.status).toBe(400);

      expect(getReportMock).toHaveBeenCalledTimes(0);
    });

    test("returns 400 for a non-boolean includeDeleted value", async () => {
      const response = await callExport("?includeDeleted=yes");

      expect(response.status).toBe(400);
      expect(await readErrorBody(response)).toBe("Invalid input.");
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("CSV hardening", () => {
    test("neutralizes formula-prefixed cells and quotes separator-bearing cells", async () => {
      getReportMock.mockResolvedValueOnce(
        buildReportPage([
          buildReportRow({
            teacherName: "=SUM(A1:A9)",
            studentName: "Khaled, Omar",
            subjectName: "@delete",
            payrollNote: `-2+"3"`,
          }),
        ])
      );

      const response = await callExport();

      expect(response.status).toBe(200);
      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[1]).toBe(
        [
          "2026-08-20T10:00:00.000Z",
          "'=SUM(A1:A9)",
          "end",
          '"Khaled, Omar"',
          "'@delete",
          "2026-08-20T10:02:00.000Z",
          "2026-08-20T11:00:00.000Z",
          "60",
          "58",
          "116.00",
          CalculationStatus.PAID,
          "",
          `"'-2+""3"""`,
          "2026-08-31",
          "2026-08-20T11:00:00.000Z",
          SUBJECT_ID,
          "Asia/Riyadh",
          CurrencyCode.SAR,
          "2026-08-21T08:00:00.000Z",
          TEACHER_ID,
          STUDENT_ID,
          INSTANCE_ID,
        ].join(",")
      );
      expect(body).not.toContain(",=SUM(A1:A9)");
    });

    test("neutralizes tab- and CR-led formula cells (OWASP 0x09/0x0D prefixes)", async () => {
      getReportMock.mockResolvedValueOnce(
        buildReportPage([
          buildReportRow({
            studentName: '\t=HYPERLINK("http://evil.example","click")',
            subjectName: "\r=1+1",
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
  });
});
