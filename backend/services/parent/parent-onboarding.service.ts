import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository, PermissionManagementRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission, type CurrencyCode, SystemPermissionGroupSlug } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { PaymentMethodService } from "@/backend/services/payment-method/payment-method.service";
import type { UserPaymentMethodSubmitInput } from "@/backend/types/billing/payment-method.types";
import type { ErrorsLabels } from "@/shared/locale/types/errors";

export interface ParentOnboardingInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly phone?: string | null;
  readonly nationality?: string | null;
  readonly address?: string | null;
  readonly facebook?: string | null;
  readonly whatsapp?: string | null;
  readonly twitter?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly initialPayinMethod?: Omit<UserPaymentMethodSubmitInput, "userId"> | null;
  readonly currency?: CurrencyCode | null;
  readonly timezone?: string | null;
  readonly status?: string | null;
}

export interface ParentOnboardingResult {
  readonly userId: string;
  readonly parentId: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly invoiceType: string | null;
  readonly currency: CurrencyCode | null;
}

export namespace ParentOnboardingService {
  export async function createParent(
    actorUserId: string,
    input: ParentOnboardingInput,
    tErrors: ErrorsLabels,
    tx?: DBTransaction
  ): Promise<ParentOnboardingResult> {
    // Permission check
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENTS_CREATE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);
    }

    // Email uniqueness check
    const emailExists = await UserRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error(tErrors.userEmailExists);
    }

    const run = async (txObj: DBTransaction) => {
      // Step 1: Create user record
      const user = await UserRepository.create(
        { name: input.name, email: { value: input.email }, password: input.password },
        undefined,
        txObj
      );

      await UserRepository.updateTimezone(user.id, input.timezone ?? IanaTimezone.UTC, txObj, undefined);
      if (input.phone != null) {
        await UserRepository.updateProfileFields(user.id, { phone: input.phone }, undefined, txObj);
      }

      const parent = await ParentRepository.create(
        {
          userId: user.id,
          status: input.status ?? "REGULAR",
          nationality: input.nationality ?? null,
          address: input.address ?? null,
          facebook: input.facebook ?? null,
          whatsapp: input.whatsapp ?? null,
          twitter: input.twitter ?? null,
          invoiceType: input.invoiceType ?? null,
          feeAmount: input.feeAmount ?? null,
          currency: input.currency ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        txObj,
        undefined
      );

      // Step 3: Assign permission group
      const groups = await PermissionManagementRepository.listAllGroups(undefined, txObj);
      const targetGroup = groups.find(g => g.slug === SystemPermissionGroupSlug.PARENT_DEFAULT);
      if (!targetGroup) {
        throw new Error(tErrors.permissionGroup.permissionGroupNotFound);
      }

      await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], targetGroup.id, actorUserId, txObj);

      if (input.initialPayinMethod) {
        await PaymentMethodService.createUserPaymentMethodInternal(
          { ...input.initialPayinMethod, userId: user.id },
          txObj
        );
      }

      logger.info("Parent onboarded successfully", { parentId: parent.id, userId: user.id });

      return {
        userId: user.id,
        parentId: parent.id,
        name: user.name,
        email: user.email,
        status: parent.status,
        invoiceType: parent.invoiceType,
        currency: parent.currency,
      };
    };

    if (tx) {
      return await run(tx);
    } else {
      return await db.transaction(run);
    }
  }
}
