import type {
  CurrencyCode,
  OrderSortDirection,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";

/** Paid/unpaid row tallies for one report page. */
export interface SessionAuditRowCountByPaid {
  readonly paid: number;
  readonly unpaid: number;
}

/** Aggregate summary for the current report page, normalized from the raw JSON scalars. */
export interface SessionAuditReportAggregates {
  readonly rowCountByStatus: Record<SessionAuditStatus, number>;
  readonly rowCountByPaid: SessionAuditRowCountByPaid;
  readonly totalPaidAmount: string;
  readonly totalPaidCurrency: CurrencyCode | null;
}

/** Filter fields exactly as the report consumes them (search already debounced). */
export interface SessionAuditReportFilterFields {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly currentStatuses: readonly SessionAuditStatus[];
  readonly search: string;
}

/** Filter fields plus the sort pair, as consumed by the CSV export route. */
export interface SessionAuditExportParams extends SessionAuditReportFilterFields {
  readonly sortField: SessionAuditReportSortField;
  readonly sortDirection: OrderSortDirection;
}

/** Result of a completed CSV export download; null means the export failed. */
export interface SessionAuditCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Filter, sort, and pagination state with store actions for the session audit report. */
export interface SessionAuditFilterSlice {
  readonly teacherId: string | null;
  readonly studentId: string | null;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly currentStatuses: readonly SessionAuditStatus[];
  /** Free-text search exactly as typed; the debounced value drives the query and export. */
  readonly search: string;
  readonly sortField: SessionAuditReportSortField;
  readonly sortDirection: OrderSortDirection;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Ids of the rows currently checked for the carryover bulk action. */
  readonly selectedIds: readonly string[];
  readonly setTeacherId: (teacherId: string | null) => void;
  readonly setStudentId: (studentId: string | null) => void;
  readonly setDateFrom: (dateFrom: string | null) => void;
  readonly setDateTo: (dateTo: string | null) => void;
  readonly setCurrentStatuses: (currentStatuses: readonly SessionAuditStatus[]) => void;
  readonly setSearch: (search: string) => void;
  readonly setSort: (sortField: SessionAuditReportSortField, sortDirection: OrderSortDirection) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly clearFilters: () => void;
}
