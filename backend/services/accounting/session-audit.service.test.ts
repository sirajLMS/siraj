import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { ForbiddenError, logger, ValidationError } from "@/backend/lib";
import type { SessionAuditReportFilters, SessionAuditReportRow, SessionAuditReportSort } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import type { ErrorsLabels } from "@/shared/locale";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ACTOR_ID = "550e8400-e29b-41d4-a716-446655440001";
const TEACHER_ID = "660e8400-e29b-41d4-a716-446655440002";
const STUDENT_ID = "770e8400-e29b-41d4-a716-446655440003";
const SUBJECT_ID = "880e8400-e29b-41d4-a716-446655440004";

const DEFAULT_SORT: SessionAuditReportSort = { field: "scheduledStartAt", direction: "desc" };

function buildRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    instanceId: "instance-1",
    scheduledStartAt: "2026-09-01T10:00:00.000Z",
    scheduledEndAt: "2026-09-01T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-09-01T10:02:00.000Z",
    actualEndAt: "2026-09-01T11:00:00.000Z",
    bookingTimezone: "Africa/Cairo",
    currentStatus: "end",
    calculatedDuration: 58,
    teacherPaidAmount: "150.00",
    teacherPaidCurrency: CurrencyCode.SAR,
    calculationStatus: CalculationStatus.PAID,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: "2026-09-01T12:00:00.000Z",
    teacherId: TEACHER_ID,
    teacherName: "Session Audit Teacher",
    studentId: STUDENT_ID,
    studentName: "Session Audit Student",
    subjectId: SUBJECT_ID,
    subjectName: "Tajwid",
    teacherDuePaymentDate: "2026-09-05",
    ...overrides,
  };
}

/** A pre-calculated row with every payroll snapshot column null. */
function buildUncalculatedRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return buildRow({
    calculatedDuration: null,
    teacherPaidAmount: null,
    teacherPaidCurrency: null,
    calculationStatus: null,
    isPartialPercentage: null,
    payrollNote: null,
    payrollCalculatedAt: null,
    teacherDuePaymentDate: null,
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Mocks — registered before the service module is imported.
// ---------------------------------------------------------------------------

interface ReportReadCall {
  filters: SessionAuditReportFilters;
  sort: SessionAuditReportSort;
  limit: number;
  offset: number;
}

const reportReads: ReportReadCall[] = [];
let queuedPages: { rows: SessionAuditReportRow[]; totalCount: number }[] = [];
let permissionError: Error | null = null;

const findReportRowsMock = mock(
  async (
    filters: SessionAuditReportFilters,
    sort: SessionAuditReportSort,
    pagination: { limit: number; offset: number }
  ) => {
    reportReads.push({ filters, sort, limit: pagination.limit, offset: pagination.offset });
    return queuedPages.shift() ?? { rows: [], totalCount: 0 };
  }
);

const requirePermissionMock = mock(async (_actorUserId: string, _permission: AppPermission, _tErrors: ErrorsLabels) => {
  if (permissionError !== null) {
    throw permissionError;
  }
});

await mock.module("@/backend/db/repo/scheduling", () => ({
  SessionAuditRepository: {
    findReportRows: findReportRowsMock,
  },
}));

await mock.module("@/backend/services/billing/permission-utils", () => ({
  requirePermission: requirePermissionMock,
}));

const loggerInfoSpy = spyOn(logger, "info").mockImplementation(() => {});

// ---------------------------------------------------------------------------
// Errors stub (only the fields the service actually reads).
// ---------------------------------------------------------------------------

function assertIsErrorsLabels(value: unknown): asserts value is ErrorsLabels {
  if (value === null || typeof value !== "object") {
    throw new Error("tErrorsStub must be an object");
  }
}

function buildErrorsStub(): ErrorsLabels {
  const stub = {
    insufficientPermissions: "insufficient permissions",
    invalidInput: "invalid input",
  };
  assertIsErrorsLabels(stub);
  return stub;
}

const tErrors = buildErrorsStub();

/** Mirrors the service's default window: today (UTC) back 30 days. */
function expectedDefaultDateRange(): { dateFrom: string; dateTo: string } {
  const dateTo = new Date().toISOString().slice(0, 10);
  const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { dateFrom, dateTo };
}

// ---------------------------------------------------------------------------
// SUT import (deferred so mocks are registered first) + shared helpers.
// ---------------------------------------------------------------------------

async function importService(): Promise<typeof import("@/backend/services/accounting/session-audit.service")> {
  return import("@/backend/services/accounting/session-audit.service");
}

const CUSTOM_SORT: SessionAuditReportSort = { field: "teacherPaidAmount", direction: "asc" };

async function readReport(
  options: {
    sort?: SessionAuditReportSort | null;
    pagination?: { limit: number; offset: number };
    filters?: SessionAuditReportFilters;
  } = {}
) {
  const { SessionAuditService } = await importService();
  return SessionAuditService.getReport(
    ACTOR_ID,
    options.filters ?? {},
    "sort" in options ? (options.sort ?? null) : CUSTOM_SORT,
    options.pagination ?? { limit: 50, offset: 0 },
    tErrors
  );
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
  reportReads.length = 0;
  queuedPages = [];
  permissionError = null;
  findReportRowsMock.mockClear();
  requirePermissionMock.mockClear();
  loggerInfoSpy.mockClear();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SessionAuditService.getReport", () => {
  beforeEach(() => {
    resetMocks();
  });

  describe("happy path", () => {
    test("returns the page with permission check, forwarded filters, and structured logging", async () => {
      const rows = [
        buildRow({ instanceId: "paid-end", currentStatus: "end", teacherPaidAmount: "150.00" }),
        buildRow({
          instanceId: "paid-open",
          currentStatus: "open",
          calculationStatus: CalculationStatus.CALCULATED,
          teacherPaidAmount: "30.50",
        }),
      ];
      const filters: SessionAuditReportFilters = { teacherId: TEACHER_ID, search: "audit" };
      queuedPages = [{ rows, totalCount: 2 }];

      const page = await readReport({ filters, pagination: { limit: 25, offset: 0 } });

      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);
      expect(reportReads).toHaveLength(1);
      expect(reportReads[0]?.filters).toEqual({ ...filters, ...expectedDefaultDateRange() });
      expect(reportReads[0]?.sort).toEqual(CUSTOM_SORT);
      expect(reportReads[0]?.limit).toBe(25);
      expect(reportReads[0]?.offset).toBe(0);
      expect(page.rows).toEqual(rows);
      expect(page.totalCount).toBe(2);
      expect(loggerInfoSpy).toHaveBeenCalledWith("Session audit report query", {
        actorUserId: ACTOR_ID,
        filters: { ...filters, ...expectedDefaultDateRange() },
        limit: 25,
        offset: 0,
        rowCount: 2,
      });
    });

    test("computes page aggregates over all status and paid dimensions", async () => {
      queuedPages = [
        {
          rows: [
            buildRow({
              instanceId: "a",
              currentStatus: "open",
              calculationStatus: CalculationStatus.NOT_CALCULATED,
              teacherPaidAmount: null,
              teacherPaidCurrency: null,
            }),
            buildRow({
              instanceId: "b",
              currentStatus: "end",
              calculationStatus: CalculationStatus.CALCULATED,
              teacherPaidAmount: "0.10",
            }),
            buildRow({
              instanceId: "c",
              currentStatus: "Absent",
              calculationStatus: CalculationStatus.PAID,
              teacherPaidAmount: "0.20",
              teacherPaidCurrency: CurrencyCode.EGP,
            }),
            buildRow({
              instanceId: "d",
              currentStatus: "absent_student",
              calculationStatus: CalculationStatus.PAID,
              teacherPaidAmount: "10.00",
              teacherPaidCurrency: CurrencyCode.EGP,
            }),
          ],
          totalCount: 4,
        },
      ];

      const page = await readReport();

      expect(page.aggregates).toEqual({
        rowCountByStatus: { open: 1, end: 1, Absent: 1, absent_student: 1 },
        rowCountByPaid: { paid: 2, unpaid: 2 },
        // Exact minor-unit sum: 0.10 + 0.20 + 10.00 — floats would lose this.
        totalPaidAmount: "10.30",
        totalPaidCurrency: CurrencyCode.EGP,
      });
    });

    test("returns an empty page with zeroed aggregates when no rows match", async () => {
      queuedPages = [{ rows: [], totalCount: 0 }];

      const page = await readReport();

      expect(page.aggregates).toEqual({
        rowCountByStatus: { open: 0, end: 0, Absent: 0, absent_student: 0 },
        rowCountByPaid: { paid: 0, unpaid: 0 },
        totalPaidAmount: "0.00",
        totalPaidCurrency: CurrencyCode.SAR,
      });
    });
  });

  describe("default sort", () => {
    test.each<[SessionAuditReportSort | null | undefined, SessionAuditReportSort]>([
      [null, DEFAULT_SORT],
      [undefined, DEFAULT_SORT],
    ])("forwards the scheduled-start default sort when the caller passes %s", async (sort, expected) => {
      await readReport({ sort });

      expect(reportReads[0]?.sort).toEqual(expected);
    });
  });

  describe("filter validation", () => {
    test("rejects an inverted date range before any repository read", async () => {
      const error = await expectServiceError(() =>
        readReport({ filters: { dateFrom: "2026-09-10", dateTo: "2026-09-01" } })
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toHaveProperty("extensions", { code: "INVALID_DATE_RANGE" });
      expect(error.message).toContain("invalid input");
      expect(reportReads).toHaveLength(0);
      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);
    });

    test.each([
      ["non-date garbage", { dateFrom: "not-a-date", dateTo: "2026-09-01" }],
      ["an impossible calendar day", { dateFrom: "2026-02-30", dateTo: "2026-09-01" }],
      ["an impossible month", { dateFrom: "2026-13-01", dateTo: "2026-12-01" }],
      ["an invalid upper bound only", { dateFrom: "2026-09-01", dateTo: "01.09.2026" }],
    ])("rejects %s before any repository read", async (_label, filters) => {
      const error = await expectServiceError(() => readReport({ filters }));

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toHaveProperty("extensions", { code: "INVALID_DATE_RANGE" });
      expect(error.message).toContain("invalid input");
      expect(reportReads).toHaveLength(0);
    });

    test("accepts equal and ascending date bounds", async () => {
      await readReport({ filters: { dateFrom: "2026-09-01", dateTo: "2026-09-01" } });
      await readReport({ filters: { dateFrom: "2026-08-01", dateTo: "2026-09-01" } });
      await readReport({ filters: { dateFrom: null, dateTo: "2026-09-01" } });
      await readReport({ filters: { dateFrom: "2026-09-01" } });

      expect(reportReads).toHaveLength(4);
    });
  });

  describe("default date range", () => {
    test("applies the 30-day window ending today (UTC) when the caller supplies no date bounds", async () => {
      await readReport({ filters: {} });

      expect(reportReads).toHaveLength(1);
      expect(reportReads[0]?.filters).toEqual(expectedDefaultDateRange());
    });

    test("does not override a caller-provided bound and leaves the other open", async () => {
      await readReport({ filters: { dateFrom: "2026-09-01" } });
      await readReport({ filters: { dateTo: "2026-09-30" } });

      expect(reportReads[0]?.filters).toEqual({ dateFrom: "2026-09-01" });
      expect(reportReads[1]?.filters).toEqual({ dateTo: "2026-09-30" });
    });
  });

  describe("last-page clamp", () => {
    test("re-fetches the clamped last page when the offset runs past the result set", async () => {
      const lastPageRows = [buildRow({ instanceId: "last-page-row" })];
      queuedPages = [
        { rows: [], totalCount: 100 },
        { rows: lastPageRows, totalCount: 100 },
      ];

      const page = await readReport({ pagination: { limit: 10, offset: 150 } });

      expect(reportReads).toHaveLength(2);
      expect(reportReads[0]?.offset).toBe(150);
      expect(reportReads[1]?.offset).toBe(90);
      expect(reportReads[1]?.limit).toBe(10);
      expect(page.rows).toEqual(lastPageRows);
      expect(page.totalCount).toBe(100);
    });

    test("does not re-fetch when the offset lands inside the result set", async () => {
      queuedPages = [{ rows: [], totalCount: 100 }];

      await readReport({ pagination: { limit: 10, offset: 90 } });

      expect(reportReads).toHaveLength(1);
    });

    test("does not re-fetch when the result set is empty", async () => {
      queuedPages = [{ rows: [], totalCount: 0 }];

      const page = await readReport({ pagination: { limit: 10, offset: 50 } });

      expect(reportReads).toHaveLength(1);
      expect(page.totalCount).toBe(0);
    });

    test("clamps when the offset equals the result-set size exactly", async () => {
      queuedPages = [
        { rows: [], totalCount: 100 },
        { rows: [buildRow({ instanceId: "boundary-row" })], totalCount: 100 },
      ];

      const page = await readReport({ pagination: { limit: 10, offset: 100 } });

      expect(reportReads).toHaveLength(2);
      expect(reportReads[1]?.offset).toBe(90);
      expect(page.rows[0]?.instanceId).toBe("boundary-row");
    });
  });

  describe("aggregate money math", () => {
    test("excludes malformed paid amounts from the page total instead of counting them as zero", async () => {
      queuedPages = [
        {
          rows: [
            buildRow({ instanceId: "ok", teacherPaidAmount: "10.00" }),
            buildRow({ instanceId: "malformed", teacherPaidAmount: "not-a-number" }),
            buildRow({ instanceId: "blank", teacherPaidAmount: " " }),
          ],
          totalCount: 3,
        },
      ];

      const page = await readReport();

      expect(page.aggregates.totalPaidAmount).toBe("10.00");
    });

    test("rounds amounts with extra fraction digits half-up without float drift", async () => {
      queuedPages = [
        {
          rows: [
            buildRow({ instanceId: "round-up", teacherPaidAmount: "1.255" }),
            buildRow({ instanceId: "round-down", teacherPaidAmount: "2.254" }),
            buildRow({ instanceId: "whole", teacherPaidAmount: "7" }),
          ],
          totalCount: 3,
        },
      ];

      const page = await readReport();

      // 1.255 → 1.26 (half-up), 2.254 → 2.25, 7 → 7.00; exact ints: 126 + 225 + 700 = 1051.
      expect(page.aggregates.totalPaidAmount).toBe("10.51");
    });

    test("formats a negative page total when refund rows outweigh paid rows", async () => {
      queuedPages = [
        {
          rows: [
            buildRow({ instanceId: "refund", teacherPaidAmount: "-20.00" }),
            buildRow({ instanceId: "paid", teacherPaidAmount: "5.00" }),
          ],
          totalCount: 2,
        },
      ];

      const page = await readReport();

      expect(page.aggregates.totalPaidAmount).toBe("-15.00");
    });

    test("keeps the earliest-seen currency when currency tallies tie", async () => {
      queuedPages = [
        {
          rows: [
            buildRow({ instanceId: "sar", teacherPaidAmount: "1.00", teacherPaidCurrency: CurrencyCode.SAR }),
            buildRow({ instanceId: "egp", teacherPaidAmount: "2.00", teacherPaidCurrency: CurrencyCode.EGP }),
          ],
          totalCount: 2,
        },
      ];

      const page = await readReport();

      expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    });
  });

  describe("graceful degradation without payroll snapshots", () => {
    test("passes null payroll columns through and aggregates them as unpaid", async () => {
      const rows = [
        buildUncalculatedRow({ instanceId: "uncalculated", currentStatus: "open" }),
        buildUncalculatedRow({ instanceId: "uncalculated-2", currentStatus: "end" }),
      ];
      queuedPages = [{ rows, totalCount: 2 }];

      const page = await readReport();

      expect(page.rows[0]?.teacherPaidAmount).toBeNull();
      expect(page.rows[0]?.calculationStatus).toBeNull();
      expect(page.rows[1]?.payrollCalculatedAt).toBeNull();
      expect(page.aggregates.rowCountByStatus).toEqual({ open: 1, end: 1, Absent: 0, absent_student: 0 });
      expect(page.aggregates.rowCountByPaid).toEqual({ paid: 0, unpaid: 2 });
      expect(page.aggregates.totalPaidAmount).toBe("0.00");
      expect(page.aggregates.totalPaidCurrency).toBe(CurrencyCode.SAR);
    });
  });

  describe("permission enforcement", () => {
    test("rejects an actor without the reports-view permission before reading anything", async () => {
      permissionError = new ForbiddenError(tErrors.insufficientPermissions);
      queuedPages = [{ rows: [buildRow()], totalCount: 1 }];

      const error = await expectServiceError(() => readReport());

      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error).toHaveProperty("extensions", { code: "FORBIDDEN" });
      expect(error.message).toContain("insufficient permissions");
      expect(reportReads).toHaveLength(0);
      expect(requirePermissionMock).toHaveBeenCalledWith(ACTOR_ID, AppPermission.ACCOUNTING_REPORTS_VIEW, tErrors);
    });
  });
});
