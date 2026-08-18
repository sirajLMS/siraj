import type { RateSource } from "@/backend/enum";
import type {
  ClassInstanceSelectType,
  ClassSubjectSelectType,
  RecurringScheduleSelectType,
  TeacherSelectType,
} from "@/backend/types";
import type { CurrencyCode } from "@/shared/constants/currency.enum";

export interface ResolveClassRateInput {
  /** The class instance row (carries the optional admin override snapshot). */
  readonly classInstance: Pick<ClassInstanceSelectType, "rateAmount" | "rateCurrency" | "isRateOverridden">;
  /** The parent recurring schedule (nullable for ad-hoc bookings). */
  readonly recurringSchedule?: Pick<RecurringScheduleSelectType, "hourlyRate" | "rateCurrency"> | null;
  /** The subject row. */
  readonly subject?: Pick<ClassSubjectSelectType, "hourlyRate" | "rateCurrency"> | null;
  /** The teacher row (lowest-precedence fallback). */
  readonly teacher: Pick<TeacherSelectType, "hourlyRate" | "rateCurrency">;
}

export interface ResolvedClassRate {
  /** Hourly rate as a numeric string (matches the `numeric(12,2)` column type). */
  readonly hourlyRate: string;
  /** Currency for `hourlyRate`. */
  readonly currency: CurrencyCode;
  /** Which precedence tier the rate was resolved from. */
  readonly source: RateSource;
}
