import { StaffProfileRepository } from "@/backend/db/repo/teachers/staff-profile.repository";
import { AppPermission } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  ManagerDirectoryFilters,
  ManagerDirectoryResult,
  OnboardingMetricsResult,
  PaginationArgs,
} from "@/backend/types";

export namespace ManagerDirectoryService {
  export async function getManagerDirectory(
    actorUserId: string,
    pagination: PaginationArgs | null,
    locale?: string,
    filters?: ManagerDirectoryFilters
  ): Promise<ManagerDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return await StaffProfileRepository.getManagerDirectory(pagination, filters, undefined, locale);
  }

  export async function getOnboardingMetrics(actorUserId: string, locale?: string): Promise<OnboardingMetricsResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return await StaffProfileRepository.getOnboardingMetrics();
  }
}
