import { PermissionManagementRepository } from "@/backend/db/repo/permissions";
import { UserRepository } from "@/backend/db/repo/users";
import { AccountStatus, AppPermission } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type { DBTransaction, GeneralUserCreateInput, GeneralUserCreateResult } from "@/backend/types";
import { isSpecializedGroup } from "@/shared/constants/specialized-groups.constants";
import type { ErrorsLabels } from "@/shared/locale";
import { getServerTranslations } from "@/shared/locale/server-graphql";

export namespace GeneralUserOnboardingService {
  export async function createGeneralUser(
    actorUserId: string,
    input: GeneralUserCreateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<GeneralUserCreateResult> {
    const tErrors: ErrorsLabels = getServerTranslations(locale ?? "ar").errorsTranslations;

    // Step 1: Reject specialized groups — those require dedicated onboarding flows.
    if (isSpecializedGroup(input.groupSlug)) {
      throw new Error(tErrors.specializedGroupNotAllowed);
    }

    // Step 2: Verify the target permission group exists.
    const group = await PermissionManagementRepository.findGroupBySlug(input.groupSlug, tx);
    if (!group) {
      throw new Error(tErrors.permissionGroup.permissionGroupNotFound);
    }

    // Step 3: Delegate to the shared onboarding pipeline with no extension row.
    // `createUserOfType` accepts a `string` slug and string-compares it internally
    // (line 173: `const slugStr: string = slug`), so custom group slugs work at runtime.
    const { user } = await UserOnboardingService.createUserOfType<void>(
      {
        actorUserId,
        permission: AppPermission.STAFF_CREATE,
        coreInput: {
          name: input.name,
          email: input.email,
          password: input.password,
        },
        profileFields: { phone: input.phone },
        validatePassword: true,
        groupSlug: input.groupSlug,
        createExtension: async () => undefined,
        afterExtension: async () => {},
        locale,
        tErrors,
        logTag: "GeneralUser",
      },
      tx
    );

    logger.info("GeneralUser onboarded successfully", { userId: user.id, groupSlug: input.groupSlug });

    // Step 4: Honor the requested account status (defaults to ACTIVATED via DB schema).
    if (input.status && input.status !== AccountStatus.ACTIVATED) {
      await UserRepository.updateStatus(user.id, input.status, tx, locale);
    }

    return {
      user,
      assignedGroupSlug: input.groupSlug,
    };
  }
}
