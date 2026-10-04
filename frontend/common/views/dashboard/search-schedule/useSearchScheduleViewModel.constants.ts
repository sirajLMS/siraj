import {
  type AvailabilitySearchInput,
  AvailabilitySearchSortBy,
} from "@/frontend/common/graphql/generated/gql/graphql";

export const EMPTY_INPUT: AvailabilitySearchInput = {
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
