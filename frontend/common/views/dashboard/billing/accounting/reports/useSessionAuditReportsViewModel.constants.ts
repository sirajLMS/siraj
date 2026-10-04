import { SessionAuditStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { SessionAuditReportAggregates } from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel.types";

/** Keystroke-to-query delay for the free-text search box. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Route that renders the filtered report as a CSV download. */
export const SESSION_AUDIT_EXPORT_URL = "/api/accounting/reports/export";

/** Used when the export response carries no Content-Disposition filename. */
export const FALLBACK_EXPORT_FILENAME = "session-audit-report.csv";

/** Zero-filled per-status counts, shown while the report has not loaded yet. */
export const EMPTY_ROW_COUNT_BY_STATUS: Record<SessionAuditStatus, number> = {
  [SessionAuditStatus.Open]: 0,
  [SessionAuditStatus.End]: 0,
  [SessionAuditStatus.Absent]: 0,
  [SessionAuditStatus.AbsentStudent]: 0,
};

/** Safe aggregates shown before the first response or after a failure. */
export const EMPTY_AGGREGATES: SessionAuditReportAggregates = {
  rowCountByStatus: { ...EMPTY_ROW_COUNT_BY_STATUS },
  rowCountByPaid: { paid: 0, unpaid: 0 },
  totalPaidAmount: "0.00",
  totalPaidCurrency: null,
};
