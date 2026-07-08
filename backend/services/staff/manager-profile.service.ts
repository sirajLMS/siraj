import { StaffProfileRepository } from "@/backend/db";
import type { ManagerProfileUpdateInput } from "@/backend/db/repo/staff-profile.repository";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { getBackendTranslations, logger } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import type { ManagerDirectoryRow } from "@/backend/types";

export interface UpdateManagerProfileInput {
  readonly phone?: string | null;
  readonly status?: string | null;
}

export namespace ManagerProfileService {
  export async function updateOwnStaffProfile(
    actorUserId: string,
    targetStaffProfileId: string,
    input: Pick<UpdateManagerProfileInput, "phone">,
    locale?: string
  ): Promise<ManagerDirectoryRow> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    const targetRow = await StaffProfileRepository.findByStaffProfileId(targetStaffProfileId);
    if (!targetRow || targetRow.id !== actorUserId) {
      throw new Error(t("insufficientPermissions"));
    }

    const repoInput: ManagerProfileUpdateInput = {
      phone: input.phone,
      phoneIsSet: input.phone !== undefined,
    };

    const updatedProfile = await StaffProfileRepository.updateManagerProfile(targetStaffProfileId, repoInput, locale);

    logger.info("Own staff profile updated", {
      staffProfileId: targetStaffProfileId,
      actorUserId,
    });

    return updatedProfile;
  }

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
      status: input.status,
      statusIsSet: input.status !== undefined,
    };

    const updatedProfile = await StaffProfileRepository.updateManagerProfile(targetStaffProfileId, repoInput, locale);

    logger.info("Manager profile updated successfully", {
      staffProfileId: targetStaffProfileId,
      actorUserId,
    });

    return updatedProfile;
  }
}
