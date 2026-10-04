import type { ErrorLike } from "@apollo/client";
import type { PersonOption } from "@/frontend/common/components/ui/input/userSelect/types";
import type {
  CarryoverBalancesQuery_carryoverBalances_rows,
  CurrencyCode,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { CarryoverPaidStatusFilter } from "@/frontend/common/stores/carryoverFilterStore";
import type { CarryoverLabels } from "@/shared/locale/types/dashboard/accounting/carryover";

/** One row of the carryover balance list. */
export type CarryoverRow = CarryoverBalancesQuery_carryoverBalances_rows;

/** Paid/unpaid row tallies for the full filtered set. */
export interface CarryoverRowCountByPaid {
  readonly paid: number;
  readonly unpaid: number;
}

/** Aggregate footer data derived from the full filtered set, not just the visible page. */
export interface CarryoverAggregates {
  readonly totalPayable: string | null;
  readonly totalPaid: string | null;
  readonly dominantCurrency: CurrencyCode | null;
  readonly rowCountByPaid: CarryoverRowCountByPaid;
}

/** Filter fields exactly as the report consumes them (search already debounced). */
export interface CarryoverFilterFields {
  readonly teacherId: string | null;
  readonly paidStatus: CarryoverPaidStatusFilter;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly includeDisabledTeachers: boolean;
  readonly search: string;
}

/** Result of a completed CSV export download; null means the export failed. */
export interface CarryoverCsvExportOutcome {
  /** True when the exported set exceeded the server-side 10 000-row export ceiling. */
  readonly truncated: boolean;
}

/** Filter, pagination, and bulk-selection state with store actions for the carryover list. */
export interface CarryoverFilterSlice {
  readonly teacherId: string | null;
  /** Selected teacher option (drives the filter autocomplete's displayed selection). */
  readonly teacherOption: PersonOption | null;
  readonly paidStatus: CarryoverPaidStatusFilter;
  readonly dateFrom: string | null;
  readonly dateTo: string | null;
  readonly includeDisabledTeachers: boolean;
  /** Free-text search exactly as typed; the debounced value drives the query and export. */
  readonly search: string;
  /** 0-based server page index. */
  readonly page: number;
  readonly pageSize: number;
  /** Ids of the rows currently checked for bulk actions. */
  readonly selectedIds: readonly string[];
  readonly setTeacher: (teacher: PersonOption | null) => void;
  readonly setPaidStatus: (paidStatus: CarryoverPaidStatusFilter) => void;
  readonly setDateFrom: (dateFrom: string | null) => void;
  readonly setDateTo: (dateTo: string | null) => void;
  readonly setIncludeDisabledTeachers: (includeDisabledTeachers: boolean) => void;
  readonly setSearch: (search: string) => void;
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly toggleSelected: (id: string) => void;
  readonly clearSelection: () => void;
  readonly clearFilters: () => void;
}

export interface CarryoverViewModel extends CarryoverFilterSlice {
  readonly labels: CarryoverLabels;
  readonly rows: readonly CarryoverRow[];
  /** Total rows matching the current filters, across all server pages. */
  readonly totalCount: number;
  readonly aggregates: CarryoverAggregates;
  readonly isLoading: boolean;
  readonly error: ErrorLike | null;
  readonly refetch: () => void;
  readonly onPageChange: (page: number) => void;
  readonly onPageSizeChange: (pageSize: number) => void;
  readonly pageSizeOptions: readonly number[];
  /** True when the caller holds ACCOUNTING_CARRYOVER_VIEW (list access). */
  readonly canViewCarryover: boolean;
  /** True when the caller holds ACCOUNTING_CARRYOVER_MANAGE (Add/Edit/Bulk toolbar). */
  readonly canManageCarryover: boolean;
  readonly handleExportCsv: () => Promise<CarryoverCsvExportOutcome | null>;
}
