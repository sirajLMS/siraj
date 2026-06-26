import type { ManagerDirectoryRow } from "@/backend/types";
import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";
import type { ManagerProfileUpdateInput } from "@/backend/db/repo/staff-profile.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

export interface UpdateManagerProfileInput {
  readonly phone?: string | null;
  readonly skypeId?: string | null;
}

export namespace ManagerProfileService {
  export async function updateManagerProfile(
    actorUserId: string,
    targetStaffProfileId: string,
    input: UpdateManagerProfileInput,
    locale?: string
  ): Promise<ManagerDirectoryRow> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const hasEditPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (!hasEditPermission) {
      throw new Error(t("unauthorizedAction"));
    }

    const directory = await StaffProfileRepository.getManagerDirectory();
    const targetRow = directory.rows.find(row => row.staffProfileId === targetStaffProfileId);
    if (!targetRow) {
      throw new Error(t("staffProfileNotFound"));
    }

    const actorGroupSlugs = await StaffProfileRepository.getUserPermissionGroupSlugs(actorUserId);

    const targetGroupSlugs = await StaffProfileRepository.getUserPermissionGroupSlugs(targetRow.id);

    const actorIsSuperAdmin = actorGroupSlugs.includes(SystemPermissionGroupSlug.SUPER_ADMIN);
    const targetIsSuperAdmin = targetGroupSlugs.includes(SystemPermissionGroupSlug.SUPER_ADMIN);
    const targetIsAcademyAdmin = targetGroupSlugs.includes(SystemPermissionGroupSlug.ACADEMY_ADMIN);

    if (actorIsSuperAdmin) {
      logger.info("Super Admin updating staff profile", {
        targetStaffProfileId,
        actorUserId,
      });
    } else if (targetIsSuperAdmin || targetIsAcademyAdmin) {
      throw new Error(t("insufficientPermissions"));
    }

    const repoInput: ManagerProfileUpdateInput = {
      phone: input.phone,
      phoneIsSet: input.phone !== undefined,
      skypeId: input.skypeId,
      skypeIdIsSet: input.skypeId !== undefined,
    };

    const updatedProfile = await StaffProfileRepository.updateManagerProfile(targetStaffProfileId, repoInput, locale);

    logger.info("Manager profile updated successfully", {
      staffProfileId: targetStaffProfileId,
      actorUserId,
    });

    return updatedProfile;
  }
}
