import type {
  teacherAvailabilityWindows,
  teacherRecurringUnavailability,
  teacherVacationRequests,
} from "@/backend/db/schema";
import type { AvailabilitySearchSortBy, DayOfWeek, Gender } from "@/backend/enum";
import type { PageInfo, PaginationInput } from "@/backend/types";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export type TeacherAvailabilityWindowSelectType = typeof teacherAvailabilityWindows.$inferSelect;
export type TeacherAvailabilityWindowInsertType = typeof teacherAvailabilityWindows.$inferInsert;

export type TeacherRecurringUnavailabilitySelectType = typeof teacherRecurringUnavailability.$inferSelect;
export type TeacherRecurringUnavailabilityInsertType = typeof teacherRecurringUnavailability.$inferInsert;

export type TeacherVacationRequestSelectType = typeof teacherVacationRequests.$inferSelect;
export type TeacherVacationRequestInsertType = typeof teacherVacationRequests.$inferInsert;

export type AvailabilityWindowInput = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  timezone: IanaTimezone;
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
  timezone: IanaTimezone;
  utcOffsetSnapshot?: number | null;
  reason?: string | null;
};

export type ProcessVacationRequestInput = {
  vacationRequestId: string;
};

export interface CrossStaffSearchInput {
  fromTime: string;
  toTime: string;
  fromDate?: string | null;
  toDate?: string | null;
  gender?: Gender | null;
  minAvailableDays?: number | null;
  minTotalGaps?: number | null;
  teacherNameSearch?: string | null;
  daysOfWeek?: DayOfWeek[] | null;
  sortBy?: AvailabilitySearchSortBy | null;
  paginationArgs?: PaginationInput | null;
}

export interface TeacherAvailabilityGap {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherGender: string | null;
  dayOfWeek: DayOfWeek;
  calendarDate: string;
  gapStartTime: string;
  gapEndTime: string;
  timezone: IanaTimezone;
}

export interface AvailabilitySearchTeacher {
  id: string;
  name: string;
  gender: Gender | null;
  timezone: IanaTimezone;
  availableDaysCount: number;
  gaps: TeacherAvailabilityGap[];
}

export interface AvailabilitySearchResult {
  id: string;
  teachers: AvailabilitySearchTeacher[];
  totalGaps: number;
  totalCount: number;
  pageInfo: PageInfo | null;
}
