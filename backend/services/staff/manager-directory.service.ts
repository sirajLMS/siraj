import { StaffProfileRepository } from "@/backend/db/repo/teachers/staff-profile.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  ManagerDirectoryFilters,
  ManagerDirectoryResult,
  OnboardingMetricsResult,
  PaginationArgs,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export namespace ManagerDirectoryService {
  export async function getManagerDirectory(
    actorUserId: string,
    pagination: PaginationArgs | null,
    locale?: string,
    filters?: ManagerDirectoryFilters
  ): Promise<ManagerDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }

    return await StaffProfileRepository.getManagerDirectory(pagination, filters, undefined, locale);
  }

  export async function getOnboardingMetrics(actorUserId: string, locale?: string): Promise<OnboardingMetricsResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }

    return await StaffProfileRepository.getOnboardingMetrics();
  }
}
