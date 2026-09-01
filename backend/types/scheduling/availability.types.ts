import type { DBTransaction } from "@/backend/types";

export interface SlotAvailabilityInput {
  readonly studentId: string;
  readonly teacherId: string;
  readonly startAt: Date;
  readonly endAt: Date;
  readonly ignoreInstanceIds?: string[];
  readonly locale?: string;
}

interface AssertSchedulePatternAvailableOptions {
  readonly ignoreInstanceIds?: string[];
  readonly locale?: string;
  readonly tx?: DBTransaction;
  readonly durationMinutes?: number;
  readonly timezone?: string;
}

export interface AssertSchedulePatternAvailableInput {
  readonly studentId: string;
  readonly teacherId: string;
  readonly days: { readonly dayOfWeek: string; readonly startTime: string }[];
  readonly startDate: Date;
  readonly endDate: Date;
  readonly options?: AssertSchedulePatternAvailableOptions;
}
