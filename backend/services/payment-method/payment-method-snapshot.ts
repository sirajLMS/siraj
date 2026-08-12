import {
  SupportedMobileWalletRepository,
  SupportedOnlineAccountRepository,
  SupportedPaymentLinkRepository,
  UserPaymentMethodRepository,
} from "@/backend/db/repo/billing";
import { type PaymentDirection, PaymentMethodType } from "@/backend/enum/billing/payment-method.enum";
import { bankTransferDetailsSchema, parsePaymentMethodDetails } from "@/backend/lib/payment-method.validation";
import { encryptBankTransferDetails } from "@/backend/lib/payment-method-jsonb";
import type { DBTransaction } from "@/backend/types";
import type {
  PaymentMethodCatalogSnapshot,
  PaymentMethodDetails,
  PaymentMethodTransactionSnapshot,
  UserPaymentMethodSelectType,
  UserPaymentMethodSubmitInput,
} from "@/backend/types/billing/payment-method.types";

type TransactionDirection = PaymentDirection.PAYIN | PaymentDirection.PAYOUT;

async function resolveCatalogSnapshot(
  type: PaymentMethodType,
  details: PaymentMethodDetails,
  tx?: DBTransaction
): Promise<PaymentMethodCatalogSnapshot | null> {
  switch (type) {
    case PaymentMethodType.MOBILE_WALLET: {
      if (!("walletId" in details)) return null;
      const wallet = await SupportedMobileWalletRepository.getById(details.walletId, tx);
      if (!wallet) return null;
      return { catalogId: wallet.id, catalogSlug: wallet.slug, catalogName: wallet.name };
    }
    case PaymentMethodType.PAYMENT_LINK: {
      if (!("paymentLinkId" in details)) return null;
      const link = await SupportedPaymentLinkRepository.getById(details.paymentLinkId, tx);
      if (!link) return null;
      return { catalogId: link.id, catalogSlug: link.slug, catalogName: link.name };
    }
    case PaymentMethodType.ONLINE_ACCOUNT: {
      if (!("onlineAccountId" in details)) return null;
      const account = await SupportedOnlineAccountRepository.getById(details.onlineAccountId, tx);
      if (!account) return null;
      return { catalogId: account.id, catalogSlug: account.slug, catalogName: account.name };
    }
    default:
      return null;
  }
}

function encryptDetailsForSnapshot(type: PaymentMethodType, details: PaymentMethodDetails): PaymentMethodDetails {
  if (type !== PaymentMethodType.BANK_TRANSFER) return details;
  const parsed = bankTransferDetailsSchema.safeParse(details);
  if (!parsed.success) return details;
  return encryptBankTransferDetails(parsed.data);
}

export function buildTransactionSnapshotFromMethod(
  method: UserPaymentMethodSelectType,
  catalog: PaymentMethodCatalogSnapshot | null,
  transactionDirection: TransactionDirection
): PaymentMethodTransactionSnapshot {
  const validatedDetails = parsePaymentMethodDetails(method.type, method.details);

  return {
    userPaymentMethodId: method.id,
    type: method.type,
    direction: transactionDirection,
    label: method.label,
    details: encryptDetailsForSnapshot(method.type, validatedDetails),
    catalog,
    snapshottedAt: new Date().toISOString(),
  };
}

export function buildTransactionSnapshotFromInline(
  input: Pick<UserPaymentMethodSubmitInput, "type" | "label" | "details">,
  catalog: PaymentMethodCatalogSnapshot | null,
  transactionDirection: TransactionDirection
): PaymentMethodTransactionSnapshot {
  const validatedDetails = parsePaymentMethodDetails(input.type, input.details);

  return {
    userPaymentMethodId: null,
    type: input.type,
    direction: transactionDirection,
    label: input.label ?? null,
    details: encryptDetailsForSnapshot(input.type, validatedDetails),
    catalog,
    snapshottedAt: new Date().toISOString(),
  };
}

export namespace PaymentMethodSnapshotService {
  export async function buildTransactionSnapshot(
    source:
      | { readonly userPaymentMethodId: string }
      | { readonly inline: Pick<UserPaymentMethodSubmitInput, "type" | "label" | "details"> },
    transactionDirection: TransactionDirection,
    tx?: DBTransaction
  ): Promise<PaymentMethodTransactionSnapshot> {
    if ("userPaymentMethodId" in source) {
      const method = await UserPaymentMethodRepository.getById(source.userPaymentMethodId, tx);
      if (!method) {
        throw new Error(`User payment method not found: ${source.userPaymentMethodId}`);
      }
      const catalog = await resolveCatalogSnapshot(method.type, method.details, tx);
      return buildTransactionSnapshotFromMethod(method, catalog, transactionDirection);
    }

    const catalog = await resolveCatalogSnapshot(source.inline.type, source.inline.details, tx);
    return buildTransactionSnapshotFromInline(source.inline, catalog, transactionDirection);
  }
}
