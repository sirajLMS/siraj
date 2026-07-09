import type { CreateRecurringClassInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { toGraphqlIanaTimezone } from "@/frontend/lib/timezone";
import type { RecurringClassFormData } from "../recurringClassSchema";

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
    durationMinutes: calculateDurationMinutes(data),
    defaultStartTime: data.defaultStartTime,
    timezone: toGraphqlIanaTimezone(data.timezone),
    classType: data.classType ?? null,
    days: activeDays,
    generateInstancesForWeeks: data.generateInstancesForWeeks ?? 4,
    effectiveFrom: data.effectiveFrom ?? null,
    effectiveUntil: data.effectiveUntil ?? null,
  };
}

export function mapFormDataToServiceInput(data: RecurringClassFormData) {
  const activeDays = buildActiveDays(data);

  return {
    studentId: data.studentId,
    teacherId: data.teacherId,
    durationMinutes: calculateDurationMinutes(data),
    defaultStartTime: data.defaultStartTime,
    timezone: data.timezone,
    days: activeDays,
    classType: data.classType,
    effectiveFrom: data.effectiveFrom || undefined,
    effectiveUntil: data.effectiveUntil || undefined,
    generateInstancesForWeeks: data.generateInstancesForWeeks,
  };
}
