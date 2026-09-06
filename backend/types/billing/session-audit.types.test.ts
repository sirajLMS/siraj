import { describe, expect, test } from "bun:test";
import type {
  SessionAuditReportFilters,
  SessionAuditReportPage,
  SessionAuditReportRow,
  SessionAuditReportSort,
  SessionAuditStatus,
} from "@/backend/types";
import type { SessionAuditStatus as CanonicalSessionAuditStatus } from "@/shared/constants/classes/session-audit-status";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { CalculationStatus } from "@/shared/constants/teachers/payroll-calculation.enum";

describe("session-audit.types", () => {
  test("SessionAuditStatus re-export is assignable both ways with the canonical union", () => {
    const statuses: SessionAuditStatus[] = ["open", "end", "Absent", "absent_student"];
    const canonicalRoundTrip: CanonicalSessionAuditStatus[] = statuses;
    const reportRoundTrip: SessionAuditStatus[] = canonicalRoundTrip;
    expect(reportRoundTrip).toEqual(["open", "end", "Absent", "absent_student"]);
  });

  test("SessionAuditReportRow covers scheduling, payroll, and joined surface", () => {
    const row: SessionAuditReportRow = {
      instanceId: "ci-1",
      scheduledStartAt: "2026-09-01T10:00:00.000Z",
      scheduledEndAt: "2026-09-01T11:00:00.000Z",
      durationMinutes: 60,
      actualStartAt: "2026-09-01T10:02:00.000Z",
      actualEndAt: null,
      bookingTimezone: "Africa/Cairo",
      currentStatus: "end",
      calculatedDuration: 58,
      teacherPaidAmount: "150.00",
      teacherPaidCurrency: CurrencyCode.EGP,
      calculationStatus: CalculationStatus.PAID,
      isPartialPercentage: null,
      payrollNote: null,
      payrollCalculatedAt: "2026-09-01T12:00:00.000Z",
      carryoverBalanceId: null,
      teacherId: "teacher-1",
      teacherName: "Ustadh Ahmed",
      studentId: "student-1",
      studentName: "Mariam",
      subjectId: "subject-1",
      subjectName: "Tajwid",
      teacherDuePaymentDate: "2026-09-05",
    };
    expect(row.calculationStatus).toBe(CalculationStatus.PAID);
    expect(row.currentStatus satisfies SessionAuditStatus).toBe("end");
  });

  test("filters and sort accept the documented nullable shapes", () => {
    const filters: SessionAuditReportFilters = {
      teacherId: null,
      studentId: "student-1",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-30",
      currentStatuses: ["open", "absent_student"],
      search: "Mariam",
      includeDeleted: false,
    };
    const sort: SessionAuditReportSort = { field: "scheduledStartAt", direction: "desc" };
    expect(filters.dateFrom).toBe("2026-09-01");
    expect(sort.direction).toBe("desc");
  });

  test("SessionAuditReportPage composes rows, totalCount, and aggregates", () => {
    const page: SessionAuditReportPage = {
      rows: [],
      totalCount: 42,
      aggregates: {
        rowCountByStatus: { open: 0, end: 0, Absent: 0, absent_student: 0 },
        rowCountByPaid: { paid: 0, unpaid: 0 },
        totalPaidAmount: "0.00",
        totalPaidCurrency: CurrencyCode.EGP,
      },
    };
    expect(page.totalCount).toBe(42);
    expect(page.aggregates.rowCountByStatus.open).toBe(0);
  });
});
