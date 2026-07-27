import type { CurrencyCode } from "@/backend/enum";
import type { IanaTimezone } from "@/backend/enum/shared/timezone.enum";

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

export type UpdateRecurringClassRateInput = {
  readonly recurringScheduleId: string;
  /** New hourly rate. Send null to clear the recurring-class override (fall back to subject/teacher). */
  readonly hourlyRate: string | null;
  /** Currency for `hourlyRate`. Required when `hourlyRate` is non-null. */
  readonly rateCurrency: CurrencyCode | null;
};
