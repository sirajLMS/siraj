import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { PermissionManagementRepository, StaffProfileRepository, UserRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { AppPermission, SystemPermissionGroupSlug } from "@/shared/lib/enum";

export interface ManagerOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string | null;
  readonly skypeId?: string | null;
  readonly accountType: "admin" | "manager";
}

export interface ManagerOnboardingResult {
  readonly id: string;
  readonly userId: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly assignedGroupSlug: string;
}

export namespace ManagerOnboardingService {
  export async function createManager(
    actorUserId: string,
    input: ManagerOnboardingInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ManagerOnboardingResult> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Permission check (must have staff.create)
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_CREATE);
    if (!hasPermission) {
      throw new Error(t("insufficientPermissions"));
    }

    // Secondary check: actor must be super_admin
    const actorContext = await PermissionsService.getUserContext(actorUserId);
    if (!actorContext.isSuperAdmin && !actorContext.permissionGroups.includes(SystemPermissionGroupSlug.SUPER_ADMIN)) {
      throw new Error(t("manager.onlySuperAdminCanCreate"));
    }

    // Email uniqueness check
    const emailExists = await UserRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error(t("user.emailAlreadyExists"));
    }

    // Determine permission group based on account type
    const targetGroupSlug =
      input.accountType === "admin" ? SystemPermissionGroupSlug.ACADEMY_ADMIN : SystemPermissionGroupSlug.STAFF_DEFAULT;

    const run = async (txObj: DBTransaction) => {
      // Step 1: Create user record
      const user = await UserRepository.create(
        { name: input.name, email: { value: input.email }, password: input.password },
        locale,
        txObj
      );

      // Step 2: Create staff profile
      const staffProfile = await StaffProfileRepository.create(
        {
          userId: user.id,
          phone: input.phone ?? null,
          skypeId: input.skypeId ?? null,
          status: "ACTIVATED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        txObj,
        locale
      );

      // Step 3: Assign to target permission group
      const groups = await PermissionManagementRepository.listAllGroups(txObj);
      const targetGroup = groups.find(g => g.slug === targetGroupSlug);
      if (!targetGroup) {
        throw new Error(t("permission.groupNotFound"));
      }

      await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], targetGroup.id, actorUserId, txObj);

      logger.info("Manager onboarded successfully", {
        staffProfileId: staffProfile.id,
        userId: user.id,
        accountType: input.accountType,
        assignedGroup: targetGroupSlug,
      });

      return {
        id: staffProfile.id,
        userId: user.id,
        staffProfileId: staffProfile.id,
        name: user.name,
        email: user.email,
        status: staffProfile.status,
        assignedGroupSlug: targetGroupSlug,
      };
    };

    if (tx) {
      return await run(tx);
    } else {
      return await db.transaction(run);
    }
  }
}
