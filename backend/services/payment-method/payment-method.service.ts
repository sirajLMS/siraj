import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import {
  BillingRepository,
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
  UserPaymentMethodRepository,
} from "@/backend/db/repo";
import { teacherPayments } from "@/backend/db/schema";
import { AppPermission, ProfileScope } from "@/backend/enum";
import { PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { parsePaymentMethodDetails, userPaymentMethodSubmitInputSchema } from "@/backend/lib/payment-method.validation";
import { encryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import {
  buildMaskedPaymentMethod,
  buildMaskedPaymentMethods,
} from "@/backend/services/payment-method/payment-method-mask";
import { PaymentMethodSnapshotService } from "@/backend/services/payment-method/payment-method-snapshot";
import type { PaymentRecordInput } from "@/backend/types/billing/billing.types";
import type {
  PaymentMethodDefaults,
  PaymentMethodDetails,
  UpdateUserPaymentMethodInput,
  UserPaymentMethodReturnType,
  UserPaymentMethodSubmitInput,
} from "@/backend/types/billing/payment-method.types";
import type { CreateTeacherPaymentInput, TeacherPaymentSelectType } from "@/backend/types/teachers/teacher.types";

type DefaultSlot = "PAYIN" | "PAYOUT";

function slotsForDirection(direction: PaymentDirection): DefaultSlot[] {
  if (direction === PaymentDirection.BOTH) return ["PAYIN", "PAYOUT"];
  if (direction === PaymentDirection.PAYIN) return ["PAYIN"];
  return ["PAYOUT"];
}

function supportsTransactionDirection(
  methodDirection: PaymentDirection,
  transactionDirection: PaymentDirection
): boolean {
  return methodDirection === PaymentDirection.BOTH || methodDirection === transactionDirection;
}

function encryptDetailsForStorage(type: PaymentMethodType, details: PaymentMethodDetails): PaymentMethodDetails {
  const validated = parsePaymentMethodDetails(type, details);
  if (type === PaymentMethodType.BANK_TRANSFER) {
    return encryptBankTransferDetails(
      validated as import("@/backend/types/billing/payment-method.types").BankTransferDetails
    );
  }
  return validated;
}

async function assertCatalogActive(
  type: PaymentMethodType,
  details: PaymentMethodDetails,
  tx?: DBTransaction,
  locale?: string
): Promise<void> {
  const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

  switch (type) {
    case PaymentMethodType.MOBILE_WALLET: {
      const wallet = await SupportedMobileWalletRepository.getById((details as { walletId: string }).walletId, tx);
      if (!wallet?.isActive)
        throw new Error(
          tFunc("recordNotFound", {
            tableName: "supported_mobile_wallets",
            entityId: (details as { walletId: string }).walletId,
          })
        );
      return;
    }
    case PaymentMethodType.PAYMENT_LINK: {
      const link = await SupportedPaymentLinkRepository.getById(
        (details as { paymentLinkId: string }).paymentLinkId,
        tx
      );
      if (!link?.isActive)
        throw new Error(
          tFunc("recordNotFound", {
            tableName: "supported_payment_links",
            entityId: (details as { paymentLinkId: string }).paymentLinkId,
          })
        );
      return;
    }
    case PaymentMethodType.ONLINE_ACCOUNT: {
      const account = await SupportedOnlineAccountRepository.getById(
        (details as { onlineAccountId: string }).onlineAccountId,
        tx
      );
      if (!account?.isActive)
        throw new Error(
          tFunc("recordNotFound", {
            tableName: "supported_online_accounts",
            entityId: (details as { onlineAccountId: string }).onlineAccountId,
          })
        );
      return;
    }
    default:
      return;
  }
}

async function hasAdminPaymentAccess(actorUserId: string): Promise<boolean> {
  return PermissionsService.hasPermission(actorUserId, AppPermission.USER_EDIT_PROFILE);
}

async function assertActorCanManageTarget(actorUserId: string, targetUserId: string, locale?: string): Promise<void> {
  if (actorUserId === targetUserId) {
    return;
  }
  const canManage = await hasAdminPaymentAccess(actorUserId);
  if (!canManage) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("insufficientPermissions"));
  }
}

export namespace PaymentMethodService {
  export async function listUserPaymentMethods(
    actorUserId: string,
    userId: string,
    direction?: PaymentDirection,
    _locale?: string
  ): Promise<UserPaymentMethodReturnType[]> {
    const revealSensitive = actorUserId === userId || (await hasAdminPaymentAccess(actorUserId));
    const rows = await UserPaymentMethodRepository.listByUserId(userId);
    const filtered = direction
      ? rows.filter(row => row.direction === direction || row.direction === PaymentDirection.BOTH)
      : rows;
    return buildMaskedPaymentMethods(filtered, revealSensitive);
  }

  export async function listForProfile(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    _locale?: string
  ): Promise<UserPaymentMethodReturnType[] | null> {
    if (scope === ProfileScope.OWN && actorUserId !== targetUserId) {
      return null;
    }

    const revealSensitive = actorUserId === targetUserId;
    if (!revealSensitive) {
      const canView = await PermissionsService.hasPermission(actorUserId, AppPermission.USER_VIEW_PROFILE);
      if (!canView) {
        return null;
      }
    }

    const rows = await UserPaymentMethodRepository.listByUserId(targetUserId);
    return buildMaskedPaymentMethods(rows, revealSensitive);
  }

  export async function getUserPaymentMethodDefaults(
    actorUserId: string,
    userId: string,
    _locale?: string
  ): Promise<PaymentMethodDefaults> {
    const revealSensitive = actorUserId === userId || (await hasAdminPaymentAccess(actorUserId));
    const payinDefault = await UserPaymentMethodRepository.findDefaultForSlot(userId, "PAYIN");
    const payoutDefault = await UserPaymentMethodRepository.findDefaultForSlot(userId, "PAYOUT");

    return {
      payinDefault: payinDefault ? buildMaskedPaymentMethod(payinDefault, revealSensitive) : null,
      payoutDefault: payoutDefault ? buildMaskedPaymentMethod(payoutDefault, revealSensitive) : null,
    };
  }

  export async function getDefaultsForProfile(
    actorUserId: string,
    targetUserId: string,
    scope: ProfileScope,
    locale?: string
  ): Promise<PaymentMethodDefaults | null> {
    const methods = await listForProfile(actorUserId, targetUserId, scope, locale);
    if (methods === null) {
      return null;
    }

    const revealSensitive = actorUserId === targetUserId;
    const payinDefault = await UserPaymentMethodRepository.findDefaultForSlot(targetUserId, "PAYIN");
    const payoutDefault = await UserPaymentMethodRepository.findDefaultForSlot(targetUserId, "PAYOUT");

    return {
      payinDefault: payinDefault ? buildMaskedPaymentMethod(payinDefault, revealSensitive) : null,
      payoutDefault: payoutDefault ? buildMaskedPaymentMethod(payoutDefault, revealSensitive) : null,
    };
  }

  export async function createUserPaymentMethod(
    actorUserId: string,
    input: UserPaymentMethodSubmitInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    await assertActorCanManageTarget(actorUserId, input.userId, locale);
    const parsed = userPaymentMethodSubmitInputSchema.parse(input);
    const encryptedDetails = encryptDetailsForStorage(parsed.type, parsed.details);

    const run = async (t: DBTransaction) => {
      await assertCatalogActive(parsed.type, parsed.details, t, locale);

      if (parsed.isDefault) {
        for (const slot of slotsForDirection(parsed.direction)) {
          await UserPaymentMethodRepository.clearDefaultsInSlot(parsed.userId, slot, t);
        }
      }

      const created = await UserPaymentMethodRepository.create(
        {
          ...parsed,
          details: encryptedDetails,
        },
        t
      );

      return buildMaskedPaymentMethod(created, true);
    };

    return tx ? run(tx) : db.transaction(run);
  }

  export async function updateUserPaymentMethod(
    actorUserId: string,
    id: string,
    input: UpdateUserPaymentMethodInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const existing = await UserPaymentMethodRepository.getById(id, tx);
    if (!existing) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: id }));
    }

    await assertActorCanManageTarget(actorUserId, existing.userId, locale);

    const run = async (t: DBTransaction) => {
      const details =
        input.details !== undefined
          ? encryptDetailsForStorage(existing.type as PaymentMethodType, input.details)
          : undefined;

      if (input.details !== undefined) {
        await assertCatalogActive(existing.type as PaymentMethodType, input.details, t, locale);
      }

      const direction = input.direction ?? (existing.direction as PaymentDirection);
      if (input.isDefault) {
        for (const slot of slotsForDirection(direction)) {
          await UserPaymentMethodRepository.clearDefaultsInSlot(existing.userId, slot, t);
        }
      }

      const updated = await UserPaymentMethodRepository.update(
        id,
        {
          ...input,
          ...(details !== undefined ? { details } : {}),
        },
        t,
        locale
      );

      return buildMaskedPaymentMethod(updated, true);
    };

    return tx ? run(tx) : db.transaction(run);
  }

  export async function deleteUserPaymentMethod(
    actorUserId: string,
    id: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<void> {
    const existing = await UserPaymentMethodRepository.getById(id, tx);
    if (!existing) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: id }));
    }

    await assertActorCanManageTarget(actorUserId, existing.userId, locale);
    await UserPaymentMethodRepository.deleteById(id, tx, locale);
  }

  export async function setDefaultUserPaymentMethod(
    actorUserId: string,
    id: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const existing = await UserPaymentMethodRepository.getById(id, tx);
    if (!existing) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: id }));
    }

    return updateUserPaymentMethod(
      actorUserId,
      id,
      { isDefault: true, direction: existing.direction as PaymentDirection },
      locale,
      tx
    );
  }

  export async function verifyBankTransferPaymentMethod(
    actorUserId: string,
    id: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<UserPaymentMethodReturnType> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.PAYMENT_METHODS_VERIFY_BANK_TRANSFER
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const existing = await UserPaymentMethodRepository.getById(id, tx);
    if (!existing) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: id }));
    }

    if (existing.type !== PaymentMethodType.BANK_TRANSFER) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("cannotModifyBankingFields"));
    }

    const verified = await UserPaymentMethodRepository.setVerified(id, actorUserId, tx, locale);
    return buildMaskedPaymentMethod(verified, true);
  }

  export async function recordPayin(
    input: Omit<PaymentRecordInput, "paymentMethodType" | "paymentMethodSnapshot"> & {
      readonly userPaymentMethodId?: string | null;
      readonly inlineMethod?: Pick<UserPaymentMethodSubmitInput, "type" | "label" | "details">;
    },
    tx?: DBTransaction,
    locale?: string
  ) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });

    let snapshotSource:
      | { userPaymentMethodId: string }
      | { inline: Pick<UserPaymentMethodSubmitInput, "type" | "label" | "details"> };

    if (input.userPaymentMethodId) {
      const method = await UserPaymentMethodRepository.getById(input.userPaymentMethodId, tx);
      if (!method) {
        throw new Error(
          tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: input.userPaymentMethodId })
        );
      }
      if (!supportsTransactionDirection(method.direction as PaymentDirection, PaymentDirection.PAYIN)) {
        throw new Error(tFunc("insufficientPermissions"));
      }
      snapshotSource = { userPaymentMethodId: input.userPaymentMethodId };
    } else if (input.inlineMethod) {
      snapshotSource = { inline: input.inlineMethod };
    } else {
      throw new Error(tFunc("noActiveBankingDetails", { id: "payin" }));
    }

    const paymentMethodSnapshot = await PaymentMethodSnapshotService.buildTransactionSnapshot(
      snapshotSource,
      PaymentDirection.PAYIN,
      tx
    );

    return BillingRepository.recordPayment(
      {
        ...input,
        userPaymentMethodId: input.userPaymentMethodId ?? null,
        paymentMethodType: paymentMethodSnapshot.type,
        paymentMethodSnapshot,
      },
      tx,
      locale
    );
  }

  export async function recordPayout(
    input: CreateTeacherPaymentInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<TeacherPaymentSelectType> {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    const client = tx ?? db;

    if (!input.userPaymentMethodId) {
      throw new Error(tFunc("noActiveBankingDetails", { id: input.teacherId }));
    }

    const method = await UserPaymentMethodRepository.getById(input.userPaymentMethodId, tx);
    if (!method) {
      throw new Error(
        tFunc("recordNotFound", { tableName: "user_payment_methods", entityId: input.userPaymentMethodId })
      );
    }

    if (!supportsTransactionDirection(method.direction as PaymentDirection, PaymentDirection.PAYOUT)) {
      throw new Error(tFunc("insufficientPermissions"));
    }

    if (!input.isTestPayment && method.type === PaymentMethodType.BANK_TRANSFER && !method.verifiedAt) {
      throw new Error(tFunc("noVerifiedActiveBankingDetails", { id: input.teacherId }));
    }

    const paymentMethodSnapshot = await PaymentMethodSnapshotService.buildTransactionSnapshot(
      { userPaymentMethodId: input.userPaymentMethodId },
      PaymentDirection.PAYOUT,
      tx
    );

    const now = new Date();
    const [created] = await client
      .insert(teacherPayments)
      .values({
        teacherId: input.teacherId,
        userPaymentMethodId: input.userPaymentMethodId,
        paymentMethodType: paymentMethodSnapshot.type,
        paymentMethodSnapshot,
        amount: input.amount,
        currency: input.currency,
        paymentDate: input.paymentDate,
        isTestPayment: input.isTestPayment ?? false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!created) {
      throw new Error(tFunc("recordNotFound", { tableName: "teacher_payments", entityId: input.teacherId }));
    }

    return created;
  }

  export async function createUserPaymentMethodInternal(
    input: UserPaymentMethodSubmitInput,
    tx: DBTransaction,
    locale?: string
  ): Promise<UserPaymentMethodReturnType> {
    const parsed = userPaymentMethodSubmitInputSchema.parse(input);
    const encryptedDetails = encryptDetailsForStorage(parsed.type, parsed.details);

    await assertCatalogActive(parsed.type, parsed.details, tx, locale);

    if (parsed.isDefault) {
      for (const slot of slotsForDirection(parsed.direction)) {
        await UserPaymentMethodRepository.clearDefaultsInSlot(parsed.userId, slot, tx);
      }
    }

    const created = await UserPaymentMethodRepository.create(
      {
        ...parsed,
        details: encryptedDetails,
      },
      tx
    );

    return buildMaskedPaymentMethod(created, true);
  }

  export async function createInitialMethodForUser(
    input: UserPaymentMethodSubmitInput,
    tx: DBTransaction,
    locale?: string
  ): Promise<UserPaymentMethodReturnType> {
    return createUserPaymentMethodInternal(input, tx, locale);
  }
}
