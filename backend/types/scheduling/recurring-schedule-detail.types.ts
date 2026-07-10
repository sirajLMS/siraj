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
};
