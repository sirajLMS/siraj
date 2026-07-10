import type { PaymentMethodDetailsInput, PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type { PaymentMethodFormValues } from "@/frontend/views/dashboard/profile/shared/payment-methods/paymentMethodFormSchema";

export function emptyPaymentMethodDetailsInput(): PaymentMethodDetailsInput {
  return {
    accountNumber: null,
    bankName: null,
    beneficiaryName: null,
    iban: null,
    identifier: null,
    note: null,
    onlineAccountId: null,
    paymentLinkId: null,
    phone: null,
    routingNumber: null,
    swiftBic: null,
    url: null,
    walletId: null,
  };
}

export function formDetailsToInput(details: PaymentMethodFormValues["details"]): PaymentMethodDetailsInput {
  return {
    accountNumber: details.accountNumber?.trim() || null,
    bankName: details.bankName?.trim() || null,
    beneficiaryName: details.beneficiaryName?.trim() || null,
    iban: details.iban?.trim() || null,
    identifier: details.identifier?.trim() || null,
    note: details.note?.trim() || null,
    onlineAccountId: details.onlineAccountId?.trim() || null,
    paymentLinkId: details.paymentLinkId?.trim() || null,
    phone: details.phone?.trim() || null,
    routingNumber: details.routingNumber?.trim() || null,
    swiftBic: details.swiftBic?.trim() || null,
    url: details.url?.trim() || null,
    walletId: details.walletId?.trim() || null,
  };
}

export function fragmentToFormValues(method: UserPaymentMethodFieldsFragment): PaymentMethodFormValues {
  const details = method.details;
  return {
    type: method.type as PaymentMethodType,
    direction: method.direction!,
    label: method.label ?? "",
    isDefault: method.isDefault ?? false,
    details: {
      walletId: details?.walletId ?? undefined,
      phone: details?.phone ?? undefined,
      paymentLinkId: details?.paymentLinkId ?? undefined,
      url: details?.url ?? undefined,
      onlineAccountId: details?.onlineAccountId ?? undefined,
      identifier: details?.identifier ?? undefined,
      iban: details?.iban ?? undefined,
      bankName: details?.bankName ?? undefined,
      beneficiaryName: details?.beneficiaryName ?? undefined,
      swiftBic: details?.swiftBic ?? undefined,
      accountNumber: details?.accountNumber ?? undefined,
      routingNumber: details?.routingNumber ?? undefined,
      note: details?.note ?? undefined,
    },
  };
}
