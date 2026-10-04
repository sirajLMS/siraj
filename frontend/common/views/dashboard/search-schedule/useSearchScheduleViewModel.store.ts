"use client";

import type {
  AvailabilitySearchInput,
  AvailabilitySearchSortBy,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  type SearchScheduleDraftFilters,
  type SearchScheduleMonthDrawerTeacher,
  type SearchScheduleTeacherOption,
  useSearchScheduleStore,
} from "@/frontend/common/stores/searchScheduleStore";

export interface SearchScheduleStoreSlice {
  readonly draft: SearchScheduleDraftFilters;
  readonly setDraft: (draft: Partial<SearchScheduleDraftFilters>) => void;
  readonly activeInput: AvailabilitySearchInput | null;
  readonly commitSearch: () => void;
  readonly setPage: (page: number) => void;
  readonly hasSearched: boolean;
  readonly hasHydrated: boolean;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly setSelectedTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
  readonly formFilterDrawerOpen: boolean;
  readonly setFormFilterDrawerOpen: (open: boolean) => void;
  readonly sortMenuAnchorEl: HTMLElement | null;
  readonly setSortMenuAnchorEl: (anchor: HTMLElement | null) => void;
  readonly monthDrawerOpen: boolean;
  readonly monthDrawerAnchorFromDate: string;
  readonly monthDrawerCurrentMonthIso: string;
  readonly monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
  readonly openMonthDrawer: (teacher: SearchScheduleMonthDrawerTeacher, anchorFromDate: string) => void;
  readonly closeMonthDrawer: () => void;
  readonly setMonthDrawerCurrentMonth: (isoMonth: string) => void;
  readonly ensureDraftDates: () => void;
}

export function useSearchScheduleStoreSlice(): SearchScheduleStoreSlice {
  // Existing search-result state subscription.
  const draft = useSearchScheduleStore(state => state.draft);
  const setDraft = useSearchScheduleStore(state => state.setDraft);
  const activeInput = useSearchScheduleStore(state => state.activeInput);
  const commitSearch = useSearchScheduleStore(state => state.commitSearch);
  const setPage = useSearchScheduleStore(state => state.setPage);
  const hasSearched = useSearchScheduleStore(state => state.hasSearched);
  const hasHydrated = useSearchScheduleStore(state => state.hasHydrated);

  const selectedTeacher = useSearchScheduleStore(state => state.selectedTeacher);
  const setSelectedTeacher = useSearchScheduleStore(state => state.setSelectedTeacher);

  // Subscribe to lifted form-filter drawer + sort menu state.
  const formFilterDrawerOpen = useSearchScheduleStore(state => state.formFilterDrawerOpen);
  const setFormFilterDrawerOpen = useSearchScheduleStore(state => state.setFormFilterDrawerOpen);
  const sortMenuAnchorEl = useSearchScheduleStore(state => state.sortMenuAnchorEl);
  const setSortMenuAnchorEl = useSearchScheduleStore(state => state.setSortMenuAnchorEl);

  // Subscribe to lifted month drawer state.
  const monthDrawerOpen = useSearchScheduleStore(state => state.monthDrawerOpen);
  const monthDrawerAnchorFromDate = useSearchScheduleStore(state => state.monthDrawerAnchorFromDate);
  const monthDrawerCurrentMonthIso = useSearchScheduleStore(state => state.monthDrawerCurrentMonth);
  const monthDrawerTeacher = useSearchScheduleStore(state => state.monthDrawerTeacher);
  const openMonthDrawer = useSearchScheduleStore(state => state.openMonthDrawer);
  const closeMonthDrawer = useSearchScheduleStore(state => state.closeMonthDrawer);
  const setMonthDrawerCurrentMonth = useSearchScheduleStore(state => state.setMonthDrawerCurrentMonth);
  const ensureDraftDates = useSearchScheduleStore(state => state.ensureDraftDates);

  return {
    draft,
    setDraft,
    activeInput,
    commitSearch,
    setPage,
    hasSearched,
    hasHydrated,
    selectedTeacher,
    setSelectedTeacher,
    formFilterDrawerOpen,
    setFormFilterDrawerOpen,
    sortMenuAnchorEl,
    setSortMenuAnchorEl,
    monthDrawerOpen,
    monthDrawerAnchorFromDate,
    monthDrawerCurrentMonthIso,
    monthDrawerTeacher,
    openMonthDrawer,
    closeMonthDrawer,
    setMonthDrawerCurrentMonth,
    ensureDraftDates,
  };
}

export interface SearchScheduleHandlers {
  readonly onSelectTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
  readonly onOpenFormFilterDrawer: () => void;
  readonly onCloseFormFilterDrawer: () => void;
  readonly onSortMenuOpen: (event: { readonly currentTarget: HTMLElement }) => void;
  readonly onSortMenuClose: () => void;
  readonly onSortChange: (sortBy: AvailabilitySearchSortBy) => void;
}

export function useSearchScheduleHandlers(
  setDraft: (draft: Partial<SearchScheduleDraftFilters>) => void,
  setSelectedTeacher: (teacher: SearchScheduleTeacherOption | null) => void,
  setFormFilterDrawerOpen: (open: boolean) => void,
  setSortMenuAnchorEl: (anchor: HTMLElement | null) => void
): SearchScheduleHandlers {
  const onSelectTeacher = (teacher: SearchScheduleTeacherOption | null) => {
    setSelectedTeacher(teacher);
  };

  const onOpenFormFilterDrawer = () => setFormFilterDrawerOpen(true);
  const onCloseFormFilterDrawer = () => setFormFilterDrawerOpen(false);

  // The Menu's anchorEl is set from the click event's currentTarget.
  const onSortMenuOpen = (event: { readonly currentTarget: HTMLElement }) => {
    setSortMenuAnchorEl(event.currentTarget);
  };
  const onSortMenuClose = () => setSortMenuAnchorEl(null);
  const onSortChange = (sortBy: AvailabilitySearchSortBy) => {
    setDraft({ sortBy });
    setSortMenuAnchorEl(null);
  };

  return {
    onSelectTeacher,
    onOpenFormFilterDrawer,
    onCloseFormFilterDrawer,
    onSortMenuOpen,
    onSortMenuClose,
    onSortChange,
  };
}
