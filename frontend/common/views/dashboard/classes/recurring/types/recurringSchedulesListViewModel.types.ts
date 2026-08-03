import type { RecurringSchedulesPaginatedResult } from "@/frontend/common/graphql/generated/gql/graphql-types";

export interface RecurringSchedulesListShellLabels {
  readonly pageTitle: string;
  readonly subtitle: string;
  readonly breadcrumbs: readonly { readonly label: string; readonly href?: string }[];
  readonly emptyMessage: string;
  readonly loadError: string;
}

export interface RecurringSchedulesListColumnLabels {
  readonly student: string;
  readonly teacher: string;
  readonly schedule: string;
  readonly duration: string;
  readonly rate: string;
  readonly actions: string;
}

export interface RecurringSchedulesListActionLabels {
  readonly view: string;
  readonly edit: string;
}

export interface RecurringSchedulesListFilterLabels {
  readonly searchPlaceholder: string;
  readonly searchLabel: string;
}

export interface RecurringSchedulesListLabelsBySection {
  readonly shell: RecurringSchedulesListShellLabels;
  readonly columns: RecurringSchedulesListColumnLabels;
  readonly actions: RecurringSchedulesListActionLabels;
  readonly filters: RecurringSchedulesListFilterLabels;
}

export type RecurringScheduleListItem = NonNullable<RecurringSchedulesPaginatedResult["rows"]>[number];

export interface RecurringSchedulesListViewModel {
  readonly labelsBySection: RecurringSchedulesListLabelsBySection;
  readonly loading: boolean;
  readonly error: string | null;
  readonly rows: readonly RecurringScheduleListItem[];
  readonly totalCount: number;
  readonly currentPage: number;
  readonly pageSize: number;
  readonly onPageChange: (page: number) => void;
  readonly onSearchChange: (search: string) => void;
  readonly searchValue: string;
  readonly onRetry: () => void;
}

export interface UseRecurringSchedulesListViewModelProps {
  readonly initialPage?: number;
  readonly initialPageSize?: number;
  readonly onRetry?: () => void;
}
