import {
  CalculationStatus,
  type CurrencyCode,
  type PayrollReportFilter,
  type PayrollReportQuery_payrollReport_aggregates,
  type PayrollReportQuery_payrollReport_rows,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";

/** Route that streams the filtered report as a CSV download. */
const PAYROLL_EXPORT_URL = "/api/payroll/export";

/** Zero-filled per-status counts, shown while the report has not loaded yet. */
const EMPTY_ROW_COUNTS: Record<CalculationStatus, number> = {
  [CalculationStatus.NotCalculated]: 0,
  [CalculationStatus.Calculated]: 0,
  [CalculationStatus.Partially]: 0,
  [CalculationStatus.Refund]: 0,
  [CalculationStatus.WaitingPaid]: 0,
  [CalculationStatus.Paid]: 0,
};

/** One row of the payroll report (denormalized per-session pay view). */
export type PayrollReportRow = PayrollReportQuery_payrollReport_rows;

/** Aggregate footer data derived from the current filter's full result set. */
export interface PayrollReportAggregates {
  readonly totalPaidAmount: string | null;
  readonly totalPaidCurrency: CurrencyCode | null;
  readonly rowCountByStatus: Record<CalculationStatus, number>;
}

/** Filter fields exactly as the report consumes them (search already debounced). */
export interface PayrollReportFilterFields {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly calculationStatuses: readonly CalculationStatus[];
  readonly search: string;
}

/** Result of a completed CSV export download; null means the export failed. */
export interface PayrollCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Narrow store slice for the payroll report (filter fields + pagination state + actions). */
export interface PayrollReportsFilterSlice {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly calculationStatuses: readonly CalculationStatus[];
  /** Free-text search exactly as typed; the debounced value drives the query and export. */
  readonly search: string;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  readonly setTeacherId: (teacherId: string | null) => void;
  readonly setStudentId: (studentId: string | null) => void;
  readonly setDateFrom: (dateFrom: string | null) => void;
  readonly setDateTo: (dateTo: string | null) => void;
  readonly setCalculationStatuses: (calculationStatuses: readonly CalculationStatus[]) => void;
  readonly setSearch: (search: string) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly clearFilters: () => void;
}

/** True when at least one report filter is actively constraining the query. */
export function hasAnyReportFilter(v: PayrollReportFilterFields): boolean {
  return [
    v.teacherId !== null && v.teacherId !== "",
    v.studentId !== null && v.studentId !== "",
    v.dateFrom !== null && v.dateFrom !== "",
    v.dateTo !== null && v.dateTo !== "",
    v.calculationStatuses.length > 0,
    v.search !== "",
  ].includes(true);
}

/** Maps the report filter fields onto the GraphQL filter input (null when no filter is active). */
export function buildReportFilter(v: PayrollReportFilterFields): PayrollReportFilter | null {
  if (!hasAnyReportFilter(v)) return null;
  return {
    teacherId: v.teacherId,
    studentId: v.studentId,
    dateFrom: v.dateFrom,
    dateTo: v.dateTo,
    calculationStatuses: v.calculationStatuses.length > 0 ? [...v.calculationStatuses] : null,
    search: v.search !== "" ? v.search : null,
  };
}

/** Bridges the locale status labels (literal keys) onto the generated enum keys the status chip consumes. */
export function buildStatusLabels(status: PayrollLabels["status"]): Record<CalculationStatus, string> {
  return {
    [CalculationStatus.NotCalculated]: status.NOT_CALCULATED,
    [CalculationStatus.Calculated]: status.CALCULATED,
    [CalculationStatus.Partially]: status.PARTIALLY,
    [CalculationStatus.Refund]: status.REFUND,
    [CalculationStatus.WaitingPaid]: status.WAITING_PAID,
    [CalculationStatus.Paid]: status.PAID,
  };
}

/** Type guard for the JSON-scalar per-status row counts the API reports as `unknown`. */
function isRowCountByStatus(value: unknown): value is Record<CalculationStatus, number> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(CalculationStatus).every(status => typeof Reflect.get(value, status) === "number");
}

function toRowCountByStatus(value: unknown): Record<CalculationStatus, number> {
  return isRowCountByStatus(value) ? value : EMPTY_ROW_COUNTS;
}

/** Normalizes the nullable aggregate block into the footer-card shape. */
export function toPayrollAggregates(
  aggregates: PayrollReportQuery_payrollReport_aggregates | null | undefined
): PayrollReportAggregates {
  return {
    totalPaidAmount: aggregates?.totalPaidAmount ?? null,
    totalPaidCurrency: aggregates?.totalPaidCurrency ?? null,
    rowCountByStatus: toRowCountByStatus(aggregates?.rowCountByStatus),
  };
}

/**
 * Serializes the current report filters onto the CSV export route. Param names
 * mirror the report filter input one-to-one; statuses are comma-joined (the
 * route also accepts them as repeatable params).
 */
export function buildPayrollExportCsvUrl(fields: PayrollReportFilterFields): string {
  const params = new URLSearchParams();
  if (fields.teacherId !== null && fields.teacherId !== "") params.set("teacherId", fields.teacherId);
  if (fields.studentId !== null && fields.studentId !== "") params.set("studentId", fields.studentId);
  if (fields.dateFrom !== null && fields.dateFrom !== "") params.set("dateFrom", fields.dateFrom);
  if (fields.dateTo !== null && fields.dateTo !== "") params.set("dateTo", fields.dateTo);
  if (fields.calculationStatuses.length > 0) {
    params.set("calculationStatuses", fields.calculationStatuses.join(","));
  }
  if (fields.search !== "") params.set("search", fields.search);
  const query = params.toString();
  return query === "" ? PAYROLL_EXPORT_URL : `${PAYROLL_EXPORT_URL}?${query}`;
}
