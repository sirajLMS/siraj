import type { ErrorLike } from "@apollo/client";
import type { AppPermission, AvailabilitySearchSortBy } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  SearchScheduleDraftFilters,
  SearchScheduleGapItem,
  SearchScheduleTeacherOption,
} from "@/frontend/common/stores/searchScheduleStore";
import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

export interface SearchScheduleResultItem {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly gender?: string | null;
  readonly timezone?: string | null;
  readonly availableDaysCount?: number | null;
  readonly gaps?: readonly (SearchScheduleGapItem | null)[] | null;
}

export interface SearchSchedulePageInfo {
  readonly count?: number | null;
  readonly currentPage?: number | null;
  readonly hasMorePages?: boolean | null;
  readonly lastPage?: number | null;
  readonly perPage?: number | null;
  readonly total?: number | null;
}

export interface SearchScheduleResultSummary {
  readonly id?: string | null;
  readonly totalGaps?: number | null;
  readonly totalCount?: number | null;
  readonly pageInfo?: SearchSchedulePageInfo | null;
  readonly teachers?: readonly (SearchScheduleResultItem | null)[] | null;
}

export interface UseSearchScheduleViewModelProps {
  readonly requiredPermission?: AppPermission;
}

export interface SearchScheduleViewModel {
  readonly labels: SearchScheduleLabels;
  // Existing search-result state (viewport-agnostic).
  readonly searchResult: SearchScheduleResultSummary | null | undefined;
  readonly fromDate: string;
  readonly toDate: string;
  readonly isInitialLoading: boolean;
  readonly isRefetching: boolean;
  readonly hasSearched: boolean;
  readonly error: ErrorLike | undefined;
  readonly pageInfo: SearchSchedulePageInfo | null | undefined;
  readonly teacherCount: number;
  readonly showPaginationFooter: boolean;
  readonly draft: SearchScheduleDraftFilters;
  readonly hasHydrated: boolean;
  readonly onDraftChange: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly onSearch: () => void;
  readonly onPageChange: (page: number) => void;
  readonly requiredPermission: AppPermission;

  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly onSelectTeacher: (teacher: SearchScheduleTeacherOption | null) => void;

  // Form-filter drawer state lifted from the searchScheduleForm tier.
  readonly formFilterDrawerOpen: boolean;
  readonly onOpenFormFilterDrawer: () => void;
  readonly onCloseFormFilterDrawer: () => void;

  // Sort menu state lifted from the searchScheduleSortMenu tier.
  readonly sortMenuAnchorEl: HTMLElement | null;
  readonly onSortMenuOpen: (event: { readonly currentTarget: HTMLElement }) => void;
  readonly onSortMenuClose: () => void;
  readonly onSortChange: (sortBy: AvailabilitySearchSortBy) => void;

  // Month drawer state lifted from the teacherAvailabilityGrid + teacherAvailabilityMonthDrawer tiers.
  readonly monthDrawerOpen: boolean;
  readonly monthDrawerTeacher: SearchScheduleResultItem | null;
  readonly monthDrawerCurrentMonth: Date;
  readonly monthDrawerLoading: boolean;
  readonly monthDrawerError: unknown;
  readonly monthDrawerDaysByDate: Readonly<Partial<Record<number, readonly TeacherAvailabilityGapItem[]>>>;
  readonly onOpenMonthDrawer: (teacher: SearchScheduleResultItem, anchorFromDate: string) => void;
  readonly onCloseMonthDrawer: () => void;
  readonly onMonthDrawerChangeMonth: (next: Date) => void;
}
