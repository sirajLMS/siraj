import { PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { decryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import type {
  BankTransferDetails,
  MobileWalletDetails,
  OnlineAccountDetails,
  PaymentLinkDetails,
  PaymentMethodDetails,
  UserPaymentMethodReturnType,
  UserPaymentMethodSelectType,
} from "@/backend/types/billing/payment-method.types";

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

function maskDetails(
  type: PaymentMethodType,
  details: PaymentMethodDetails,
  revealSensitive: boolean
): PaymentMethodDetails {
  switch (type) {
    case PaymentMethodType.MOBILE_WALLET: {
      const d = details as MobileWalletDetails;
      return {
        walletId: d.walletId,
        phone: revealSensitive ? d.phone : (maskNumericField(d.phone) ?? ""),
      };
    }
    case PaymentMethodType.PAYMENT_LINK: {
      const d = details as PaymentLinkDetails;
      return {
        paymentLinkId: d.paymentLinkId,
        url: revealSensitive ? d.url : maskUrl(d.url),
      };
    }
    case PaymentMethodType.ONLINE_ACCOUNT: {
      const d = details as OnlineAccountDetails;
      return {
        onlineAccountId: d.onlineAccountId,
        identifier: revealSensitive ? d.identifier : (maskTextField(d.identifier) ?? ""),
      };
    }
    case PaymentMethodType.BANK_TRANSFER: {
      const plain = revealSensitive
        ? decryptBankTransferDetails(details as BankTransferDetails)
        : (details as BankTransferDetails);
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
    case PaymentMethodType.CASH:
      return details;
    default: {
      const exhaustive: never = type;
      return exhaustive;
    }
  }
}

export function buildMaskedPaymentMethod(
  method: UserPaymentMethodSelectType,
  revealSensitive: boolean
): UserPaymentMethodReturnType {
  return {
    ...method,
    type: method.type as UserPaymentMethodReturnType["type"],
    direction: method.direction as UserPaymentMethodReturnType["direction"],
    details: maskDetails(method.type as PaymentMethodType, method.details, revealSensitive),
  };
}

export function buildMaskedPaymentMethods(
  methods: UserPaymentMethodSelectType[],
  revealSensitive: boolean
): UserPaymentMethodReturnType[] {
  return methods.map(method => buildMaskedPaymentMethod(method, revealSensitive));
}
