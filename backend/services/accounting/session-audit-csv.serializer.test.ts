import { describe, expect, test } from "bun:test";
import { CalculationStatus } from "@/backend/enum";
import { serializeSessionAuditCsv } from "@/backend/services/accounting/session-audit-csv.serializer";
import type { SessionAuditReportRow } from "@/backend/types";
import { CurrencyCode } from "@/shared/constants/currency.enum";

const EXPECTED_HEADER =
  "scheduledStartAt,teacherName,currentStatus,studentName,subjectName,actualStartAt,actualEndAt,durationMinutes,calculatedDuration,teacherPaidAmount,calculationStatus,isPartialPercentage,payrollNote,teacherDuePaymentDate,scheduledEndAt,subjectId,bookingTimezone,teacherPaidCurrency,payrollCalculatedAt,teacherId,studentId,instanceId";

function buildRow(overrides: Partial<SessionAuditReportRow> = {}): SessionAuditReportRow {
  return {
    instanceId: "instance-1",
    scheduledStartAt: "2026-08-01T10:00:00.000Z",
    scheduledEndAt: "2026-08-01T11:00:00.000Z",
    durationMinutes: 60,
    actualStartAt: "2026-08-01T10:02:00.000Z",
    actualEndAt: "2026-08-01T10:58:00.000Z",
    bookingTimezone: "Africa/Cairo",
    currentStatus: "end",
    calculatedDuration: 56,
    teacherPaidAmount: "45.00",
    teacherPaidCurrency: CurrencyCode.EGP,
    calculationStatus: CalculationStatus.PAID,
    isPartialPercentage: null,
    payrollNote: "Calculated on time",
    payrollCalculatedAt: "2026-08-02T09:00:00.000Z",
    teacherId: "teacher-1",
    teacherName: "Mona Adel",
    studentId: "student-1",
    studentName: "Omar Ali",
    subjectId: "subject-1",
    subjectName: "Mathematics",
    teacherDuePaymentDate: "2026-08-03",
    ...overrides,
  };
}

describe("serializeSessionAuditCsv", () => {
  test("serializes the header and three rows, each line CRLF-terminated", () => {
    const csv = serializeSessionAuditCsv([
      buildRow({ instanceId: "a" }),
      buildRow({ instanceId: "b" }),
      buildRow({ instanceId: "c" }),
    ]);
    const lines = csv.split("\r\n");

    expect(csv.endsWith("\r\n")).toBe(true);
    expect(lines).toHaveLength(5); // trailing terminator produces one trailing empty segment
    expect(lines[0]).toBe(EXPECTED_HEADER);
    expect(lines[1]).toContain(",a");
    expect(lines[2]).toContain(",b");
    expect(lines[3]).toContain(",c");
    expect(lines[1]).toBe(
      "2026-08-01T10:00:00.000Z,Mona Adel,end,Omar Ali,Mathematics,2026-08-01T10:02:00.000Z,2026-08-01T10:58:00.000Z,60,56,45.00,PAID,,Calculated on time,2026-08-03,2026-08-01T11:00:00.000Z,subject-1,Africa/Cairo,EGP,2026-08-02T09:00:00.000Z,teacher-1,student-1,a"
    );
  });

  test("wraps cells containing commas in double quotes", () => {
    const csv = serializeSessionAuditCsv([buildRow({ payrollNote: "late, and partial" })]);

    expect(csv).toContain('"late, and partial"');
  });

  test("doubles embedded quotes and wraps the cell", () => {
    const csv = serializeSessionAuditCsv([buildRow({ payrollNote: 'said "done" twice' })]);

    expect(csv).toContain('"said ""done"" twice"');
  });

  test("wraps cells containing newlines in double quotes", () => {
    const csv = serializeSessionAuditCsv([buildRow({ payrollNote: "line one\nline two" })]);

    expect(csv).toContain('"line one\nline two"');
  });

  test("serializes an empty row list as the header only", () => {
    expect(serializeSessionAuditCsv([])).toBe(`${EXPECTED_HEADER}\r\n`);
  });

  test("serializes null payroll fields as empty cells", () => {
    const csv = serializeSessionAuditCsv([
      buildRow({
        calculatedDuration: null,
        teacherPaidAmount: null,
        teacherPaidCurrency: null,
        calculationStatus: null,
        isPartialPercentage: null,
        payrollNote: null,
        payrollCalculatedAt: null,
        teacherDuePaymentDate: null,
      }),
    ]);
    const lines = csv.split("\r\n");

    expect(lines[1]).toBe(
      "2026-08-01T10:00:00.000Z,Mona Adel,end,Omar Ali,Mathematics,2026-08-01T10:02:00.000Z,2026-08-01T10:58:00.000Z,60,,,,,,,2026-08-01T11:00:00.000Z,subject-1,Africa/Cairo,,,teacher-1,student-1,instance-1"
    );
  });

  test.each([
    ["formula equals", "=1+1", "'=1+1"],
    ["formula plus", "+cmd|'/c calc'!A0", "'+cmd|'/c calc'!A0"],
    ["formula minus", "-10-5", "'-10-5"],
    ["formula at sign", "@SUM(A1)", "'@SUM(A1)"],
    ["leading tab", "\t=CMD()", "'\t=CMD()"],
    ["leading carriage return", "\r=1+1", `"'\r=1+1"`],
  ])("neutralizes spreadsheet formula injection (%s)", (_label, raw, expected) => {
    const csv = serializeSessionAuditCsv([buildRow({ payrollNote: raw })]);
    const lines = csv.split("\r\n");

    expect(lines[1].split(",")[12]).toBe(expected);
  });

  test("preserves unicode text verbatim and quotes cells that contain a comma", () => {
    const csv = serializeSessionAuditCsv([
      buildRow({
        teacherName: "أحمد علي",
        studentName: "خديجة, سمير",
        payrollNote: "ملاحظة — حساب المعلم، بتجاهل الفاصلة العربية",
      }),
    ]);

    expect(csv).toContain("أحمد علي");
    expect(csv).toContain('"خديجة, سمير"');
    expect(csv).toContain("ملاحظة — حساب المعلم، بتجاهل الفاصلة العربية");
  });

  test("serializes an overlong payroll note verbatim inside a single quoted cell", () => {
    const longNote = `${"note ".repeat(400)},still-going`;
    const csv = serializeSessionAuditCsv([buildRow({ payrollNote: longNote })]);
    const lines = csv.split("\r\n");

    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain(`"${longNote}"`);
  });
});
