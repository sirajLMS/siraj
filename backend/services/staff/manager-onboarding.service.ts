import type { DBTransaction } from "@/backend/db/db.types";
import { StaffProfileRepository } from "@/backend/db/repo";
import { AppPermission, ManagerAccountType, SystemPermissionGroupSlug } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type { StaffProfileCreateResult } from "@/backend/types/staff/staff-profile.types";
import type {
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types/users/user.types";
import type { ErrorsLabels } from "@/shared/locale";

export interface ManagerOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
  readonly accountType: ManagerAccountType;
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

function resolveTargetGroupSlug(accountType: ManagerAccountType): SystemPermissionGroupSlug {
  if (accountType === ManagerAccountType.admin) {
    return SystemPermissionGroupSlug.ACADEMY_ADMIN;
  }
  if (accountType === ManagerAccountType.supervisor) {
    return SystemPermissionGroupSlug.SUPERVISOR_DEFAULT;
  }
  return SystemPermissionGroupSlug.STAFF_DEFAULT;
}

export namespace ManagerOnboardingService {
  export async function createManager(
    actorUserId: string,
    input: ManagerOnboardingInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ManagerOnboardingResult> {
    const tErrors: ErrorsLabels = (await import("@/shared/locale")).getServerTranslations(
      locale ?? "ar"
    ).errorsTranslations;

    const targetGroupSlug = resolveTargetGroupSlug(input.accountType);

    const { user, extension: staffProfile } = await UserOnboardingService.createUserOfType<StaffProfileCreateResult>(
      {
        actorUserId,
        permission: AppPermission.STAFF_CREATE,
        coreInput: {
          name: input.name,
          email: input.email,
          password: input.password,
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        } satisfies UserCreateCoreInput,
        profileFields: {
          // Manager phone lives on the `users` row.
          phone: input.phone,
        } satisfies UserCreateProfileFieldsInput,
        groupSlug: targetGroupSlug,
        preChecks: async () => {
          // Secondary check: actor must be a super-admin or hold the SUPER_ADMIN group.
          const actorContext = await PermissionsService.getUserContext(actorUserId);
          if (
            !actorContext.isSuperAdmin &&
            !actorContext.permissionGroups.includes(SystemPermissionGroupSlug.SUPER_ADMIN)
          ) {
            throw new Error(tErrors.insufficientPermissions);
          }
        },
        createExtension: async (createdUser: UserReturnType, txObj: DBTransaction) => {
          return StaffProfileRepository.create(
            {
              userId: createdUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            txObj,
            locale
          );
        },
        locale,
        tErrors,
        logTag: "Manager",
      },
      tx
    );

    return {
      id: staffProfile.id,
      userId: user.id,
      staffProfileId: staffProfile.id,
      name: user.name,
      email: user.email,
      status: staffProfile.status,
      assignedGroupSlug: targetGroupSlug,
    };
  }
}
