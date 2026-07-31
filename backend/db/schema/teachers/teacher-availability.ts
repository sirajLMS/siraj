import { date, index, integer, pgTable, text, time, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { dayOfWeekEnum, vacationRequestStatusEnum } from "@/backend/db/schema/enums";
import { timezones } from "@/backend/db/schema/shared/timezones";
import { teachers } from "@/backend/db/schema/teachers/teachers";
import { users } from "@/backend/db/schema/users/users";

/**
 * Common columns for teacher availability-related tables.
 */
const commonAvailabilityColumns = {
  id: uuid("id").defaultRandom().primaryKey(),
  teacherId: uuid("teacher_id")
    .notNull()
    .references(() => teachers.id, { onDelete: "cascade" }),
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timezoneId: integer("timezone_id").references(() => timezones.id),
  timezone: varchar("timezone", { length: 100 }).notNull(),
  utcOffsetSnapshot: integer("utc_offset_snapshot"),
  effectiveFrom: date("effective_from"),
  effectiveUntil: date("effective_until"),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
};

/**
 * Teacher Availability Windows table.
 * Defines recurring weekly time slots when a teacher is available for booking.
 */
export const teacherAvailabilityWindows = pgTable(
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
export const teacherRecurringUnavailability = pgTable(
  "teacher_recurring_unavailability",
  {
    ...commonAvailabilityColumns,
    reason: text("reason"),
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
export const teacherVacationRequests = pgTable(
  "teacher_vacation_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => teachers.id, { onDelete: "cascade" }),
    requestedByUserId: uuid("requested_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startAt: timestamp("start_at", { withTimezone: true, precision: 3 }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true, precision: 3 }).notNull(),
    timezoneId: integer("timezone_id").references(() => timezones.id),
    timezone: varchar("timezone", { length: 100 }).notNull(),
    utcOffsetSnapshot: integer("utc_offset_snapshot"),
    reason: text("reason"),
    status: vacationRequestStatusEnum("status").notNull().default("PENDING"),
    processedAt: timestamp("processed_at", { withTimezone: true, precision: 3 }),
    processedByUserId: uuid("processed_by_user_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
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
