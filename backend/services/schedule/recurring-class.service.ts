import { SchedulingRepository } from "@/backend/db/repo/scheduling";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export interface CreateRecurringClassInput {
  studentId: string;
  teacherId: string;
  durationMinutes: number;
  defaultStartTime: string;
  timezone: string;
  timezoneId?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  days: {
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
    startTime: string;
    isActive: boolean;
  }[];
  classType?: "REGULAR" | "TRIAL" | "ADVANCE";
  generateInstancesForWeeks?: number;
}

export namespace RecurringClassService {
  export async function createRecurringClass(userId: string, input: CreateRecurringClassInput, locale?: string) {
    try {
      const hasCreateAccess = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_CREATE_CLASS);
      if (!hasCreateAccess) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      if (!input.days || input.days.length === 0) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("invalidInput"));
      }

      if (input.durationMinutes <= 0) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("invalidInput"));
      }

      const activeDays = input.days.filter(d => d.isActive);
      if (activeDays.length === 0) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("invalidInput"));
      }

      const result = await SchedulingRepository.createRecurringScheduleWithInstances(
        {
          studentId: input.studentId,
          teacherId: input.teacherId,
          durationMinutes: input.durationMinutes,
          defaultStartTime: input.defaultStartTime,
          timezone: input.timezone,
          timezoneId: input.timezoneId,
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
          effectiveUntil: input.effectiveUntil ? new Date(input.effectiveUntil) : null,
          days: input.days,
          classType: input.classType,
          generateInstancesForWeeks: input.generateInstancesForWeeks,
        },
        undefined,
        locale
      );

      return {
        id: result.recurringScheduleId,
        recurringScheduleId: result.recurringScheduleId,
        classInstanceIds: result.classInstanceIds,
        classInstanceCount: result.classInstanceIds.length,
      };
    } catch (error) {
      logger.error("Error creating recurring class", { userId, input, error });
      throw error;
    }
  }
}
