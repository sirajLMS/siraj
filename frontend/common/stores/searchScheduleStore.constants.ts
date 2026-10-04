import { AvailabilitySearchSortBy, Gender } from "@/frontend/common/graphql/generated/gql/graphql";

export const DATE_FILTER_FORMAT = "yyyy-MM-dd";
export const DEFAULT_PAGE_SIZE = 10;
export const STORAGE_KEY = "search-schedule-storage";

export const VALID_SORT_BY_VALUES = [
  AvailabilitySearchSortBy.MostAvailableDays,
  AvailabilitySearchSortBy.MostGaps,
  AvailabilitySearchSortBy.NameAsc,
  AvailabilitySearchSortBy.NameDesc,
  AvailabilitySearchSortBy.TimezoneAsc,
] as const;

export const VALID_GENDER_VALUES = [Gender.Female, Gender.Male] as const;
