import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ManagerDirectoryResult, PaginationArgs } from "@/backend/types";
import { AppPermission } from "@/shared/lib/enum";

export namespace ManagerDirectoryService {
  export async function getManagerDirectory(
    actorUserId: string,
    pagination: PaginationArgs | null,
    locale?: string
  ): Promise<ManagerDirectoryResult> {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    return await StaffProfileRepository.getManagerDirectory(pagination);
  }
}
