import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { decryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import type {
  BankTransferDetails,
  MobileWalletDetails,
  OnlineAccountDetails,
  PaymentLinkDetails,
  PaymentMethodDetails,
  PaymentMethodTransactionSnapshot,
  UserPaymentMethodReturnType,
  UserPaymentMethodSelectType,
} from "@/backend/types";

function maskNumericField(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  return `****${trimmed.slice(-4)}`;
}

function maskTextField(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 1) return "*";
  if (trimmed.length <= 4) return `${trimmed[0]}${"*".repeat(trimmed.length - 1)}`;
  return `${trimmed[0]}${"*".repeat(Math.min(trimmed.length - 2, 6))}${trimmed.slice(-1)}`;
}

function maskSwiftBic(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.length <= 4) return "****";
  return `${trimmed.slice(0, 2)}${"*".repeat(Math.max(trimmed.length - 4, 2))}${trimmed.slice(-2)}`;
}

function maskUrl(value: string): string {
  try {
    const url = new URL(value);
    const host = url.hostname;
    if (host.length <= 4) return `https://****${url.pathname}`;
    return `https://${host.slice(0, 2)}***${host.slice(-2)}${url.pathname}`;
  } catch {
    return maskTextField(value) ?? "****";
  }
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

function isBankTransferDetails(details: PaymentMethodDetails): details is BankTransferDetails {
  return !("walletId" in details || "paymentLinkId" in details || "onlineAccountId" in details || "note" in details);
}

function maskBankTransferDetails(details: PaymentMethodDetails, revealSensitive: boolean): PaymentMethodDetails {
  if (!isBankTransferDetails(details)) {
    throw new Error("Bank transfer details have an unexpected shape");
  }
  const plain = revealSensitive ? decryptBankTransferDetails(details) : details;
  if (revealSensitive) {
    return plain;
  }
  return {
    iban: maskNumericField(plain.iban) ?? undefined,
    bankName: maskTextField(plain.bankName) ?? undefined,
    beneficiaryName: maskTextField(plain.beneficiaryName) ?? undefined,
    swiftBic: maskSwiftBic(plain.swiftBic) ?? undefined,
    accountNumber: maskNumericField(plain.accountNumber) ?? undefined,
    routingNumber: maskNumericField(plain.routingNumber) ?? undefined,
  };
}

function maskDetails(
  type: PaymentMethodType,
  details: PaymentMethodDetails,
  revealSensitive: boolean
): PaymentMethodDetails {
  switch (type) {
    case PaymentMethodType.MOBILE_WALLET: {
      if (!isMobileWalletDetails(details)) {
        throw new Error("Mobile wallet details are missing the walletId field");
      }
      return {
        walletId: details.walletId,
        phone: revealSensitive ? details.phone : (maskNumericField(details.phone) ?? ""),
      };
    }
    case PaymentMethodType.PAYMENT_LINK: {
      if (!isPaymentLinkDetails(details)) {
        throw new Error("Payment link details are missing the paymentLinkId field");
      }
      return {
        paymentLinkId: details.paymentLinkId,
        url: revealSensitive ? details.url : maskUrl(details.url),
      };
    }
    case PaymentMethodType.ONLINE_ACCOUNT: {
      if (!isOnlineAccountDetails(details)) {
        throw new Error("Online account details are missing the onlineAccountId field");
      }
      return {
        onlineAccountId: details.onlineAccountId,
        identifier: revealSensitive ? details.identifier : (maskTextField(details.identifier) ?? ""),
      };
    }
    case PaymentMethodType.BANK_TRANSFER:
      return maskBankTransferDetails(details, revealSensitive);
    case PaymentMethodType.CASH:
      return details;
    case PaymentMethodType.PROOF_UPLOAD:
      throw new Error("Proof upload snapshots are not masked via maskDetails");
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function buildMaskedPaymentMethod(method: UserPaymentMethodSelectType, revealSensitive: boolean) {
  return {
    ...method,
    details: maskDetails(method.type, method.details, revealSensitive),
  };
}

export function buildMaskedPaymentMethods(
  methods: UserPaymentMethodSelectType[],
  revealSensitive: boolean
): UserPaymentMethodReturnType[] {
  return methods.map(method => buildMaskedPaymentMethod(method, revealSensitive));
}

export function buildMaskedTransactionSnapshot(
  snapshot: PaymentMethodTransactionSnapshot,
  revealSensitive: boolean
): PaymentMethodTransactionSnapshot {
  return {
    ...snapshot,
    details: maskDetails(snapshot.type, snapshot.details, revealSensitive),
  };
}
