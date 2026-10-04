import type { CalculationStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  SessionAuditReportRow,
  SessionAuditReportsViewModel,
} from "@/frontend/common/views/dashboard/billing/accounting/reports/useSessionAuditReportsViewModel";
import type { PayrollLabels } from "@/shared/locale/types/dashboard/billing/payroll";
import type { SessionAuditLabels } from "@/shared/locale/types/dashboard/reports";

/** View-model slice the session audit grid renders from. */
export type SessionAuditDataGridProps = Pick<
  SessionAuditReportsViewModel,
  | "labels"
  | "rows"
  | "totalCount"
  | "aggregates"
  | "isLoading"
  | "error"
  | "refetch"
  | "sortField"
  | "sortDirection"
  | "setSort"
  | "page"
  | "pageSize"
  | "setPage"
  | "setPageSize"
  | "canManageReports"
  | "hasActiveFilters"
  | "clearFilters"
  | "selectedIds"
  | "toggleSelected"
  | "clearSelection"
  | "canManageCarryover"
>;

/** Everything the column builders need to render the session audit grid columns. */
export interface SessionAuditColumnArgs {
  readonly labels: SessionAuditLabels;
  readonly payrollLabels: PayrollLabels;
  readonly calculationStatusLabels: Record<CalculationStatus, string>;
  readonly locale: string;
  readonly canManageReports: boolean;
  readonly onOpenAuditOverride: (row: SessionAuditReportRow) => void;
  readonly onOpenCarryover: (carryoverBalanceId: string) => void;
}
