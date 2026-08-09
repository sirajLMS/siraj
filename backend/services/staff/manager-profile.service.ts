import { StaffProfileRepository, UserRepository } from "@/backend/db";
import { type AccountStatus, AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services";
import type { ManagerDirectoryRow } from "@/backend/types";
import { parseAccountStatus } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

export interface UpdateManagerProfileInput {
  readonly phone?: string | null;
  readonly status?: AccountStatus | null;
  readonly hourlyRate?: string | null;
  readonly rateCurrency?: import("@/backend/enum").CurrencyCode | null;
}

export namespace ManagerProfileService {
  export async function updateOwnStaffProfile(
    actorUserId: string,
    targetStaffProfileId: string,
    input: Pick<UpdateManagerProfileInput, "phone">,
    locale?: string
  ): Promise<ManagerDirectoryRow> {
    const t = getServerTranslations(locale ?? "ar").errorsTranslations;

    const targetRow = await StaffProfileRepository.findByStaffProfileId(targetStaffProfileId);
    if (targetRow?.id !== actorUserId) {
      throw new Error(t.insufficientPermissions);
    }

    if (input.phone !== undefined) {
      await UserRepository.updateProfileFields(actorUserId, { phone: input.phone }, locale);
    }

    const updatedProfile = await StaffProfileRepository.findByStaffProfileId(targetStaffProfileId, undefined, locale);
    if (!updatedProfile) {
      throw new Error(t.staffProfileNotFound);
    }

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
    const t = getServerTranslations(locale ?? "ar").errorsTranslations;

    const hasEditPermission = await PermissionsService.hasAnyPermission(actorUserId, [
      AppPermission.PROFILE_STAFF_ROLE_EDIT_OTHER,
      AppPermission.PROFILE_STAFF_PERMISSIONS_EDIT_OTHER,
    ]);
    if (!hasEditPermission) {
      throw new Error(t.unauthorizedAction);
    }

    const directory = await StaffProfileRepository.getManagerDirectory();
    const targetRow = directory.rows.find(row => row.staffProfileId === targetStaffProfileId);
    if (!targetRow) {
      throw new Error(t.staffProfileNotFound);
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
      throw new Error(t.insufficientPermissions);
    }

    if (input.phone !== undefined) {
      await UserRepository.updateProfileFields(targetRow.id, { phone: input.phone }, locale);
    }

    if (input.status !== undefined && input.status !== null) {
      await UserRepository.updateStatus(targetRow.id, parseAccountStatus(input.status), undefined, locale);
    }

    if (input.hourlyRate !== undefined || input.rateCurrency !== undefined) {
      await StaffProfileRepository.updateManagerProfile(
        targetStaffProfileId,
        {
          hourlyRate: input.hourlyRate ?? null,
          hourlyRateIsSet: input.hourlyRate !== undefined,
          rateCurrency: input.rateCurrency ?? null,
          rateCurrencyIsSet: input.rateCurrency !== undefined,
        },
        locale
      );
    }

    const updatedProfile = await StaffProfileRepository.findByStaffProfileId(targetStaffProfileId, undefined, locale);
    if (!updatedProfile) {
      throw new Error(t.staffProfileNotFound);
    }

    logger.info("Manager profile updated successfully", {
      staffProfileId: targetStaffProfileId,
      actorUserId,
    });

    return updatedProfile;
  }
}
