import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { ParentRepository, PermissionManagementRepository, UserRepository } from "@/backend/db/repo";
import { AppPermission, SystemPermissionGroupSlug } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/timezone.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";

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
  readonly defaultZoomLink?: string | null;
  readonly invoiceType?: string | null;
  readonly feeAmount?: string | null;
  readonly paymentMethod?: string | null;
  readonly currency?: string | null;
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
  readonly currency: string | null;
}

export namespace ParentOnboardingService {
  export async function createParent(
    actorUserId: string,
    input: ParentOnboardingInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ParentOnboardingResult> {
    const t = await getBackendTranslations({ locale, namespace: "errors" });

    // Permission check
    const hasPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.PARENTS_CREATE);
    if (!hasPermission) {
      throw new Error(t("insufficientPermissions"));
    }

    // Email uniqueness check
    const emailExists = await UserRepository.existsByEmail(input.email);
    if (emailExists) {
      throw new Error(t("user.emailAlreadyExists"));
    }

    const run = async (txObj: DBTransaction) => {
      // Step 1: Create user record
      const user = await UserRepository.create(
        { name: input.name, email: { value: input.email }, password: input.password },
        locale,
        txObj
      );

      await UserRepository.updateTimezone(user.id, input.timezone ?? IanaTimezone.UTC, txObj, locale);

      // Step 2: Create parent profile
      const parent = await ParentRepository.create(
        {
          userId: user.id,
          status: input.status ?? "REGULAR",
          phone: input.phone ?? null,
          nationality: input.nationality ?? null,
          address: input.address ?? null,
          facebook: input.facebook ?? null,
          whatsapp: input.whatsapp ?? null,
          twitter: input.twitter ?? null,
          defaultZoomLink: input.defaultZoomLink ?? null,
          invoiceType: input.invoiceType ?? null,
          feeAmount: input.feeAmount ?? null,
          paymentMethod: input.paymentMethod ?? null,
          currency: input.currency ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        txObj,
        locale
      );

      // Step 3: Assign permission group
      const groups = await PermissionManagementRepository.listAllGroups(undefined, txObj);
      const targetGroup = groups.find(g => g.slug === SystemPermissionGroupSlug.PARENT_DEFAULT);
      if (!targetGroup) {
        throw new Error(t("permission.groupNotFound"));
      }

      await PermissionManagementRepository.bulkAssignUsersToGroup([user.id], targetGroup.id, actorUserId, txObj);

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
