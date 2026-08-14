import { StaffProfileRepository } from "@/backend/db/repo/teachers/staff-profile.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  ManagerDirectoryFilters,
  ManagerDirectoryResult,
  OnboardingMetricsResult,
  PaginationArgs,
  StaffDirectoryAutocompleteRow,
} from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

const STAFF_DIRECTORY_MAX_LIMIT = 100;

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

  export async function getStaffDirectory(
    actorUserId: string,
    search: string | null,
    limit: number,
    permissionGroupFilter: string | null,
    locale?: string
  ): Promise<StaffDirectoryAutocompleteRow[]> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = getServerTranslations(locale ?? "ar").errorsTranslations;
      throw new Error(t.unauthorizedAction);
    }

    const cappedLimit = Math.min(Math.max(limit, 1), STAFF_DIRECTORY_MAX_LIMIT);
    const trimmedSearch = search?.trim() ?? null;

    return await StaffProfileRepository.getStaffDirectoryLite({
      search: trimmedSearch,
      limit: cappedLimit,
      permissionGroupFilter,
    });
  }
}
