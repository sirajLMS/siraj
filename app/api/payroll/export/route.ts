import { type NextRequest, NextResponse } from "next/server";
import { AppPermission, CalculationStatus } from "@/backend/enum";
import { ForbiddenError, getServerUserContext, logger, ValidationError } from "@/backend/lib";
import { PayrollCalculationService, requirePermission } from "@/backend/services";
import type { PayrollReportFilters, PayrollReportRow } from "@/backend/types";
import { type ErrorsLabels, getServerTranslations } from "@/shared/locale";

/** Server-side ceiling on one CSV export; larger filtered sets are truncated. */
const EXPORT_ROW_LIMIT = 10_000;
/** Free-text search bound, shared with the payroll report GraphQL filter input. */
const SEARCH_MAX_LENGTH = 200;
/** Spreadsheet formula starters — cells beginning with one of these are neutralized (OWASP CSV-injection guidance). */
const CSV_FORMULA_PREFIXES: readonly string[] = ["=", "+", "-", "@"];
const CSV_LINE_SEPARATOR = "\r\n";

interface CsvColumn {
  readonly header: string;
  readonly pick: (row: PayrollReportRow) => string;
}

/** One CSV column per payroll report row field, in the row-contract declaration order. */
const CSV_COLUMNS: readonly CsvColumn[] = [
  { header: "instanceId", pick: row => row.instanceId },
  { header: "scheduledStartAt", pick: row => row.scheduledStartAt },
  { header: "scheduledEndAt", pick: row => row.scheduledEndAt },
  { header: "scheduledDurationMinutes", pick: row => String(row.scheduledDurationMinutes) },
  { header: "actualStartAt", pick: row => row.actualStartAt ?? "" },
  { header: "actualEndAt", pick: row => row.actualEndAt ?? "" },
  { header: "calculatedDuration", pick: row => String(row.calculatedDuration ?? "") },
  { header: "teacherPaidAmount", pick: row => row.teacherPaidAmount ?? "" },
  { header: "teacherPaidCurrency", pick: row => row.teacherPaidCurrency ?? "" },
  { header: "calculationStatus", pick: row => row.calculationStatus },
  { header: "isPartialPercentage", pick: row => String(row.isPartialPercentage ?? "") },
  { header: "payrollNote", pick: row => row.payrollNote ?? "" },
  { header: "teacherId", pick: row => row.teacherId },
  { header: "teacherName", pick: row => row.teacherName },
  { header: "studentId", pick: row => row.studentId },
  { header: "studentName", pick: row => row.studentName },
  { header: "subjectId", pick: row => row.subjectId },
  { header: "subjectName", pick: row => row.subjectName },
  { header: "isStudentAbsence", pick: row => String(row.isStudentAbsence) },
  { header: "isTeacherAbsence", pick: row => String(row.isTeacherAbsence) },
];

const CALCULATION_STATUS_VALUES: ReadonlySet<string> = new Set<string>(Object.values(CalculationStatus));

function isCalculationStatus(value: string): value is CalculationStatus {
  return CALCULATION_STATUS_VALUES.has(value);
}

/** Reads a single query param, trimmed; absent or blank values mean "no filter". */
function readTrimmedParam(searchParams: URLSearchParams, name: string): string | null {
  const value = searchParams.get(name)?.trim() ?? null;
  return value === "" ? null : value;
}

/** Strict `YYYY-MM-DD` check that also rejects impossible calendar days (JS `Date` rolls them over). */
function isCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const constructed = new Date(Date.UTC(year, month - 1, day));
  return (
    constructed.getUTCFullYear() === year && constructed.getUTCMonth() === month - 1 && constructed.getUTCDate() === day
  );
}

/** Reads one query param and validates it: absent/blank → null, invalid value → localized 400 error. */
function readValidatedParam(
  searchParams: URLSearchParams,
  name: string,
  isValid: (value: string) => boolean,
  tErrors: ErrorsLabels
): string | null {
  const value = readTrimmedParam(searchParams, name);
  if (value === null) {
    return null;
  }
  if (!isValid(value)) {
    throw new ValidationError(tErrors.invalidInput);
  }
  return value;
}

/** Accepts both repeatable params (`?status=A&status=B`) and comma-separated values (`?status=A,B`). */
function parseCalculationStatuses(searchParams: URLSearchParams, tErrors: ErrorsLabels): CalculationStatus[] | null {
  const rawValues = searchParams
    .getAll("calculationStatuses")
    .flatMap(raw => raw.split(","))
    .map(raw => raw.trim())
    .filter(raw => raw !== "");
  if (rawValues.length === 0) {
    return null;
  }
  const statuses: CalculationStatus[] = [];
  for (const rawValue of rawValues) {
    if (!isCalculationStatus(rawValue)) {
      throw new ValidationError(tErrors.invalidInput);
    }
    statuses.push(rawValue);
  }
  return statuses;
}

/** Maps the export query string onto the payroll report filter contract; malformed values reject with 400. */
function parsePayrollExportFilters(searchParams: URLSearchParams, tErrors: ErrorsLabels): PayrollReportFilters {
  return {
    teacherId: readTrimmedParam(searchParams, "teacherId"),
    studentId: readTrimmedParam(searchParams, "studentId"),
    dateFrom: readValidatedParam(searchParams, "dateFrom", isCalendarDate, tErrors),
    dateTo: readValidatedParam(searchParams, "dateTo", isCalendarDate, tErrors),
    calculationStatuses: parseCalculationStatuses(searchParams, tErrors),
    search: readValidatedParam(searchParams, "search", isSearchWithinLimit, tErrors),
  };
}

function isSearchWithinLimit(value: string): boolean {
  return value.length <= SEARCH_MAX_LENGTH;
}

/** RFC 4180 escaping plus formula neutralization: cells starting with `=`, `+`, `-` or `@` get a `'` prefix. */
function toCsvCell(value: string): string {
  const startsFormula = value.length > 0 && CSV_FORMULA_PREFIXES.some(prefix => value.startsWith(prefix));
  const hardened = startsFormula ? `'${value}` : value;
  if (hardened.includes(",") || hardened.includes('"') || hardened.includes("\n") || hardened.includes("\r")) {
    return `"${hardened.replaceAll('"', '""')}"`;
  }
  return hardened;
}

function serializePayrollReportCsv(rows: readonly PayrollReportRow[]): string {
  const headerLine = CSV_COLUMNS.map(column => toCsvCell(column.header)).join(",");
  const dataLines = rows.map(row => CSV_COLUMNS.map(column => toCsvCell(column.pick(row))).join(","));
  return `${[headerLine, ...dataLines].join(CSV_LINE_SEPARATOR)}${CSV_LINE_SEPARATOR}`;
}

function buildCsvResponseHeaders(totalCount: number): Headers {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const headers = new Headers();
  headers.set("Content-Type", "text/csv; charset=utf-8");
  headers.set("Content-Disposition", `attachment; filename="payroll-report-${dateStamp}.csv"`);
  headers.set("X-Export-Truncated", totalCount > EXPORT_ROW_LIMIT ? "true" : "false");
  return headers;
}

/**
 * Payroll report CSV export (GET /api/payroll/export).
 *
 * Auth: session cookie via `getServerUserContext` + the
 * `ACCOUNTING_PAYROLL_VIEW` permission, both checked before any payroll data
 * is read. The export reads at most 10 000 rows of the filtered set; when the
 * full set is larger, the response carries `X-Export-Truncated: true` so the
 * UI can warn that the file is incomplete.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const locale = request.headers.get("accept-language")?.split(",")[0]?.split("-")[0] ?? "ar";
  const tErrors = getServerTranslations(locale).errorsTranslations;

  const { userId } = await getServerUserContext();
  if (!userId) {
    return NextResponse.json({ error: tErrors.unauthorized }, { status: 401 });
  }

  try {
    await requirePermission(userId, AppPermission.ACCOUNTING_PAYROLL_VIEW, tErrors);

    const filters = parsePayrollExportFilters(request.nextUrl.searchParams, tErrors);
    const report = await PayrollCalculationService.getReport(
      userId,
      filters,
      { limit: EXPORT_ROW_LIMIT, offset: 0 },
      tErrors
    );

    return new NextResponse(serializePayrollReportCsv(report.rows), {
      status: 200,
      headers: buildCsvResponseHeaders(report.totalCount),
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: tErrors.insufficientPermissions }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error("Payroll CSV export failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: tErrors.internalServerError }, { status: 500 });
  }
}
