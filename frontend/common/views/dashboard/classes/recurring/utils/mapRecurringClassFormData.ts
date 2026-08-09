import type {
  ClassType as BackendClassType,
  CurrencyCode as BackendCurrencyCode,
  DayOfWeek as BackendDayOfWeek,
  OnDemandNoCreditsOutcome as BackendOnDemandNoCreditsOutcome,
  SchedulingMode as BackendSchedulingMode,
} from "@/backend/enum";
import type {
  ClassType,
  CreateRecurringClassInput,
  CurrencyCode,
  OnDemandNoCreditsOutcome,
  SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";

const CLASS_TYPE_VALUES: readonly string[] = ["REGULAR", "TRIAL", "ADVANCE"];
const CURRENCY_CODE_VALUES: readonly string[] = [
  "AED", "AUD", "BHD", "CAD", "CHF", "CNY", "DJF", "DZD", "EGP", "EUR",
  "GBP", "ILS", "INR", "IQD", "JOD", "JPY", "KMF", "KWD", "LBP", "LYD",
  "MAD", "MRU", "OMR", "QAR", "SAR", "SDG", "SOS", "SYP", "TND", "TRY",
  "USD", "YER",
];
const SCHEDULING_MODE_VALUES: readonly string[] = ["NUMBER_OF_CLASSES", "ON_DEMAND", "QUOTA"];
const ONDEMAND_OUTCOME_VALUES: readonly string[] = ["AUTO_CANCEL", "AUTO_ABSENT_NO_CREDITS", "REMIND_ONLY"];
const DAY_OF_WEEK_VALUES: readonly string[] = [
  "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY",
];

function toBackendDayOfWeek(value: string): BackendDayOfWeek {
  const match = DAY_OF_WEEK_VALUES.find((v): v is BackendDayOfWeek => v === value);
  if (match === undefined) {
    throw new Error(`Unexpected DayOfWeek value: ${value}`);
  }
  return match;
}

function buildActiveDays(data: RecurringClassFormData) {
  return data.days
    .filter(d => d.enabled)
    .map(d => ({
      dayOfWeek: d.day,
      startTime: d.showOverride ? d.timeOverride : data.defaultStartTime,
      isActive: true,
    }));
}

function calculateDurationMinutes(data: RecurringClassFormData): number {
  return data.durationHours * 60 + data.durationMinutes;
}

export function mapFormDataToInput(data: RecurringClassFormData): CreateRecurringClassInput {
  const activeDays = buildActiveDays(data);

  return {
    studentId: data.studentId,
    teacherId: data.teacherId,
    subjectId: data.subjectId,
    durationMinutes: calculateDurationMinutes(data),
    defaultStartTime: data.defaultStartTime,
    timezone: toGraphqlIanaTimezone(data.timezone),
    classType: CLASS_TYPE_VALUES.find((v): v is ClassType => v === data.classType) ?? null,
    days: activeDays,
    generateInstancesForWeeks: data.generateInstancesForWeeks ?? 4,
    effectiveFrom: data.effectiveFrom ?? null,
    effectiveUntil: data.effectiveUntil ?? null,
    hourlyRate: data.hourlyRate ?? null,
    rateCurrency: CURRENCY_CODE_VALUES.find((v): v is CurrencyCode => v === data.rateCurrency) ?? null,
    quotaId: data.quotaId ?? null,
    earmarkedClasses: data.earmarkedClasses ?? null,
    schedulingMode: SCHEDULING_MODE_VALUES.find((v): v is SchedulingMode => v === data.schedulingMode) ?? null,
    generationHorizonWeeks: data.generationHorizonWeeks ?? null,
    ondemandNoCreditsOutcome: ONDEMAND_OUTCOME_VALUES.find((v): v is OnDemandNoCreditsOutcome => v === data.ondemandNoCreditsOutcome) ?? null,
  };
}

export function mapFormDataToServiceInput(data: RecurringClassFormData) {
  const activeDays = buildActiveDays(data);

  return {
    studentId: data.studentId,
    teacherId: data.teacherId,
    subjectId: data.subjectId,
    durationMinutes: calculateDurationMinutes(data),
    defaultStartTime: data.defaultStartTime,
    timezone: data.timezone,
    days: activeDays.map(day => Object.assign(day, { dayOfWeek: toBackendDayOfWeek(day.dayOfWeek) })),
    classType: CLASS_TYPE_VALUES.find((v): v is BackendClassType => v === data.classType) ?? undefined,
    effectiveFrom: data.effectiveFrom || undefined,
    effectiveUntil: data.effectiveUntil || undefined,
    generateInstancesForWeeks: data.generateInstancesForWeeks,
    hourlyRate: data.hourlyRate ?? null,
    rateCurrency: CURRENCY_CODE_VALUES.find((v): v is BackendCurrencyCode => v === data.rateCurrency) ?? null,
    schedulingMode: SCHEDULING_MODE_VALUES.find((v): v is BackendSchedulingMode => v === data.schedulingMode) ?? undefined,
    quotaId: data.quotaId ?? undefined,
    earmarkedClasses: data.earmarkedClasses ?? undefined,
    generationHorizonWeeks: data.generationHorizonWeeks ?? undefined,
    ondemandNoCreditsOutcome: ONDEMAND_OUTCOME_VALUES.find((v): v is BackendOnDemandNoCreditsOutcome => v === data.ondemandNoCreditsOutcome) ?? undefined,
  };
}
