import { beforeEach, describe, expect, mock, test } from "bun:test";
import { NextRequest } from "next/server";

import { AppPermission, CalculationStatus } from "@/backend/enum";
import type { PayrollReportFilters, PayrollReportPage, PayrollReportRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = "11111111-1111-1111-1111-111111111111";
const INSTANCE_ID = "22222222-2222-2222-2222-222222222222";
const TEACHER_ID = "33333333-3333-3333-3333-333333333333";
const STUDENT_ID = "44444444-4444-4444-4444-444444444444";
const SUBJECT_ID = "55555555-5555-5555-5555-555555555555";
const EXPORT_URL = "http://localhost:3000/api/payroll/export";
const EXPORT_ROW_LIMIT = 10_000;

const EXPECTED_CSV_HEADER =
  "instanceId,scheduledStartAt,scheduledEndAt,scheduledDurationMinutes,actualStartAt,actualEndAt," +
  "calculatedDuration,teacherPaidAmount,teacherPaidCurrency,calculationStatus,isPartialPercentage,payrollNote," +
  "teacherId,teacherName,studentId,studentName,subjectId,subjectName,isStudentAbsence,isTeacherAbsence";

function buildReportRow(overrides: Partial<PayrollReportRow> = {}): PayrollReportRow {
  return {
    instanceId: INSTANCE_ID,
    scheduledStartAt: "2026-08-20T10:00:00.000Z",
    scheduledEndAt: "2026-08-20T11:00:00.000Z",
    scheduledDurationMinutes: 60,
    actualStartAt: "2026-08-20T10:02:00.000Z",
    actualEndAt: "2026-08-20T11:00:00.000Z",
    calculatedDuration: 58,
    teacherPaidAmount: "116.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.CALCULATED,
    isPartialPercentage: null,
    payrollNote: null,
    teacherId: TEACHER_ID,
    teacherName: "Sarah Ahmed",
    studentId: STUDENT_ID,
    studentName: "Omar Khaled",
    subjectId: SUBJECT_ID,
    subjectName: "Mathematics",
    isStudentAbsence: false,
    isTeacherAbsence: false,
    ...overrides,
  };
}

function buildReportPage(rows: readonly PayrollReportRow[], totalCount = rows.length): PayrollReportPage {
  return {
    rows: [...rows],
    totalCount,
    aggregates: {
      totalPaidAmount: "116.00",
      totalPaidCurrency: CurrencyCode.SAR,
      rowCountByStatus: {
        [CalculationStatus.NOT_CALCULATED]: 0,
        [CalculationStatus.CALCULATED]: rows.length,
        [CalculationStatus.PARTIALLY]: 0,
        [CalculationStatus.REFUND]: 0,
        [CalculationStatus.WAITING_PAID]: 0,
        [CalculationStatus.PAID]: 0,
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Mocks — registered before the route module is imported. The route imports
// the mocked symbols from the `@/backend/lib` / `@/backend/services` barrels,
// so the barrel-level mocks replace them for the route under test.
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
    _filters: PayrollReportFilters,
    _pagination: { limit: number; offset: number },
    _tErrors: ErrorsLabels
  ): Promise<PayrollReportPage> => buildReportPage([buildReportRow()])
);

await mock.module("@/backend/lib", () => ({
  ForbiddenError,
  ValidationError,
  getServerUserContext: getServerUserContextMock,
  logger: { log: () => {}, info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("@/backend/services", () => ({
  PayrollCalculationService: { getReport: getReportMock },
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
    INSTANCE_ID,
    "2026-08-20T10:00:00.000Z",
    "2026-08-20T11:00:00.000Z",
    "60",
    "2026-08-20T10:02:00.000Z",
    "2026-08-20T11:00:00.000Z",
    "58",
    "116.00",
    CurrencyCode.SAR,
    CalculationStatus.CALCULATED,
    "",
    "",
    TEACHER_ID,
    "Sarah Ahmed",
    STUDENT_ID,
    "Omar Khaled",
    SUBJECT_ID,
    "Mathematics",
    "false",
    "false",
  ].join(",");
}

beforeEach(() => {
  getServerUserContextMock.mockClear();
  requirePermissionMock.mockClear();
  getReportMock.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("GET /api/payroll/export", () => {
  describe("authentication and permission gate", () => {
    test("returns 401 and never reads the report when no authenticated user", async () => {
      getServerUserContextMock.mockResolvedValueOnce({ userId: null });

      const response = await callExport();

      expect(response.status).toBe(401);
      expect(await readErrorBody(response)).toBe("You must be logged in first.");
      expect(requirePermissionMock).toHaveBeenCalledTimes(0);
      expect(getReportMock).toHaveBeenCalledTimes(0);
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
      expect(requirePermissionMock.mock.calls[0]?.[1]).toBe(AppPermission.ACCOUNTING_PAYROLL_VIEW);
      expect(getReportMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("happy path", () => {
    test("returns a CSV file with export headers, mapped filters, and the row payload", async () => {
      const response = await callExport(
        `?teacherId=${TEACHER_ID}&studentId=${STUDENT_ID}&dateFrom=2026-08-01&dateTo=2026-08-31` +
          "&calculationStatuses=CALCULATED,PAID&search=Sarah"
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("Content-Disposition")).toMatch(
        /^attachment; filename="payroll-report-\d{4}-\d{2}-\d{2}\.csv"$/
      );
      expect(response.headers.get("X-Export-Truncated")).toBe("false");

      expect(getReportMock).toHaveBeenCalledTimes(1);
      expect(getReportMock.mock.calls[0]?.[0]).toBe(USER_ID);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual({
        teacherId: TEACHER_ID,
        studentId: STUDENT_ID,
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
        calculationStatuses: [CalculationStatus.CALCULATED, CalculationStatus.PAID],
        search: "Sarah",
      });
      expect(getReportMock.mock.calls[0]?.[2]).toEqual({ limit: EXPORT_ROW_LIMIT, offset: 0 });
      expect(getReportMock.mock.calls[0]?.[3]?.invalidInput).toBe("Invalid input.");

      const body = await response.text();
      const bodyLines = body.split("\r\n");
      expect(bodyLines[0]).toBe(EXPECTED_CSV_HEADER);
      expect(bodyLines[1]).toBe(expectedHappyRowLine());
      expect(bodyLines[2]).toBe("");
    });

    test("parses repeatable calculationStatuses params into the status filter", async () => {
      const response = await callExport("?calculationStatuses=PAID&calculationStatuses=WAITING_PAID,CALCULATED");

      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]?.calculationStatuses).toEqual([
        CalculationStatus.PAID,
        CalculationStatus.WAITING_PAID,
        CalculationStatus.CALCULATED,
      ]);
    });

    test("sends an empty filter set when no query params (or only blank values) are present", async () => {
      const response = await callExport();
      expect(response.status).toBe(200);
      expect(getReportMock.mock.calls[0]?.[1]).toEqual({
        teacherId: null,
        studentId: null,
        dateFrom: null,
        dateTo: null,
        calculationStatuses: null,
        search: null,
      });

      const blankResponse = await callExport("?teacherId=&search=%20&calculationStatuses=");
      expect(blankResponse.status).toBe(200);
      expect(getReportMock.mock.calls[1]?.[1]).toEqual({
        teacherId: null,
        studentId: null,
        dateFrom: null,
        dateTo: null,
        calculationStatuses: null,
        search: null,
      });
    });

    test("marks the response truncated when the filtered set exceeds the export limit", async () => {
      getReportMock.mockResolvedValueOnce(buildReportPage([buildReportRow()], EXPORT_ROW_LIMIT + 1));

      const response = await callExport();

      expect(response.status).toBe(200);
      expect(response.headers.get("X-Export-Truncated")).toBe("true");
      expect(getReportMock.mock.calls[0]?.[2]?.limit).toBe(EXPORT_ROW_LIMIT);
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

    test("returns 400 for an unknown calculation status value", async () => {
      const response = await callExport("?calculationStatuses=CALCULATED,BOGUS");

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
          INSTANCE_ID,
          "2026-08-20T10:00:00.000Z",
          "2026-08-20T11:00:00.000Z",
          "60",
          "2026-08-20T10:02:00.000Z",
          "2026-08-20T11:00:00.000Z",
          "58",
          "116.00",
          CurrencyCode.SAR,
          CalculationStatus.CALCULATED,
          "",
          `"'-2+""3"""`,
          TEACHER_ID,
          "'=SUM(A1:A9)",
          STUDENT_ID,
          '"Khaled, Omar"',
          SUBJECT_ID,
          "'@delete",
          "false",
          "false",
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
