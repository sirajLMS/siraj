import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import type { PaymentMethodLabelResolver } from "@/frontend/common/lib/payment-method";
import { getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";

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
