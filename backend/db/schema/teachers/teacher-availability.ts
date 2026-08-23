import {
  createTable,
  index,
  integerColumn,
  textColumn,
  timestampColumn,
  uuidColumn,
  uuidDefaultColumn,
  varcharColumn,
} from "@/backend/db/schema/__shared__/dialectAwareBuilder";
import { dayOfWeekEnum, vacationRequestStatusEnum } from "@/backend/db/schema/enums";
import { timezones } from "@/backend/db/schema/shared/timezones";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";

/**
 * Common columns for teacher availability-related tables.
 */
const commonAvailabilityColumns = {
  id: uuidColumn("id"),
  teacherId: uuidDefaultColumn("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  // PG-only: `time` column has no dialect-aware helper — degraded to TEXT.
  // SQLite stores time strings (HH:MM:SS); app layer handles parsing.
  startTime: textColumn("start_time").notNull(),
  endTime: textColumn("end_time").notNull(),
  timezoneId: integerColumn("timezone_id").references(() => timezones.id),
  timezone: varcharColumn("timezone", { length: 100 }).notNull(),
  utcOffsetSnapshot: integerColumn("utc_offset_snapshot"),
  // PG-only: `date` column has no dialect-aware helper — degraded to TEXT.
  // SQLite stores ISO date strings (YYYY-MM-DD); app layer handles parsing.
  effectiveFrom: textColumn("effective_from"),
  effectiveUntil: textColumn("effective_until"),
  createdAt: timestampColumn("created_at").notNull(),
  updatedAt: timestampColumn("updated_at").notNull(),
};

/**
 * Teacher Availability Windows table.
 * Defines recurring weekly time slots when a teacher is available for booking.
 */
export const teacherAvailabilityWindows = createTable(
  "teacher_availability_windows",
  {
    ...commonAvailabilityColumns,
  },
  table => [
    index("teacher_availability_windows_teacher_id_idx").on(table.teacherId),
    index("teacher_availability_windows_teacher_day_idx").on(table.teacherId, table.dayOfWeek),
  ]
);

/**
 * Teacher Recurring Unavailability table.
 * Defines recurring weekly blocked periods (e.g. lunch breaks, standing commitments).
 */
export const teacherRecurringUnavailability = createTable(
  "teacher_recurring_unavailability",
  {
    ...commonAvailabilityColumns,
    reason: textColumn("reason"),
  },
  table => [
    index("teacher_recurring_unavailability_teacher_id_idx").on(table.teacherId),
    index("teacher_recurring_unavailability_teacher_day_idx").on(table.teacherId, table.dayOfWeek),
  ]
);

/**
 * Teacher Vacation Requests table.
 * Tracks date-range vacation requests with an admin approval workflow.
 */
export const teacherVacationRequests = createTable(
  "teacher_vacation_requests",
  {
    id: uuidColumn("id"),
    teacherId: uuidDefaultColumn("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    requestedByUserId: uuidDefaultColumn("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startAt: timestampColumn("start_at").notNull(),
    endAt: timestampColumn("end_at").notNull(),
    timezoneId: integerColumn("timezone_id").references(() => timezones.id),
    timezone: varcharColumn("timezone", { length: 100 }).notNull(),
    utcOffsetSnapshot: integerColumn("utc_offset_snapshot"),
    reason: textColumn("reason"),
    status: vacationRequestStatusEnum("status").notNull().default("PENDING"),
    processedAt: timestampColumn("processed_at"),
    processedByUserId: uuidDefaultColumn("processed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampColumn("created_at").notNull(),
    updatedAt: timestampColumn("updated_at").notNull(),
  },
  table => [
    index("teacher_vacation_requests_teacher_id_idx").on(table.teacherId),
    index("teacher_vacation_requests_status_idx").on(table.status),
    index("teacher_vacation_requests_start_at_idx").on(table.startAt),
    index("teacher_vacation_requests_end_at_idx").on(table.endAt),
    index("teacher_vacation_requests_requested_by_user_id_idx").on(table.requestedByUserId),
    index("teacher_vacation_requests_processed_by_user_id_idx").on(table.processedByUserId),
  ]
);
