import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { CrossStaffSearchInput } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

function getUtcDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function withSearchDefaults(input: CrossStaffSearchInput): CrossStaffSearchInput {
  const today = new Date();
  const weekAhead = new Date(today);
  weekAhead.setUTCDate(weekAhead.getUTCDate() + 7);

  return {
    ...input,
    fromDate: input.fromDate ?? getUtcDateString(today),
    toDate: input.toDate ?? getUtcDateString(weekAhead),
    gender: input.gender ?? null,
    minAvailableDays: input.minAvailableDays ?? null,
    minTotalGaps: input.minTotalGaps ?? null,
    teacherNameSearch: input.teacherNameSearch ?? null,
    daysOfWeek: input.daysOfWeek ?? null,
    sortBy: input.sortBy ?? null,
    paginationArgs: input.paginationArgs ?? null,
  };
}

export namespace AvailabilitySearchService {
  export async function searchAvailability(userId: string, input: CrossStaffSearchInput, locale?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_SEARCH_AVAILABILITY);
      if (!isAuthorized) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      return await TeacherAvailabilityRepository.searchCrossStaffAvailability(withSearchDefaults(input));
    } catch (error) {
      logger.error("Error searching availability", { userId, error });
      throw error;
    }
  }
}
