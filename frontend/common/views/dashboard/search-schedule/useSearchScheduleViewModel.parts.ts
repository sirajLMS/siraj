import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type {
  useSearchScheduleMainQuery,
  useSearchScheduleMonthDrawer,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.hooks";
import type {
  SearchScheduleHandlers,
  SearchScheduleStoreSlice,
} from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.store";
import type { SearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel.types";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

interface SearchScheduleViewModelParts {
  readonly labels: SearchScheduleLabels;
  readonly requiredPermission: AppPermission;
  readonly store: SearchScheduleStoreSlice;
  readonly handlers: SearchScheduleHandlers;
  readonly mainQuery: ReturnType<typeof useSearchScheduleMainQuery>;
  readonly activeFromDate: string;
  readonly activeToDate: string;
  readonly monthDrawer: ReturnType<typeof useSearchScheduleMonthDrawer>;
}

export function buildSearchScheduleViewModel({
  labels,
  requiredPermission,
  store,
  handlers,
  mainQuery,
  activeFromDate,
  activeToDate,
  monthDrawer,
}: SearchScheduleViewModelParts): SearchScheduleViewModel {
  return {
    labels,
    searchResult: mainQuery.searchResult,
    fromDate: activeFromDate,
    toDate: activeToDate,
    isInitialLoading: mainQuery.isInitialLoading,
    isRefetching: mainQuery.isRefetching,
    hasSearched: store.hasSearched,
    error: mainQuery.error,
    pageInfo: mainQuery.pageInfo,
    teacherCount: mainQuery.teacherCount,
    showPaginationFooter: mainQuery.showPaginationFooter,
    draft: store.draft,
    hasHydrated: store.hasHydrated,
    onDraftChange: store.setDraft,
    onSearch: store.commitSearch,
    onPageChange: store.setPage,
    requiredPermission,
    selectedTeacher: store.selectedTeacher,
    onSelectTeacher: handlers.onSelectTeacher,
    formFilterDrawerOpen: store.formFilterDrawerOpen,
    onOpenFormFilterDrawer: handlers.onOpenFormFilterDrawer,
    onCloseFormFilterDrawer: handlers.onCloseFormFilterDrawer,
    sortMenuAnchorEl: store.sortMenuAnchorEl,
    onSortMenuOpen: handlers.onSortMenuOpen,
    onSortMenuClose: handlers.onSortMenuClose,
    onSortChange: handlers.onSortChange,
    monthDrawerOpen: store.monthDrawerOpen,
    monthDrawerTeacher: monthDrawer.monthDrawerResultItem,
    monthDrawerCurrentMonth: monthDrawer.monthDrawerCurrentDate,
    monthDrawerLoading: monthDrawer.monthDrawerLoading,
    monthDrawerError: monthDrawer.monthDrawerError,
    monthDrawerDaysByDate: monthDrawer.monthDrawerDaysByDate,
    onOpenMonthDrawer: monthDrawer.onOpenMonthDrawer,
    onCloseMonthDrawer: monthDrawer.onCloseMonthDrawer,
    onMonthDrawerChangeMonth: monthDrawer.onMonthDrawerChangeMonth,
  };
}
