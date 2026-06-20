import { TeacherAvailabilityRepository } from "@/backend/db/repo/teacher-availability.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, type Gender } from "@/shared/lib/enum";

export interface AvailabilitySearchServiceInput {
  fromTime: string;
  toTime: string;
  gender?: string | null;
}

export namespace AvailabilitySearchService {
  export async function searchAvailability(userId: string, input: AvailabilitySearchServiceInput, locale?: string) {
    try {
      const isAuthorized = await PermissionsService.hasPermission(userId, AppPermission.SCHEDULE_SEARCH_AVAILABILITY);
      if (!isAuthorized) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorizedAction"));
      }

      const genderFilter = input.gender ? (input.gender as Gender) : null;

      return await TeacherAvailabilityRepository.searchCrossStaffAvailability({
        fromTime: input.fromTime,
        toTime: input.toTime,
        gender: genderFilter,
      });
    } catch (error) {
      logger.error("Error searching availability", { userId, error });
      throw error;
    }
  }
}
