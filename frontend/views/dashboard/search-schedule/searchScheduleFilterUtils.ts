import { endOfMonth, format, startOfMonth } from "date-fns";
import {
  type AvailabilitySearchInput,
  AvailabilitySearchSortBy,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import type {
  SearchScheduleDraftFilters,
  SearchScheduleTeacherOption,
} from "@/frontend/common/stores/searchScheduleStore";

const DATE_FILTER_FORMAT = "yyyy-MM-dd";

export function isSortApplied(sortBy: AvailabilitySearchSortBy): boolean {
  return sortBy !== AvailabilitySearchSortBy.MostAvailableDays;
}

export function countActiveDrawerFilters(draft: SearchScheduleDraftFilters): number {
  let count = 0;

  if (draft.gender !== null) {
    count += 1;
  }
  if (draft.minAvailableDays !== null) {
    count += 1;
  }
  if (draft.minTotalGaps !== null) {
    count += 1;
  }
  if (draft.daysOfWeek && draft.daysOfWeek.length > 0) {
    count += 1;
  }

  return count;
}

export function getClearDrawerFiltersPatch(): Partial<SearchScheduleDraftFilters> {
  return {
    gender: null,
    minAvailableDays: null,
    minTotalGaps: null,
    daysOfWeek: null,
  };
}

export function buildTeacherMonthAvailabilityInput(
  draft: SearchScheduleDraftFilters,
  teacher: SearchScheduleTeacherOption,
  month: Date
): AvailabilitySearchInput {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);

  return {
    fromTime: draft.fromTime,
    toTime: draft.toTime,
    fromDate: format(monthStart, DATE_FILTER_FORMAT),
    toDate: format(monthEnd, DATE_FILTER_FORMAT),
    gender: draft.gender,
    minAvailableDays: draft.minAvailableDays,
    minTotalGaps: draft.minTotalGaps,
    teacherNameSearch: teacher.name,
    daysOfWeek: draft.daysOfWeek?.length ? draft.daysOfWeek : null,
    sortBy: draft.sortBy,
    paginationArgs: {
      first: 1,
      page: 1,
      skip: null,
      after: null,
      before: null,
      last: null,
      maxCount: null,
    },
  };
}
