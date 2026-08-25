export { DayOfWeek } from "@/shared/constants/day-of-week.enum";

/** Backend-only sort options for teacher-availability search (no shared equivalent). */
export enum AvailabilitySearchSortBy {
  NAME_ASC = "NAME_ASC",
  NAME_DESC = "NAME_DESC",
  MOST_GAPS = "MOST_GAPS",
  MOST_AVAILABLE_DAYS = "MOST_AVAILABLE_DAYS",
  TIMEZONE_ASC = "TIMEZONE_ASC",
}
