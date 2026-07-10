import { PaymentDirection, type PaymentMethodType } from "@/frontend/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/graphql/generated/gql/operations";
import type { PaymentMethodLabelResolver } from "@/frontend/lib/payment-method";
import { getPaymentMethodTypeLabel } from "@/frontend/lib/payment-method";

function isPayinCapable(direction: PaymentDirection | null | undefined): boolean {
  return direction === PaymentDirection.Payin || direction === PaymentDirection.Both;
}

export function pickDefaultPayinMethod(
  methods: readonly UserPaymentMethodFieldsFragment[]
): UserPaymentMethodFieldsFragment | null {
  const payinMethods = methods.filter(method => isPayinCapable(method.direction));
  if (payinMethods.length === 0) {
    return null;
  }
  return payinMethods.find(method => method.isDefault) ?? payinMethods[0] ?? null;
}

export function userPaymentMethodToOptionLabel(
  method: UserPaymentMethodFieldsFragment,
  t: PaymentMethodLabelResolver
): string {
  const typeLabel = method.type ? getPaymentMethodTypeLabel(method.type, t) : "";
  const parts = [typeLabel];
  if (method.label?.trim()) {
    parts.push(method.label.trim());
  }
  return parts.filter(Boolean).join(" · ");
}

export function buildPaidMethodHint(
  type: PaymentMethodType | null | undefined,
  label: string | null | undefined,
  t: PaymentMethodLabelResolver
): string | null {
  if (!type && !label?.trim()) {
    return null;
  }
  if (!type) {
    return label?.trim() ?? null;
  }
  const typeLabel = getPaymentMethodTypeLabel(type, t);
  if (label?.trim()) {
    return `${typeLabel} · ${label.trim()}`;
  }
  return typeLabel;
}
