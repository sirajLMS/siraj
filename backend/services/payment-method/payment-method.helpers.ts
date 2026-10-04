import {
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
  UserPaymentMethodRepository,
} from "@/backend/db/repo";
import { AppPermission, PaymentMethodType } from "@/backend/enum";
import { PaymentDirection } from "@/backend/enum/billing/payment-method.enum";
import { parsePaymentMethodDetails } from "@/backend/lib/payment-method.validation";
import { encryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type {
  BankTransferDetails,
  DBTransaction,
  MobileWalletDetails,
  OnlineAccountDetails,
  PaymentLinkDetails,
  PaymentMethodDetails,
} from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";

export type DefaultSlot = "PAYIN" | "PAYOUT";

export function slotsForDirection(direction: PaymentDirection): DefaultSlot[] {
  if (direction === PaymentDirection.BOTH) return ["PAYIN", "PAYOUT"];
  if (direction === PaymentDirection.PAYIN) return ["PAYIN"];
  return ["PAYOUT"];
}

export async function getPaymentMethodOrThrow(
  id: string,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<NonNullable<Awaited<ReturnType<typeof UserPaymentMethodRepository.getById>>>> {
  const method = await UserPaymentMethodRepository.getById(id, tx);
  if (method === null) {
    throw new Error(tErrors.billing.paymentMethodNotFound(id));
  }
  return method;
}

export function supportsTransactionDirection(
  methodDirection: PaymentDirection,
  transactionDirection: PaymentDirection
): boolean {
  return methodDirection === PaymentDirection.BOTH || methodDirection === transactionDirection;
}

function isMobileWalletDetails(details: PaymentMethodDetails): details is MobileWalletDetails {
  return "walletId" in details;
}

function isPaymentLinkDetails(details: PaymentMethodDetails): details is PaymentLinkDetails {
  return "paymentLinkId" in details;
}

function isOnlineAccountDetails(details: PaymentMethodDetails): details is OnlineAccountDetails {
  return "onlineAccountId" in details;
}

// `BankTransferDetails` has only optional routing fields; we identify it by the
// absence of the discriminant keys carried by every other variant.
function isBankTransferDetails(details: PaymentMethodDetails): details is BankTransferDetails {
  return (
    !("walletId" in details) && !("paymentLinkId" in details) && !("onlineAccountId" in details) && !("note" in details)
  );
}

export function encryptDetailsForStorage(type: PaymentMethodType, details: PaymentMethodDetails): PaymentMethodDetails {
  const validated = parsePaymentMethodDetails(type, details);
  if (type === PaymentMethodType.BANK_TRANSFER && isBankTransferDetails(validated)) {
    return encryptBankTransferDetails(validated);
  }
  return validated;
}

export async function assertCatalogActive(
  type: PaymentMethodType,
  details: PaymentMethodDetails,
  tErrors: ErrorsLabels,
  tx?: DBTransaction
): Promise<void> {
  switch (type) {
    case PaymentMethodType.MOBILE_WALLET: {
      if (!isMobileWalletDetails(details)) return;
      const wallet = await SupportedMobileWalletRepository.getById(details.walletId, tx);
      if (!wallet?.isActive)
        throw new Error(
          tErrors.file.recordNotFound({
            tableName: "supported_mobile_wallets",
            entityId: details.walletId,
          })
        );
      return;
    }
    case PaymentMethodType.PAYMENT_LINK: {
      if (!isPaymentLinkDetails(details)) return;
      const link = await SupportedPaymentLinkRepository.getById(details.paymentLinkId, tx);
      if (!link?.isActive)
        throw new Error(
          tErrors.file.recordNotFound({
            tableName: "supported_payment_links",
            entityId: details.paymentLinkId,
          })
        );
      return;
    }
    case PaymentMethodType.ONLINE_ACCOUNT: {
      if (!isOnlineAccountDetails(details)) return;
      const account = await SupportedOnlineAccountRepository.getById(details.onlineAccountId, tx);
      if (!account?.isActive)
        throw new Error(
          tErrors.file.recordNotFound({
            tableName: "supported_online_accounts",
            entityId: details.onlineAccountId,
          })
        );
      return;
    }
    default:
      return;
  }
}

export async function hasAdminPaymentAccess(actorUserId: string): Promise<boolean> {
  return PermissionsService.hasPermission(actorUserId, AppPermission.PROFILE_PAYMENT_METHODS_EDIT_OTHER);
}

export async function assertActorCanManageTarget(
  actorUserId: string,
  targetUserId: string,
  tErrors: ErrorsLabels
): Promise<void> {
  if (actorUserId === targetUserId) {
    return;
  }
  const canManage = await hasAdminPaymentAccess(actorUserId);
  if (!canManage) {
    throw new Error(tErrors.insufficientPermissions);
  }
}
