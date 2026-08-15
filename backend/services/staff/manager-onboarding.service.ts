import { StaffProfileRepository } from "@/backend/db/repo/teachers";
import { AppPermission, ManagerAccountType, SystemPermissionGroupSlug } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type {
  DBTransaction,
  StaffProfileCreateResult,
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export interface ManagerOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly avatarUrl?: string | null;
  readonly phone?: string | null;
  readonly accountType: ManagerAccountType;
  readonly timezone?: string | null;
  readonly displayCurrency?: string | null;
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
  if (accountType === ManagerAccountType.supervisor) {
    return SystemPermissionGroupSlug.SUPERVISOR_DEFAULT;
  }
  return SystemPermissionGroupSlug.ACADEMY_ADMIN;
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
          phone: input.phone,
          timezone: input.timezone ?? undefined,
          displayCurrency: input.displayCurrency ?? undefined,
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
