import { DayOfWeek } from "@/backend/enum";

/** Maximum number of recurring schedules to process per batch (unbounded SELECT guard — RP2-8). */
export const MAX_SCHEDULES_PER_RUN = 500;

/**
 * Maximum overlapping existing instances to load per schedule window (unbounded
 * SELECT guard — the query scans a slab of classInstances by date range +
 * student/teacher equality). The 2-week horizon bounds cardinality in
 * practice, but cap defensively to avoid unbounded growth for high-volume
 * teachers.
 */
export const MAX_OVERLAPPING_INSTANCES_PER_SCHEDULE = 1000;

/**
 * Maps the short weekday name returned by `Intl.DateTimeFormat("en-US", { weekday: "short" })`
 * to the canonical DayOfWeek enum value. Used for IANA timezone-aware DOW matching
 * (V3-009) so the weekday is resolved in the schedule's timezone, not server-local time.
 */
export const SHORT_WEEKDAY_TO_ENUM: Record<string, DayOfWeek> = {
  Sun: DayOfWeek.SUNDAY,
  Mon: DayOfWeek.MONDAY,
  Tue: DayOfWeek.TUESDAY,
  Wed: DayOfWeek.WEDNESDAY,
  Thu: DayOfWeek.THURSDAY,
  Fri: DayOfWeek.FRIDAY,
  Sat: DayOfWeek.SATURDAY,
};
