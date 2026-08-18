import { ParentRepository } from "@/backend/db/repo/parents";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { buildParentInsertPayload } from "@/backend/services/parent/__shared__/buildParentInsertPayload";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import { UserOnboardingService } from "@/backend/services/user/user-onboarding.service";
import type {
  DBTransaction,
  ParentCreateResult,
  ParentOnboardingInput,
  ParentOnboardingResult,
  UserCreateCoreInput,
  UserCreateProfileFieldsInput,
  UserReturnType,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export namespace ParentOnboardingService {
  export async function createParent(
    actorUserId: string,
    input: ParentOnboardingInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ParentOnboardingResult> {
    const { user, extension: parent } = await UserOnboardingService.createUserOfType<ParentCreateResult>(
      {
        actorUserId,
        permission: AppPermission.PARENTS_CREATE,
        coreInput: {
          name: input.name,
          email: input.email,
          password: input.password,
          ...(input.avatarUrl === undefined ? {} : { avatarUrl: input.avatarUrl }),
        } satisfies UserCreateCoreInput,
        profileFields: {
          phone: input.phone,
          timezone: input.timezone,
          displayCurrency: input.displayCurrency ?? undefined,
        } satisfies UserCreateProfileFieldsInput,
        // Parent flow writes UTC when no timezone was provided.
        writeDefaultTimezone: true,
        groupSlug: SystemPermissionGroupSlug.PARENT_DEFAULT,
        createExtension: async (createdUser: UserReturnType, txObj: DBTransaction) => {
          return ParentRepository.create(buildParentInsertPayload(input, createdUser.id), txObj);
        },
        afterExtension: async (createdUser: UserReturnType, _parent: ParentCreateResult, txObj: DBTransaction) => {
          if (input.initialPayinMethod) {
            await PaymentMethodService.createUserPaymentMethodInternal(
              { ...input.initialPayinMethod, userId: createdUser.id },
              txObj
            );
          }
        },
        tErrors,
        logTag: "Parent",
      },
      tx
    );

    return {
      userId: user.id,
      parentId: parent.id,
      name: user.name,
      email: user.email,
      status: parent.status,
      invoiceType: parent.invoiceType,
      currency: parent.currency,
    };
  }
}
