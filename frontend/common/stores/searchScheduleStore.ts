import { addDays, format } from "date-fns";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type AvailabilitySearchInput,
  AvailabilitySearchSortBy,
  type Gender,
} from "@/frontend/common/graphql/generated/gql/graphql-types";

const DATE_FILTER_FORMAT = "yyyy-MM-dd";
const DEFAULT_PAGE_SIZE = 10;
const STORAGE_KEY = "search-schedule-storage";

export interface SearchScheduleTeacherOption {
  readonly id: string;
  readonly name: string;
}

// NEW FOR PLAN v5 (newly created for the migration wave): minimal serializable shape for the
// month-drawer's selected teacher. Matches the runtime subset of SearchScheduleResultItem
// used by TeacherAvailabilityMonthDrawer (id + name + timezone + gender + availableDaysCount +
// gaps). Kept in the store so the drawer state survives tier switches. Nullable to structurally
// satisfy SearchScheduleResultItem's optional-null field shapes from the GraphQL layer.
export interface SearchScheduleMonthDrawerTeacher {
  readonly id?: string | null;
  readonly name?: string | null;
  readonly gender?: string | null;
  readonly timezone?: string | null;
  readonly availableDaysCount?: number | null;
  readonly gaps?: readonly ({
    readonly id?: string | null;
    readonly teacherId?: string | null;
    readonly teacherName?: string | null;
    readonly teacherGender?: string | null;
    readonly dayOfWeek?: string | null;
    readonly calendarDate?: string | null;
    readonly gapStartTime?: string | null;
    readonly gapEndTime?: string | null;
    readonly timezone?: string | null;
  } | null)[];
}

function getDefaultFromDate(): string {
  return format(new Date(), DATE_FILTER_FORMAT);
}

function getDefaultToDate(): string {
  return format(addDays(new Date(), 7), DATE_FILTER_FORMAT);
}

export interface SearchScheduleDraftFilters {
  readonly fromTime: string;
  readonly toTime: string;
  readonly fromDate: string;
  readonly toDate: string;
  readonly gender: Gender | null;
  readonly minAvailableDays: number | null;
  readonly minTotalGaps: number | null;
  readonly daysOfWeek: AvailabilitySearchInput["daysOfWeek"];
  readonly sortBy: AvailabilitySearchSortBy;
}

interface PersistedSearchScheduleFilters {
  readonly gender: Gender | null;
  readonly minAvailableDays: number | null;
  readonly minTotalGaps: number | null;
  readonly daysOfWeek: AvailabilitySearchInput["daysOfWeek"];
  readonly sortBy: AvailabilitySearchSortBy;
}

interface PersistedSearchScheduleState {
  readonly draftFilters: PersistedSearchScheduleFilters;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly pageSize: number;
  // NEW FOR PLAN v5: persisted lifted UI state. sortMenuAnchorEl is intentionally absent
  // (DOM element — non-serializable; reset to null on rehydrate).
  readonly formFilterDrawerOpen: boolean;
  readonly monthDrawerOpen: boolean;
  readonly monthDrawerAnchorFromDate: string;
  readonly monthDrawerCurrentMonth: string;
  readonly monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
}

function createDefaultDraftFilters(): SearchScheduleDraftFilters {
  return {
    fromTime: "08:00",
    toTime: "17:00",
    fromDate: getDefaultFromDate(),
    toDate: getDefaultToDate(),
    gender: null,
    minAvailableDays: null,
    minTotalGaps: null,
    daysOfWeek: null,
    sortBy: AvailabilitySearchSortBy.MostAvailableDays,
  };
}

function extractPersistedDraftFilters(draft: SearchScheduleDraftFilters): PersistedSearchScheduleFilters {
  return {
    gender: draft.gender,
    minAvailableDays: draft.minAvailableDays,
    minTotalGaps: draft.minTotalGaps,
    daysOfWeek: draft.daysOfWeek,
    sortBy: draft.sortBy,
  };
}

function isPersistedSearchScheduleState(value: unknown): value is PersistedSearchScheduleState {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "draftFilters" in value &&
    "selectedTeacher" in value &&
    "pageSize" in value &&
    "formFilterDrawerOpen" in value &&
    "monthDrawerOpen" in value &&
    "monthDrawerAnchorFromDate" in value &&
    "monthDrawerCurrentMonth" in value &&
    "monthDrawerTeacher" in value
  );
}

function mergeDraftWithPersistedFilters(
  persistedFilters?: Partial<PersistedSearchScheduleFilters>
): SearchScheduleDraftFilters {
  const defaultDraft = createDefaultDraftFilters();
  if (!persistedFilters) {
    return defaultDraft;
  }

  return {
    ...defaultDraft,
    ...persistedFilters,
  };
}

function resolveTeacherNameSearch(selectedTeacher: SearchScheduleTeacherOption | null): string | null {
  const name = selectedTeacher?.name?.trim() ?? "";
  return name.length > 0 ? name : null;
}

function draftToActiveInput(
  draft: SearchScheduleDraftFilters,
  page: number,
  pageSize: number,
  teacherNameSearch: string | null
): AvailabilitySearchInput {
  return {
    fromTime: draft.fromTime,
    toTime: draft.toTime,
    fromDate: draft.fromDate,
    toDate: draft.toDate,
    gender: draft.gender,
    minAvailableDays: draft.minAvailableDays,
    minTotalGaps: draft.minTotalGaps,
    teacherNameSearch,
    daysOfWeek: draft.daysOfWeek?.length ? draft.daysOfWeek : null,
    sortBy: draft.sortBy,
    paginationArgs: {
      first: pageSize,
      page: page + 1,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    },
  };
}

interface SearchScheduleState {
  readonly draft: SearchScheduleDraftFilters;
  readonly activeInput: AvailabilitySearchInput | null;
  readonly hasSearched: boolean;
  readonly page: number;
  readonly pageSize: number;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly hasHydrated: boolean;
  // NEW FOR PLAN v5: form-filter drawer open state (lifted from searchScheduleForm.{mobile,desktop}.tsx).
  readonly formFilterDrawerOpen: boolean;
  // NEW FOR PLAN v5: sort menu anchor element (lifted from searchScheduleSortMenu.{mobile,desktop}.tsx).
  // Non-serializable DOM element — excluded from persist via partialize below.
  readonly sortMenuAnchorEl: HTMLElement | null;
  // NEW FOR PLAN v5: month drawer open flag (lifted from teacherAvailabilityGrid.{mobile,desktop}.tsx drawerOpen + teacherAvailabilityMonthDrawer.{mobile,desktop}.tsx open).
  readonly monthDrawerOpen: boolean;
  // NEW FOR PLAN v5: anchor ISO date (yyyy-MM-dd) the month drawer opened from.
  readonly monthDrawerAnchorFromDate: string;
  // NEW FOR PLAN v5: ISO date (yyyy-MM-dd) representing the month drawer's currently navigated month.
  readonly monthDrawerCurrentMonth: string;
  // NEW FOR PLAN v5: teacher selected for the month drawer (lifted from teacherAvailabilityMonthDrawer.{mobile,desktop}.tsx).
  readonly monthDrawerTeacher: SearchScheduleMonthDrawerTeacher | null;
  setDraft: (draft: Partial<SearchScheduleDraftFilters>) => void;
  setSelectedTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  commitSearch: () => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  buildActiveInput: () => AvailabilitySearchInput | null;
  // NEW FOR PLAN v5: setters for the lifted drawer/menu/month state.
  setFormFilterDrawerOpen: (open: boolean) => void;
  setSortMenuAnchorEl: (anchor: HTMLElement | null) => void;
  openMonthDrawer: (teacher: SearchScheduleMonthDrawerTeacher, anchorFromDate: string) => void;
  closeMonthDrawer: () => void;
  setMonthDrawerCurrentMonth: (isoMonth: string) => void;
}

export const useSearchScheduleStore = create<SearchScheduleState>()(
  persist(
    (set, get) => ({
      draft: createDefaultDraftFilters(),
      activeInput: null,
      hasSearched: false,
      page: 0,
      pageSize: DEFAULT_PAGE_SIZE,
      selectedTeacher: null,
      hasHydrated: false,
      // NEW FOR PLAN v5 (newly created for the migration wave): default values for the lifted
      // drawer/menu/month state. formFilterDrawerOpen stays false until the toolbar opens it.
      // sortMenuAnchorEl is a non-serializable DOM element — excluded from persist.
      // monthDrawer* fields default to closed with empty anchor.
      formFilterDrawerOpen: false,
      sortMenuAnchorEl: null,
      monthDrawerOpen: false,
      monthDrawerAnchorFromDate: "",
      monthDrawerCurrentMonth: "",
      monthDrawerTeacher: null,
      setDraft: draft =>
        set(state => ({
          draft: { ...state.draft, ...draft },
        })),
      setSelectedTeacher: selectedTeacher => set({ selectedTeacher }),
      setHasHydrated: hasHydrated => set({ hasHydrated }),
      // NEW FOR PLAN v5: form-filter drawer setter — toggles the mobile/desktop filter drawer.
      setFormFilterDrawerOpen: formFilterDrawerOpen => set({ formFilterDrawerOpen }),
      // NEW FOR PLAN v5: sort menu anchor setter — opens/closes the popover menu.
      setSortMenuAnchorEl: sortMenuAnchorEl => set({ sortMenuAnchorEl }),
      // NEW FOR PLAN v5: openMonthDrawer — opens the drawer with the selected teacher and
      // seeds monthDrawerCurrentMonth from the anchor date.
      openMonthDrawer: (teacher, anchorFromDate) =>
        set({
          monthDrawerOpen: true,
          monthDrawerTeacher: teacher,
          monthDrawerAnchorFromDate: anchorFromDate,
          monthDrawerCurrentMonth: anchorFromDate,
        }),
      // NEW FOR PLAN v5: closeMonthDrawer — closes the drawer (keeps the last teacher/month).
      closeMonthDrawer: () => set({ monthDrawerOpen: false }),
      // NEW FOR PLAN v5: setMonthDrawerCurrentMonth — advances the drawer's navigated month.
      setMonthDrawerCurrentMonth: monthDrawerCurrentMonth => set({ monthDrawerCurrentMonth }),
      commitSearch: () => {
        const { draft, pageSize, selectedTeacher } = get();
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher);
        set({
          activeInput: draftToActiveInput(draft, 0, pageSize, teacherNameSearch),
          hasSearched: true,
          page: 0,
        });
      },
      setPage: page => {
        const { draft, pageSize, selectedTeacher } = get();
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher);
        set({
          page,
          activeInput: draftToActiveInput(draft, page, pageSize, teacherNameSearch),
        });
      },
      clearFilters: () =>
        set({
          draft: createDefaultDraftFilters(),
          activeInput: null,
          hasSearched: false,
          page: 0,
          selectedTeacher: null,
          // NEW FOR PLAN v5: also reset all lifted UI state on clearFilters.
          formFilterDrawerOpen: false,
          sortMenuAnchorEl: null,
          monthDrawerOpen: false,
          monthDrawerAnchorFromDate: "",
          monthDrawerCurrentMonth: "",
          monthDrawerTeacher: null,
        }),
      buildActiveInput: () => {
        const { draft, page, pageSize, activeInput, selectedTeacher } = get();
        if (!activeInput) {
          return null;
        }
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher);
        return draftToActiveInput(draft, page, pageSize, teacherNameSearch);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedSearchScheduleState => ({
        draftFilters: extractPersistedDraftFilters(state.draft),
        selectedTeacher: state.selectedTeacher,
        pageSize: state.pageSize,
        // NEW FOR PLAN v5: include the lifted UI state. sortMenuAnchorEl is excluded because it
        // is a DOM element (non-serializable); the menu closes on rehydrate.
        formFilterDrawerOpen: state.formFilterDrawerOpen,
        monthDrawerOpen: state.monthDrawerOpen,
        monthDrawerAnchorFromDate: state.monthDrawerAnchorFromDate,
        monthDrawerCurrentMonth: state.monthDrawerCurrentMonth,
        monthDrawerTeacher: state.monthDrawerTeacher,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isPersistedSearchScheduleState(persistedState) ? persistedState : undefined;

        return {
          ...currentState,
          draft: mergeDraftWithPersistedFilters(persisted?.draftFilters),
          selectedTeacher: persisted?.selectedTeacher ?? null,
          pageSize: persisted?.pageSize ?? currentState.pageSize,
          // NEW FOR PLAN v5: restore lifted UI state from persistence. sortMenuAnchorEl stays
          // null (non-serializable DOM element — menu starts closed after refresh).
          formFilterDrawerOpen: persisted?.formFilterDrawerOpen ?? false,
          sortMenuAnchorEl: null,
          monthDrawerOpen: persisted?.monthDrawerOpen ?? false,
          monthDrawerAnchorFromDate: persisted?.monthDrawerAnchorFromDate ?? "",
          monthDrawerCurrentMonth: persisted?.monthDrawerCurrentMonth ?? "",
          monthDrawerTeacher: persisted?.monthDrawerTeacher ?? null,
        };
      },
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export function buildSearchScheduleInput(
  draft: SearchScheduleDraftFilters,
  page: number,
  pageSize: number,
  teacherNameSearch: string | null
): AvailabilitySearchInput {
  return draftToActiveInput(draft, page, pageSize, teacherNameSearch);
}
