import type { PageInfo, RecurringScheduleSelectType } from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

export type RecurringScheduleDayDetailReturnType = {
  readonly id: string;
  readonly dayOfWeek: string;
  readonly startTime: string;
  readonly isActive: boolean;
};

export type RecurringScheduleDetailReturnType = {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly teacherId: string;
  readonly teacherName: string;
  readonly durationMinutes: number;
  readonly defaultStartTime: string;
  readonly timezone: IanaTimezone;
  readonly days: readonly RecurringScheduleDayDetailReturnType[];
  /** Recurring-class-level hourly rate (highest non-override precedence tier). */
  readonly hourlyRate: string | null;
  /** Currency for `hourlyRate`. */
  readonly rateCurrency: CurrencyCode | null;
};

export type RecurringScheduleListItem = {
  readonly id: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly teacherId: string;
  readonly teacherName: string;
  readonly durationMinutes: number;
  readonly defaultStartTime: string;
  readonly timezone: string;
  readonly hourlyRate: string | null;
  readonly rateCurrency: CurrencyCode | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RecurringSchedulesPaginatedResult = {
  readonly id: string;
  readonly rows: readonly RecurringScheduleListItem[];
  readonly totalCount: number;
  readonly pageInfo: PageInfo | null;
};

/**
 * Repository returns rows with studentName and teacherUserName attached via Object.assign
 * but typed as RecurringScheduleSelectType[]. This type represents the actual shape.
 */
export type RecurringScheduleWithNamesReturnType = RecurringScheduleSelectType & {
  readonly studentName: string;
  readonly teacherUserName: string;
};
