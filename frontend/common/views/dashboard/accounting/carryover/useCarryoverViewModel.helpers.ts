import type {
  CarryoverBalancesQuery_carryoverBalances_aggregates,
  CarryoverFilter,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  CARRYOVER_EXPORT_URL,
  FALLBACK_EXPORT_FILENAME,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.constants";
import type {
  CarryoverAggregates,
  CarryoverFilterFields,
  CarryoverRowCountByPaid,
} from "@/frontend/common/views/dashboard/accounting/carryover/useCarryoverViewModel.types";

/** True when at least one filter is actively constraining the query. */
function hasAnyFilter(v: CarryoverFilterFields): boolean {
  return [
    v.teacherId !== null && v.teacherId !== "",
    v.paidStatus !== "Both",
    v.dateFrom !== null && v.dateFrom !== "",
    v.dateTo !== null && v.dateTo !== "",
    v.includeDisabledTeachers,
    v.search !== "",
  ].includes(true);
}

/** Maps the filter fields onto the GraphQL filter input (null when no filter is active). */
export function buildCarryoverFilter(v: CarryoverFilterFields): CarryoverFilter | null {
  if (!hasAnyFilter(v)) return null;
  return {
    teacherId: v.teacherId,
    paidStatus: v.paidStatus === "Both" ? null : v.paidStatus,
    dateFrom: v.dateFrom,
    dateTo: v.dateTo,
    includeDisabledTeachers: v.includeDisabledTeachers,
    search: v.search !== "" ? v.search : null,
  };
}

/** Type guard for the JSON-scalar paid/unpaid tallies the API reports as `unknown`. */
function isRowCountByPaid(value: unknown): value is CarryoverRowCountByPaid {
  if (typeof value !== "object" || value === null) return false;
  return typeof Reflect.get(value, "paid") === "number" && typeof Reflect.get(value, "unpaid") === "number";
}

/** Normalizes the nullable aggregate block (JSON scalar included) into the footer-card shape. */
export function toCarryoverAggregates(
  aggregates: CarryoverBalancesQuery_carryoverBalances_aggregates | null | undefined
): CarryoverAggregates {
  return {
    totalPayable: aggregates?.totalPayable ?? null,
    totalPaid: aggregates?.totalPaid ?? null,
    dominantCurrency: aggregates?.dominantCurrency ?? null,
    rowCountByPaid: isRowCountByPaid(aggregates?.rowCountByPaid) ? aggregates.rowCountByPaid : { paid: 0, unpaid: 0 },
  };
}

/** Pulls the server-provided filename out of a Content-Disposition header. */
export function extractDownloadFilename(disposition: string | null): string {
  if (disposition === null) return FALLBACK_EXPORT_FILENAME;
  const match = /filename="?([^";]+)"?/.exec(disposition);
  return match !== null ? (match[1] ?? FALLBACK_EXPORT_FILENAME) : FALLBACK_EXPORT_FILENAME;
}

/**
 * Serializes the current filters onto the CSV export route. Param names mirror
 * the route contract one-to-one; "Both" is omitted (an absent paidStatus means
 * both on the server) and includeDisabledTeachers is always sent so the export
 * exactly matches the grid the operator is looking at.
 */
export function buildCarryoverExportCsvUrl(fields: CarryoverFilterFields): string {
  const params = new URLSearchParams();
  if (fields.teacherId !== null && fields.teacherId !== "") params.set("teacherId", fields.teacherId);
  if (fields.paidStatus !== "Both") params.set("paidStatus", fields.paidStatus);
  if (fields.dateFrom !== null && fields.dateFrom !== "") params.set("dateFrom", fields.dateFrom);
  if (fields.dateTo !== null && fields.dateTo !== "") params.set("dateTo", fields.dateTo);
  if (fields.search !== "") params.set("search", fields.search);
  params.set("includeDisabledTeachers", String(fields.includeDisabledTeachers));
  return `${CARRYOVER_EXPORT_URL}?${params.toString()}`;
}
