import type {
  ClassType as BackendClassType,
  CurrencyCode as BackendCurrencyCode,
  DayOfWeek as BackendDayOfWeek,
  OnDemandNoCreditsOutcome as BackendOnDemandNoCreditsOutcome,
  SchedulingMode as BackendSchedulingMode,
} from "@/backend/enum";
import type {
  CreateRecurringClassInput,
  CurrencyCode,
  OnDemandNoCreditsOutcome,
  SchedulingMode,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { toGraphqlIanaTimezone } from "@/frontend/common/lib/timezone";
import type { RecurringClassFormData } from "@/frontend/common/views/dashboard/classes/recurring/recurringClassSchema";

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
    classType: data.classType ?? null,
    days: activeDays,
    generateInstancesForWeeks: data.generateInstancesForWeeks ?? 4,
    effectiveFrom: data.effectiveFrom ?? null,
    effectiveUntil: data.effectiveUntil ?? null,
    hourlyRate: data.hourlyRate ?? null,
    rateCurrency: (data.rateCurrency as CurrencyCode | null) ?? null,
    quotaId: data.quotaId ?? null,
    earmarkedClasses: data.earmarkedClasses ?? null,
    schedulingMode: (data.schedulingMode as SchedulingMode | null) ?? null,
    generationHorizonWeeks: data.generationHorizonWeeks ?? null,
    ondemandNoCreditsOutcome: (data.ondemandNoCreditsOutcome as OnDemandNoCreditsOutcome | null) ?? null,
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
    days: activeDays.map(day => ({
      ...day,
      dayOfWeek: day.dayOfWeek as unknown as BackendDayOfWeek,
    })),
    classType: data.classType as BackendClassType | null | undefined,
    effectiveFrom: data.effectiveFrom || undefined,
    effectiveUntil: data.effectiveUntil || undefined,
    generateInstancesForWeeks: data.generateInstancesForWeeks,
    hourlyRate: data.hourlyRate ?? null,
    rateCurrency: (data.rateCurrency as BackendCurrencyCode | null) ?? null,
    schedulingMode: data.schedulingMode as BackendSchedulingMode | undefined,
    quotaId: data.quotaId ?? undefined,
    earmarkedClasses: data.earmarkedClasses ?? undefined,
    generationHorizonWeeks: data.generationHorizonWeeks ?? undefined,
    ondemandNoCreditsOutcome: data.ondemandNoCreditsOutcome as BackendOnDemandNoCreditsOutcome | undefined,
  };
}
