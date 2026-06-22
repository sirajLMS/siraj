import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission } from "@/shared/lib/enum";

export namespace ManagerDirectoryService {
  /**
   * Lists all staff members with administrative backend access and their permission group roles.
   * Requires `staff.view_directory` permission.
   */
  export async function getManagerDirectory(actorUserId: string, locale?: string) {
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_VIEW_DIRECTORY);
    if (!hasPermission) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const rows = await StaffProfileRepository.getManagerDirectory();

    return { rows };
  }
}
