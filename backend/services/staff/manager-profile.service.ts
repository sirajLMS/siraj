import type { ManagerDirectoryRow, ManagerProfileUpdateInput } from "@/backend/db/repo/staff-profile.repository";
import { StaffProfileRepository } from "@/backend/db/repo/staff-profile.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

export interface UpdateManagerProfileInput {
  readonly phone?: string | null;
  readonly skypeId?: string | null;
}

export namespace ManagerProfileService {
  /**
   * Updates a manager's profile fields (phone, skypeId).
   * Enforces strict hierarchical privilege checks:
   * - Super Admin can edit any staff profile.
   * - Academy Admin cannot edit Super Admin or other Academy Admin profiles.
   * Requires `staff.edit_profile` permission.
   */
  export async function updateManagerProfile(
    actorUserId: string,
    targetStaffProfileId: string,
    input: UpdateManagerProfileInput,
    locale?: string
  ): Promise<ManagerDirectoryRow> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Step 1: Verify basic permission
    const hasEditPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_EDIT_PROFILE);
    if (!hasEditPermission) {
      throw new Error(t("unauthorizedAction"));
    }

    // Step 2: Find target in manager directory to resolve their userId
    const directory = await StaffProfileRepository.getManagerDirectory();
    const targetRow = directory.find(row => row.staffProfileId === targetStaffProfileId);
    if (!targetRow) {
      throw new Error(t("staffProfileNotFound"));
    }

    // Step 3: Get actor's permission group slugs for hierarchical check
    const actorGroupSlugs = await StaffProfileRepository.getUserPermissionGroupSlugs(actorUserId);

    // Step 4: Get target's permission group slugs
    const targetGroupSlugs = await StaffProfileRepository.getUserPermissionGroupSlugs(targetRow.id);

    // Step 5: Hierarchical privilege check
    const actorIsSuperAdmin = actorGroupSlugs.includes(SystemPermissionGroupSlug.SUPER_ADMIN);
    const targetIsSuperAdmin = targetGroupSlugs.includes(SystemPermissionGroupSlug.SUPER_ADMIN);
    const targetIsAcademyAdmin = targetGroupSlugs.includes(SystemPermissionGroupSlug.ACADEMY_ADMIN);

    // Super Admin can edit anyone
    if (actorIsSuperAdmin) {
      logger.info("Super Admin updating staff profile", {
        targetStaffProfileId,
        actorUserId,
      });
    } else if (targetIsSuperAdmin || targetIsAcademyAdmin) {
      // Non-Super Admin attempting to edit higher-level admin → blocked
      throw new Error(t("insufficientPermissions"));
    }

    // Step 6: Build repo input with IsSet flags for nullable fields
    const repoInput: ManagerProfileUpdateInput = {
      phone: input.phone,
      phoneIsSet: input.phone !== undefined,
      skypeId: input.skypeId,
      skypeIdIsSet: input.skypeId !== undefined,
    };

    // Step 7: Delegate to repository for update
    const updatedProfile = await StaffProfileRepository.updateManagerProfile(targetStaffProfileId, repoInput, locale);

    logger.info("Manager profile updated successfully", {
      staffProfileId: targetStaffProfileId,
      actorUserId,
    });

    return updatedProfile;
  }
}
