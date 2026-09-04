import type { SessionAuditReportRow } from "@/backend/types";

/** Spreadsheet formula starters — cells beginning with one of these are neutralized (OWASP CSV-injection guidance: =, +, -, @, tab, CR). */
const CSV_FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@", "\t", "\r"];
const CSV_LINE_SEPARATOR = "\r\n";

interface CsvColumn {
  readonly header: string;
  readonly pick: (row: SessionAuditReportRow) => string;
}

/** One CSV column per session audit report row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn[] = [
  { header: "instanceId", pick: row => row.instanceId },
  { header: "scheduledStartAt", pick: row => row.scheduledStartAt },
  { header: "scheduledEndAt", pick: row => row.scheduledEndAt },
  { header: "durationMinutes", pick: row => String(row.durationMinutes) },
  { header: "actualStartAt", pick: row => row.actualStartAt ?? "" },
  { header: "actualEndAt", pick: row => row.actualEndAt ?? "" },
  { header: "bookingTimezone", pick: row => row.bookingTimezone ?? "" },
  { header: "currentStatus", pick: row => row.currentStatus },
  { header: "calculatedDuration", pick: row => String(row.calculatedDuration ?? "") },
  { header: "teacherPaidAmount", pick: row => row.teacherPaidAmount ?? "" },
  { header: "teacherPaidCurrency", pick: row => row.teacherPaidCurrency ?? "" },
  { header: "calculationStatus", pick: row => row.calculationStatus ?? "" },
  { header: "isPartialPercentage", pick: row => String(row.isPartialPercentage ?? "") },
  { header: "payrollNote", pick: row => row.payrollNote ?? "" },
  { header: "payrollCalculatedAt", pick: row => row.payrollCalculatedAt ?? "" },
  { header: "teacherId", pick: row => row.teacherId },
  { header: "teacherName", pick: row => row.teacherName },
  { header: "studentId", pick: row => row.studentId },
  { header: "studentName", pick: row => row.studentName },
  { header: "subjectId", pick: row => row.subjectId },
  { header: "subjectName", pick: row => row.subjectName },
  { header: "teacherDuePaymentDate", pick: row => row.teacherDuePaymentDate ?? "" },
];

/** RFC 4180 escaping plus formula neutralization: cells starting with `=`, `+`, `-`, `@`, a tab or a CR get a `'` prefix. */
function toCsvCell(value: string): string {
  const startsFormula = value.length > 0 && CSV_FORMULA_PREFIXES.some(prefix => value.startsWith(prefix));
  const hardened = startsFormula ? `'${value}` : value;
  if (hardened.includes(",") || hardened.includes('"') || hardened.includes("\n") || hardened.includes("\r")) {
    return `"${hardened.replaceAll('"', '""')}"`;
  }
  return hardened;
}

/**
 * Serializes session audit report rows into an RFC 4180 CSV string: a header
 * line, one CRLF-terminated line per row, and a trailing separator after the
 * final line. Nullable fields serialize as empty cells. Pure and synchronous —
 * safe to call on a large pre-fetched row set from request handlers.
 */
export function serializeSessionAuditCsv(rows: readonly SessionAuditReportRow[]): string {
  const headerLine = CSV_COLUMNS.map(column => toCsvCell(column.header)).join(",");
  const dataLines = rows.map(row => CSV_COLUMNS.map(column => toCsvCell(column.pick(row))).join(","));
  return `${[headerLine, ...dataLines].join(CSV_LINE_SEPARATOR)}${CSV_LINE_SEPARATOR}`;
}
