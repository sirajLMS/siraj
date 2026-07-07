import type {
  classInstances,
  leaveQuotaUsage,
  recurringScheduleDays,
  recurringSchedules,
  timezones,
} from "@/backend/db/schema";
import type { LeaveRequestStatus, RescheduleDateLabel } from "@/shared/lib/enum";
import type { PageInfo } from "./pagination.types";

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
  status: LeaveRequestStatus;
  dateLabel: RescheduleDateLabel;
  remarks: string | null;
};

export type RescheduleTrackingInput = {
  search?: string | null;
  status?: LeaveRequestStatus | null;
};

export type RescheduleTrackingPaginatedResult = {
  id?: string;
  rows: RescheduleTrackingRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type RescheduleTrackingMetrics = {
  id: string;
  pending: number;
  approved: number;
  leave: number;
  rescheduled: number;
  cancelled: number;
};

export type RecurringClassDayInput = {
  dayOfWeek: string;
  startTime: string;
  isActive: boolean;
};

export type CreateRecurringClassInput = {
  studentId: string;
  teacherId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: string;
  timezoneId?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  days: RecurringClassDayInput[];
  classType?: string | null;
  generateInstancesForWeeks?: number | null;
};

export type CreateRecurringClassReturnType = {
  id: string;
  recurringScheduleId: string;
  classInstanceIds: string[];
  classInstanceCount: number;
};
