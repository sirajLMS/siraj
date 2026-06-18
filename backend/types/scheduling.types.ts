import type {
  classInstances,
  leaveQuotaUsage,
  recurringScheduleDays,
  recurringSchedules,
  timezones,
} from "@/backend/db/schema";

export type RecurringScheduleEntity = typeof recurringSchedules.$inferSelect;
export type RecurringScheduleInsertInput = typeof recurringSchedules.$inferInsert;

export type RecurringScheduleDayEntity = typeof recurringScheduleDays.$inferSelect;
export type RecurringScheduleDayInsertInput = typeof recurringScheduleDays.$inferInsert;

export type ClassInstanceEntity = typeof classInstances.$inferSelect;
export type ClassInstanceInsertInput = typeof classInstances.$inferInsert;

export type LeaveQuotaUsageEntity = typeof leaveQuotaUsage.$inferSelect;
export type LeaveQuotaUsageInsertInput = typeof leaveQuotaUsage.$inferInsert;

export type TimezoneEntity = typeof timezones.$inferSelect;
export type TimezoneInsertInput = typeof timezones.$inferInsert;

export type RescheduleTrackingRow = {
  id: string;
  originalClassId: string | null;
  teacherId: string;
  teacherName: string;
  teacherAvatarUrl: string | null;
  studentId: string;
  studentName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  status: "rescheduled" | "pending_leave";
  dateLabel: "new_date" | "leave_request";
  remarks: string | null;
};

export type RescheduleTrackingInput = {
  search?: string | null;
  status?: string | null;
  limit?: number | null;
  offset?: number | null;
};
