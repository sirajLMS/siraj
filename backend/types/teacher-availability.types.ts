import type {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teacherVacationRequests,
} from "@/backend/db/schema";
import type { DayOfWeek, Gender } from "@/shared/lib/enum";

export type TeacherAvailabilityWindowSelectType = typeof teacherAvailabilityWindows.$inferSelect;
export type TeacherAvailabilityWindowInsertInput = typeof teacherAvailabilityWindows.$inferInsert;

export type TeacherRecurringUnavailabilitySelectType = typeof teacherRecurringUnavailability.$inferSelect;
export type TeacherRecurringUnavailabilityInsertInput = typeof teacherRecurringUnavailability.$inferInsert;

export type TeacherVacationRequestSelectType = typeof teacherVacationRequests.$inferSelect;
export type TeacherVacationRequestInsertInput = typeof teacherVacationRequests.$inferInsert;

export type AvailabilityWindowInput = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: string;
  timezoneId?: number | null;
  utcOffsetSnapshot?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
};

export type RecurringUnavailabilityInput = AvailabilityWindowInput & {
  reason?: string | null;
};

export type SubmitVacationRequestInput = {
  startAt: Date;
  endAt: Date;
  timezone: string;
  timezoneId?: number | null;
  utcOffsetSnapshot?: number | null;
  reason?: string | null;
};

export type ProcessVacationRequestInput = {
  vacationRequestId: string;
};

export interface CrossStaffSearchInput {
  fromTime: string;
  toTime: string;
  gender?: Gender | null;
}

export interface TeacherAvailabilityGap {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherGender: string | null;
  dayOfWeek: DayOfWeek;
  gapStartTime: string;
  gapEndTime: string;
  timezone: string;
}

export interface AvailabilitySearchTeacher {
  id: string;
  name: string;
  gender: Gender | null;
  timezone: string;
  gaps: TeacherAvailabilityGap[];
}

export interface AvailabilitySearchResult {
  id: string;
  teachers: AvailabilitySearchTeacher[];
  totalGaps: number;
}
