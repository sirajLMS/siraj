import {
  getPaymentMethodCatalogOptionLabel,
  type PaymentMethodCatalogOption,
} from "@/frontend/common/lib/payment-method";

export function getPaymentMethodOptionRowLabel(option: PaymentMethodCatalogOption): string {
  return `${getPaymentMethodCatalogOptionLabel(option)} (${option.slug})`;
}
