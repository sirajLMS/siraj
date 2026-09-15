import type { RecurringSchedulesQuery_recurringSchedules_rows } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  RecurringSchedulesListActionLabels,
  RecurringSchedulesListColumnLabels,
  RecurringSchedulesListFilterLabels,
} from "@/shared/locale/types/dashboard/classes/recurringSchedulesList";

interface RecurringSchedulesListShellLabels {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly breadcrumbs: readonly { readonly label: string; readonly href?: string }[];
  readonly emptyMessage: string;
  readonly loadError: string;
  readonly retryLabel: string;
}

export interface RecurringSchedulesListLabelsBySection {
  readonly shell: RecurringSchedulesListShellLabels;
  readonly columns: RecurringSchedulesListColumnLabels;
  readonly actions: RecurringSchedulesListActionLabels;
  readonly filters: RecurringSchedulesListFilterLabels;
}

type RecurringScheduleListItem = RecurringSchedulesQuery_recurringSchedules_rows;

export interface RecurringSchedulesListViewModel {
  readonly labelsBySection: RecurringSchedulesListLabelsBySection;
  readonly loading: boolean;
  readonly error: string | null;
  readonly rows: readonly RecurringScheduleListItem[];
  readonly totalCount: number;
  /** 0-based page index — pass straight to `buildServerPaginationOptions`. */
  readonly currentPage: number;
  readonly pageSize: number;
  /** Receives the 0-based page index from the list pagination controls. */
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (search: string) => void;
  readonly searchValue: string;
  readonly onRetry: () => void;
}

export interface UseRecurringSchedulesListViewModelProps {
  /** 1-based first page, as it appears in the `page` URL param. */
  readonly initialPage?: number;
  readonly initialPageSize?: number;
  readonly onRetry?: () => void;
}
