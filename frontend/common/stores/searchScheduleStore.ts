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
  readonly teacherSearchInput: string;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly pageSize: number;
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

function resolveTeacherNameSearch(
  selectedTeacher: SearchScheduleTeacherOption | null,
  teacherSearchInput: string
): string | null {
  const name = selectedTeacher?.name ?? teacherSearchInput.trim();
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
  readonly teacherSearchInput: string;
  readonly debouncedTeacherSearch: string;
  readonly selectedTeacher: SearchScheduleTeacherOption | null;
  readonly _hasHydrated: boolean;
  setDraft: (draft: Partial<SearchScheduleDraftFilters>) => void;
  setTeacherSearchInput: (input: string) => void;
  setDebouncedTeacherSearch: (query: string) => void;
  setSelectedTeacher: (teacher: SearchScheduleTeacherOption | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  commitSearch: () => void;
  setPage: (page: number) => void;
  clearFilters: () => void;
  buildActiveInput: () => AvailabilitySearchInput | null;
}

export const useSearchScheduleStore = create<SearchScheduleState>()(
  persist(
    (set, get) => ({
      draft: createDefaultDraftFilters(),
      activeInput: null,
      hasSearched: false,
      page: 0,
      pageSize: DEFAULT_PAGE_SIZE,
      teacherSearchInput: "",
      debouncedTeacherSearch: "",
      selectedTeacher: null,
      _hasHydrated: false,
      setDraft: draft =>
        set(state => ({
          draft: { ...state.draft, ...draft },
        })),
      setTeacherSearchInput: teacherSearchInput => set({ teacherSearchInput }),
      setDebouncedTeacherSearch: debouncedTeacherSearch => set({ debouncedTeacherSearch }),
      setSelectedTeacher: selectedTeacher =>
        set({
          selectedTeacher,
          teacherSearchInput: selectedTeacher?.name ?? "",
        }),
      setHasHydrated: hasHydrated => set({ _hasHydrated: hasHydrated }),
      commitSearch: () => {
        const { draft, pageSize, selectedTeacher, teacherSearchInput } = get();
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher, teacherSearchInput);
        set({
          activeInput: draftToActiveInput(draft, 0, pageSize, teacherNameSearch),
          hasSearched: true,
          page: 0,
        });
      },
      setPage: page => {
        const { draft, pageSize, selectedTeacher, teacherSearchInput } = get();
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher, teacherSearchInput);
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
          teacherSearchInput: "",
          debouncedTeacherSearch: "",
          selectedTeacher: null,
        }),
      buildActiveInput: () => {
        const { draft, page, pageSize, activeInput, selectedTeacher, teacherSearchInput } = get();
        if (!activeInput) {
          return null;
        }
        const teacherNameSearch = resolveTeacherNameSearch(selectedTeacher, teacherSearchInput);
        return draftToActiveInput(draft, page, pageSize, teacherNameSearch);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedSearchScheduleState => ({
        draftFilters: extractPersistedDraftFilters(state.draft),
        teacherSearchInput: state.teacherSearchInput,
        selectedTeacher: state.selectedTeacher,
        pageSize: state.pageSize,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as PersistedSearchScheduleState | undefined;
        const teacherSearchInput = persisted?.teacherSearchInput ?? "";

        return {
          ...currentState,
          draft: mergeDraftWithPersistedFilters(persisted?.draftFilters),
          teacherSearchInput,
          selectedTeacher: persisted?.selectedTeacher ?? null,
          debouncedTeacherSearch: teacherSearchInput.trim(),
          pageSize: persisted?.pageSize ?? currentState.pageSize,
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
