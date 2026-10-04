import {
  type SessionAuditReportFilter,
  type SessionAuditReportQuery_sessionAuditReport_aggregates,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  EMPTY_AGGREGATES,
  EMPTY_ROW_COUNT_BY_STATUS,
  FALLBACK_EXPORT_FILENAME,
  SESSION_AUDIT_EXPORT_URL,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.constants";
import type {
  SessionAuditExportParams,
  SessionAuditReportAggregates,
  SessionAuditReportFilterFields,
  SessionAuditRowCountByPaid,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.types";

/** True when at least one report filter is actively constraining the query. */
export function hasAnyReportFilter(f: SessionAuditReportFilterFields): boolean {
  return [
    f.teacherId !== null && f.teacherId !== "",
    f.studentId !== null && f.studentId !== "",
    f.dateFrom !== null && f.dateFrom !== "",
    f.dateTo !== null && f.dateTo !== "",
    f.currentStatuses.length > 0,
    f.search !== "",
  ].includes(true);
}

/** Maps the report filter fields onto the GraphQL filter input (null when no filter is active). */
export function buildReportFilter(f: SessionAuditReportFilterFields): SessionAuditReportFilter | null {
  if (!hasAnyReportFilter(f)) return null;
  return {
    teacherId: f.teacherId,
    studentId: f.studentId,
    dateFrom: f.dateFrom,
    dateTo: f.dateTo,
    currentStatuses: f.currentStatuses.length > 0 ? [...f.currentStatuses] : null,
    search: f.search !== "" ? f.search : null,
    includeDeleted: null,
  };
}

/** Type guard for the JSON-scalar per-status row counts the API reports as `unknown`. */
function isRowCountByStatus(value: unknown): value is Record<SessionAuditStatus, number> {
  if (typeof value !== "object" || value === null) return false;
  return Object.values(SessionAuditStatus).every(status => typeof Reflect.get(value, status) === "number");
}

/** Type guard for the JSON-scalar paid/unpaid tallies the API reports as `unknown`. */
function isRowCountByPaid(value: unknown): value is SessionAuditRowCountByPaid {
  if (typeof value !== "object" || value === null) return false;
  return typeof Reflect.get(value, "paid") === "number" && typeof Reflect.get(value, "unpaid") === "number";
}

/** Normalizes the nullable aggregate block (JSON scalars included) into the footer-card shape. */
export function toSessionAuditAggregates(
  aggregates: SessionAuditReportQuery_sessionAuditReport_aggregates | null | undefined
): SessionAuditReportAggregates {
  if (aggregates === null || aggregates === undefined) return EMPTY_AGGREGATES;
  const { rowCountByStatus, rowCountByPaid } = aggregates;
  return {
    rowCountByStatus: isRowCountByStatus(rowCountByStatus) ? rowCountByStatus : { ...EMPTY_ROW_COUNT_BY_STATUS },
    rowCountByPaid: isRowCountByPaid(rowCountByPaid) ? rowCountByPaid : { paid: 0, unpaid: 0 },
    totalPaidAmount: aggregates.totalPaidAmount ?? "0.00",
    totalPaidCurrency: aggregates.totalPaidCurrency ?? null,
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
export function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? match[1] : FALLBACK_EXPORT_FILENAME;
}

/**
 * Serializes the current report filters and sort onto the CSV export route.
 * Statuses are comma-joined (the route also accepts them as repeatable
 * params) and the sort direction is lowercase per the route contract.
 */
export function buildSessionAuditExportCsvUrl(p: SessionAuditExportParams): string {
  const params = new URLSearchParams();
  if (p.teacherId !== null && p.teacherId !== "") params.set("teacherId", p.teacherId);
  if (p.studentId !== null && p.studentId !== "") params.set("studentId", p.studentId);
  if (p.dateFrom !== null && p.dateFrom !== "") params.set("dateFrom", p.dateFrom);
  if (p.dateTo !== null && p.dateTo !== "") params.set("dateTo", p.dateTo);
  if (p.currentStatuses.length > 0) params.set("currentStatuses", p.currentStatuses.join(","));
  if (p.search !== "") params.set("search", p.search);
  params.set("sortField", p.sortField);
  params.set("sortDirection", p.sortDirection.toLowerCase());
  return `${SESSION_AUDIT_EXPORT_URL}?${params.toString()}`;
}
