"use server";

import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { RecurringClassService } from "@/backend/services/schedule/recurring-class.service";
import type { CreateRecurringClassInput } from "@/frontend/graphql/generated/gql/graphql-types";
import { logger } from "@/frontend/utils/logger";
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

export async function createRecurringClass(
  data: RecurringClassFormData,
  locale?: string
): Promise<
  | { success: true; classId: string; recurringScheduleId: string | null; classInstanceCount: number }
  | { success: false; message: string }
> {
  const { userId } = await getServerUserContext();
  if (!userId) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const activeDays = buildActiveDays(data);

    if (activeDays.length === 0) {
      return { success: false, message: "At least one day must be selected" };
    }

    const result = await RecurringClassService.createRecurringClass(
      userId,
      {
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
        timezoneId: undefined,
      },
      locale
    );

    return {
      success: true,
      classId: result.recurringScheduleId ?? "",
      recurringScheduleId: result.recurringScheduleId,
      classInstanceCount: result.classInstanceIds.length,
    };
  } catch (error) {
    logger.error("Failed to create recurring class", { error });
    return { success: false, message: "Failed to create recurring class" };
  }
}

export function mapFormDataToInput(data: RecurringClassFormData): CreateRecurringClassInput {
  const activeDays = buildActiveDays(data);

  return {
    studentId: data.studentId,
    teacherId: data.teacherId,
    durationMinutes: calculateDurationMinutes(data),
    defaultStartTime: data.defaultStartTime,
    timezone: data.timezone,
    classType: data.classType ?? null,
    days: activeDays,
    generateInstancesForWeeks: data.generateInstancesForWeeks ?? 4,
    effectiveFrom: data.effectiveFrom ?? null,
    effectiveUntil: data.effectiveUntil ?? null,
    timezoneId: null,
  };
}
