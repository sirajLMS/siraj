import type { SearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/types";
import type { SearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";

/** Fields from SearchScheduleViewModel needed to build SearchScheduleFormProps. */
type SearchScheduleFormPropsInput = Pick<
  SearchScheduleViewModel,
  | "labels"
  | "draft"
  | "isInitialLoading"
  | "onDraftChange"
  | "onSearch"
  | "formFilterDrawerOpen"
  | "onOpenFormFilterDrawer"
  | "onCloseFormFilterDrawer"
  | "sortMenuAnchorEl"
  | "onSortMenuOpen"
  | "onSortMenuClose"
  | "onSortChange"
  | "selectedTeacher"
  | "onSelectTeacher"
>;

/** Pick only the SearchScheduleFormProps fields from a SearchScheduleViewModel. */
export function pickSearchScheduleFormProps(
  vm: Readonly<SearchScheduleFormPropsInput>
): Readonly<SearchScheduleFormProps> {
  return {
    labels: vm.labels,
    draft: vm.draft,
    isSearching: vm.isInitialLoading,
    onDraftChange: vm.onDraftChange,
    onSearch: vm.onSearch,
    formFilterDrawerOpen: vm.formFilterDrawerOpen,
    onOpenFormFilterDrawer: vm.onOpenFormFilterDrawer,
    onCloseFormFilterDrawer: vm.onCloseFormFilterDrawer,
    sortMenuAnchorEl: vm.sortMenuAnchorEl,
    onSortMenuOpen: vm.onSortMenuOpen,
    onSortMenuClose: vm.onSortMenuClose,
    onSortChange: vm.onSortChange,
    selectedTeacher: vm.selectedTeacher,
    onSelectTeacher: vm.onSelectTeacher,
  };
}
