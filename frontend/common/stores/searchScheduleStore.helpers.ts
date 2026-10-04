import { addDays, format } from "date-fns";
import {
  type AvailabilitySearchInput,
  AvailabilitySearchSortBy,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { DATE_FILTER_FORMAT } from "@/frontend/common/stores/searchScheduleStore.constants";
import type {
  PersistedSearchScheduleFilters,
  SearchScheduleDraftFilters,
  SearchScheduleMonthDrawerTeacher,
  SearchScheduleState,
  SearchScheduleTeacherOption,
} from "@/frontend/common/stores/searchScheduleStore.types";

function getDefaultFromDate(): string {
  return format(new Date(), DATE_FILTER_FORMAT);
}

function getDefaultToDate(): string {
  return format(addDays(new Date(), 7), DATE_FILTER_FORMAT);
}

export function createDefaultDraftFilters(): SearchScheduleDraftFilters {
  return {
    fromTime: "08:00",
    toTime: "17:00",
    fromDate: "",
    toDate: "",
    gender: null,
    minAvailableDays: null,
    minTotalGaps: null,
    daysOfWeek: null,
    sortBy: AvailabilitySearchSortBy.MostAvailableDays,
  };
}

export function extractPersistedDraftFilters(draft: SearchScheduleDraftFilters): PersistedSearchScheduleFilters {
  return {
    gender: draft.gender,
    minAvailableDays: draft.minAvailableDays,
    minTotalGaps: draft.minTotalGaps,
    daysOfWeek: draft.daysOfWeek,
    sortBy: draft.sortBy,
  };
}

export function mergeDraftWithPersistedFilters(
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

export function resolveTeacherNameSearch(selectedTeacher: SearchScheduleTeacherOption | null): string | null {
  const name = selectedTeacher?.name?.trim() ?? "";
  return name.length > 0 ? name : null;
}

export function draftToActiveInput(
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

export function resolveEnsureDraftDates(draft: SearchScheduleDraftFilters): SearchScheduleDraftFilters | null {
  if (draft.fromDate !== "" && draft.toDate !== "") {
    return null;
  }

  return {
    ...draft,
    fromDate: draft.fromDate === "" ? getDefaultFromDate() : draft.fromDate,
    toDate: draft.toDate === "" ? getDefaultToDate() : draft.toDate,
  };
}

export function createClearedSearchScheduleState(): Partial<SearchScheduleState> {
  return {
    draft: createDefaultDraftFilters(),
    activeInput: null,
    hasSearched: false,
    page: 0,
    selectedTeacher: null,
    formFilterDrawerOpen: false,
    sortMenuAnchorEl: null,
    monthDrawerOpen: false,
    monthDrawerAnchorFromDate: "",
    monthDrawerCurrentMonth: "",
    monthDrawerTeacher: null,
  };
}

export function createMonthDrawerOpenedState(
  teacher: SearchScheduleMonthDrawerTeacher,
  anchorFromDate: string
): {
  readonly monthDrawerOpen: true;
  readonly monthDrawerTeacher: SearchScheduleMonthDrawerTeacher;
  readonly monthDrawerAnchorFromDate: string;
  readonly monthDrawerCurrentMonth: string;
} {
  return {
    monthDrawerOpen: true,
    monthDrawerTeacher: teacher,
    monthDrawerAnchorFromDate: anchorFromDate,
    monthDrawerCurrentMonth: anchorFromDate,
  };
}
