import type { UserPaymentMethodFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import { getPaymentMethodTypeLabel, type PaymentMethodLabelResolver } from "@/frontend/common/lib/payment-method";

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
