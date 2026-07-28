"use client";

import type { ErrorLike } from "@apollo/client";
import { NetworkStatus } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { useEffect, useMemo } from "react";
import {
  AppPermission,
  type AvailabilitySearchInput,
  AvailabilitySearchSortBy,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { searchTeacherAvailabilityQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  type SearchScheduleDraftFilters,
  type SearchScheduleMonthDrawerTeacher,
  type SearchScheduleTeacherOption,
  useSearchScheduleStore,
} from "@/frontend/common/stores/searchScheduleStore";
import { buildTeacherMonthAvailabilityInput } from "@/frontend/common/views/dashboard/search-schedule/searchScheduleFilterUtils";
import type { TeacherAvailabilityGapItem } from "@/frontend/common/views/dashboard/search-schedule/types";
import {
  formatIsoDate,
  groupGapsByDayOfMonth,
  parseIsoDate,
} from "@/frontend/common/views/dashboard/search-schedule/utils";
import { Translation, useAppTranslation } from "@/shared/locale";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core/searchSchedule";

export interface SearchScheduleResultItem {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly gender?: string | null;
  readonly timezone?: string | null;
  readonly availableDaysCount?: number | null;
  readonly gaps?:
    | readonly ({
        readonly id?: string | null;
        readonly teacherId?: string | null;
        readonly teacherName?: string | null;
        readonly teacherGender?: string | null;
        readonly dayOfWeek?: string | null;
        readonly calendarDate?: string | null;
        readonly gapStartTime?: string | null;
        readonly gapEndTime?: string | null;
        readonly timezone?: string | null;
      } | null)[]
    | null;
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

  // NEW FOR PLAN v5: form-filter drawer (lifted from searchScheduleForm tier).
  readonly formFilterDrawerOpen: boolean;
  readonly onOpenFormFilterDrawer: () => void;
  readonly onCloseFormFilterDrawer: () => void;

  // NEW FOR PLAN v5: sort menu (lifted from searchScheduleSortMenu tier).
  readonly sortMenuAnchorEl: HTMLElement | null;
  readonly onSortMenuOpen: (event: { readonly currentTarget: HTMLElement }) => void;
  readonly onSortMenuClose: () => void;
  readonly onSortChange: (sortBy: AvailabilitySearchSortBy) => void;

  // NEW FOR PLAN v5: month drawer (lifted from teacherAvailabilityGrid + teacherAvailabilityMonthDrawer tier).
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

const EMPTY_INPUT: AvailabilitySearchInput = {
  fromDate: "",
  toDate: "",
  fromTime: "",
  toTime: "",
  gender: null,
  minAvailableDays: null,
  minTotalGaps: null,
  teacherNameSearch: null,
  daysOfWeek: null,
  sortBy: AvailabilitySearchSortBy.MostAvailableDays,
  paginationArgs: {
    first: null,
    page: null,
    skip: null,
    after: null,
    before: null,
    last: null,
    maxCount: null,
  },
};

function adaptResultItemToStoreTeacher(teacher: SearchScheduleResultItem): SearchScheduleMonthDrawerTeacher {
  return {
    id: teacher.id ?? null,
    name: teacher.name ?? null,
    gender: teacher.gender ?? null,
    timezone: teacher.timezone ?? null,
    availableDaysCount: teacher.availableDaysCount ?? null,
    gaps: (teacher.gaps ?? null) as SearchScheduleMonthDrawerTeacher["gaps"],
  };
}

interface SearchScheduleStoreSlice {
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
}

function useSearchScheduleStoreSlice(): SearchScheduleStoreSlice {
  // Existing search-result state subscription.
  const draft = useSearchScheduleStore(state => state.draft);
  const setDraft = useSearchScheduleStore(state => state.setDraft);
  const activeInput = useSearchScheduleStore(state => state.activeInput);
  const commitSearch = useSearchScheduleStore(state => state.commitSearch);
  const setPage = useSearchScheduleStore(state => state.setPage);
  const hasSearched = useSearchScheduleStore(state => state.hasSearched);
  const hasHydrated = useSearchScheduleStore(state => state._hasHydrated);

  const selectedTeacher = useSearchScheduleStore(state => state.selectedTeacher);
  const setSelectedTeacher = useSearchScheduleStore(state => state.setSelectedTeacher);

  // NEW FOR PLAN v5: subscribe to lifted form-filter drawer + sort menu state.
  const formFilterDrawerOpen = useSearchScheduleStore(state => state.formFilterDrawerOpen);
  const setFormFilterDrawerOpen = useSearchScheduleStore(state => state.setFormFilterDrawerOpen);
  const sortMenuAnchorEl = useSearchScheduleStore(state => state.sortMenuAnchorEl);
  const setSortMenuAnchorEl = useSearchScheduleStore(state => state.setSortMenuAnchorEl);

  // NEW FOR PLAN v5: subscribe to lifted month drawer state.
  const monthDrawerOpen = useSearchScheduleStore(state => state.monthDrawerOpen);
  const monthDrawerAnchorFromDate = useSearchScheduleStore(state => state.monthDrawerAnchorFromDate);
  const monthDrawerCurrentMonthIso = useSearchScheduleStore(state => state.monthDrawerCurrentMonth);
  const monthDrawerTeacher = useSearchScheduleStore(state => state.monthDrawerTeacher);
  const openMonthDrawer = useSearchScheduleStore(state => state.openMonthDrawer);
  const closeMonthDrawer = useSearchScheduleStore(state => state.closeMonthDrawer);
  const setMonthDrawerCurrentMonth = useSearchScheduleStore(state => state.setMonthDrawerCurrentMonth);

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
  };
}

interface SearchScheduleHandlers {
  readonly onSelectTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
  readonly onOpenFormFilterDrawer: () => void;
  readonly onCloseFormFilterDrawer: () => void;
  readonly onSortMenuOpen: (event: { readonly currentTarget: HTMLElement }) => void;
  readonly onSortMenuClose: () => void;
  readonly onSortChange: (sortBy: AvailabilitySearchSortBy) => void;
}

function _useSearchScheduleHandlers(
  setDraft: (draft: Partial<SearchScheduleDraftFilters>) => void,
  setSelectedTeacher: (teacher: SearchScheduleTeacherOption | null) => void,
  setFormFilterDrawerOpen: (open: boolean) => void,
  setSortMenuAnchorEl: (anchor: HTMLElement | null) => void
): SearchScheduleHandlers {
  const onSelectTeacher = (teacher: SearchScheduleTeacherOption | null) => {
    setSelectedTeacher(teacher);
  };

  // NEW FOR PLAN v5: form-filter drawer open/close handlers.
  const onOpenFormFilterDrawer = () => setFormFilterDrawerOpen(true);
  const onCloseFormFilterDrawer = () => setFormFilterDrawerOpen(false);

  // NEW FOR PLAN v5: sort menu open/close handlers. The Menu's anchorEl is set from the click
  // event's currentTarget.
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

function useSearchScheduleMainQuery(activeInput: AvailabilitySearchInput | null) {
  const { data, loading, error, networkStatus, previousData } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: activeInput ? { input: activeInput } : { input: {} as AvailabilitySearchInput },
    skip: activeInput === null,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
  });

  const displayData = data ?? previousData;
  const isInitialLoading = loading && !displayData;
  const isRefetching =
    loading &&
    !!displayData &&
    (networkStatus === NetworkStatus.refetch || networkStatus === NetworkStatus.setVariables);

  const searchResult = displayData?.searchTeacherAvailability;
  const pageInfo = searchResult?.pageInfo;
  const teacherCount = searchResult?.teachers?.length ?? 0;
  const showPaginationFooter = Boolean(pageInfo && (pageInfo.total ?? 0) > 0);

  return {
    data,
    error,
    isInitialLoading,
    isRefetching,
    searchResult,
    pageInfo,
    teacherCount,
    showPaginationFooter,
  };
}

interface UseSearchScheduleMonthDrawerParams {
  draft: SearchScheduleDraftFilters;
  activeFromDate: string;
  monthDrawerOpen: boolean;
  monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
  monthDrawerCurrentMonthIso: string;
  monthDrawerAnchorFromDate: string;
  openMonthDrawer: (teacher: SearchScheduleMonthDrawerTeacher, anchorFromDate: string) => void;
  closeMonthDrawer: () => void;
  setMonthDrawerCurrentMonth: (isoMonth: string) => void;
}

function useSearchScheduleMonthDrawer(params: UseSearchScheduleMonthDrawerParams) {
  const {
    draft,
    activeFromDate,
    monthDrawerOpen,
    monthDrawerTeacher,
    monthDrawerCurrentMonthIso,
    monthDrawerAnchorFromDate,
    openMonthDrawer,
    closeMonthDrawer,
    setMonthDrawerCurrentMonth,
  } = params;
  const monthDrawerCurrentDate = useMemo(() => {
    if (!monthDrawerCurrentMonthIso) {
      // Fall back to the anchor date or today when no month has been navigated yet.
      const fallback = monthDrawerAnchorFromDate || activeFromDate || formatIsoDate(new Date());
      return parseIsoDate(fallback);
    }
    return parseIsoDate(monthDrawerCurrentMonthIso);
  }, [monthDrawerCurrentMonthIso, monthDrawerAnchorFromDate, activeFromDate]);

  const monthDrawerInput = useMemo((): AvailabilitySearchInput | null => {
    const teacher = monthDrawerTeacher;
    if (!teacher?.id || !teacher.name) {
      return null;
    }

    // Adapt the minimal store shape into the SearchScheduleTeacherOption that buildTeacherMonthAvailabilityInput expects.
    return buildTeacherMonthAvailabilityInput(draft, { id: teacher.id, name: teacher.name }, monthDrawerCurrentDate);
  }, [draft, monthDrawerCurrentDate, monthDrawerTeacher]);

  const {
    data: monthDrawerData,
    loading: monthDrawerLoading,
    error: monthDrawerError,
  } = useQuery(searchTeacherAvailabilityQueryDocument, {
    variables: monthDrawerInput ? { input: monthDrawerInput } : { input: EMPTY_INPUT },
    skip: !monthDrawerOpen || monthDrawerInput === null,
    fetchPolicy: "cache-and-network",
  });

  const monthDrawerResultItem: SearchScheduleResultItem | null = useMemo(() => {
    const teachers = monthDrawerData?.searchTeacherAvailability?.teachers ?? [];
    const teacherId = monthDrawerTeacher?.id;
    const matchedById = teacherId ? teachers.find(item => item?.id === teacherId) : null;
    return matchedById ?? teachers[0] ?? null;
  }, [monthDrawerData?.searchTeacherAvailability?.teachers, monthDrawerTeacher?.id]);

  const monthDrawerGaps = (monthDrawerResultItem?.gaps ?? null) as
    | readonly (TeacherAvailabilityGapItem | null)[]
    | null
    | undefined;

  const monthDrawerDaysByDate = useMemo(
    () => groupGapsByDayOfMonth(monthDrawerGaps, monthDrawerCurrentDate),
    [monthDrawerGaps, monthDrawerCurrentDate]
  );

  const onOpenMonthDrawer = (teacher: SearchScheduleResultItem, anchorFromDate: string) => {
    // Adapt SearchScheduleResultItem → the minimal persisted store shape.
    openMonthDrawer(adaptResultItemToStoreTeacher(teacher), anchorFromDate);
  };

  const onCloseMonthDrawer = () => closeMonthDrawer();

  const onMonthDrawerChangeMonth = (next: Date) => {
    setMonthDrawerCurrentMonth(formatIsoDate(next));
  };

  return {
    monthDrawerCurrentDate,
    monthDrawerResultItem,
    monthDrawerLoading,
    monthDrawerError,
    monthDrawerDaysByDate,
    onOpenMonthDrawer,
    onCloseMonthDrawer,
    onMonthDrawerChangeMonth,
  };
}

export function useSearchScheduleViewModel(props?: Readonly<UseSearchScheduleViewModelProps>): SearchScheduleViewModel {
  const requiredPermission = props?.requiredPermission ?? AppPermission.ScheduleSearchAvailability;
  const labels = useAppTranslation(Translation.Dashboard.CoreSearchSchedule);

  const store = useSearchScheduleStoreSlice();

  const { commitSearch, hasHydrated, hasSearched } = store;

  useEffect(() => {
    if (!hasHydrated || hasSearched) {
      return;
    }

    commitSearch();
  }, [commitSearch, hasHydrated, hasSearched]);

  const handlers = _useSearchScheduleHandlers(
    store.setDraft,
    store.setSelectedTeacher,
    store.setFormFilterDrawerOpen,
    store.setSortMenuAnchorEl
  );

  // Main search query (existing behavior — kept unchanged).
  const mainQuery = useSearchScheduleMainQuery(store.activeInput);

  const activeFromDate = useMemo(
    () => store.activeInput?.fromDate ?? store.draft.fromDate,
    [store.activeInput?.fromDate, store.draft.fromDate]
  );
  const activeToDate = useMemo(
    () => store.activeInput?.toDate ?? store.draft.toDate,
    [store.activeInput?.toDate, store.draft.toDate]
  );

  // NEW FOR PLAN v5: month drawer query — uses the same draft + a teacher-specific month window.
  // This was previously an inline custom hook `useMonthDrawerQuery` in the tier files (N25 violation).
  const monthDrawer = useSearchScheduleMonthDrawer({
    draft: store.draft,
    activeFromDate,
    monthDrawerOpen: store.monthDrawerOpen,
    monthDrawerTeacher: store.monthDrawerTeacher,
    monthDrawerCurrentMonthIso: store.monthDrawerCurrentMonthIso,
    monthDrawerAnchorFromDate: store.monthDrawerAnchorFromDate,
    openMonthDrawer: store.openMonthDrawer,
    closeMonthDrawer: store.closeMonthDrawer,
    setMonthDrawerCurrentMonth: store.setMonthDrawerCurrentMonth,
  });

  return buildSearchScheduleViewModel({
    labels,
    requiredPermission,
    store,
    handlers,
    mainQuery,
    activeFromDate,
    activeToDate,
    monthDrawer,
  });
}

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

function buildSearchScheduleViewModel({
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
