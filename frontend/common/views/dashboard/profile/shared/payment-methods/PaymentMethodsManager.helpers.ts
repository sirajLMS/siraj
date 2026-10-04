import type { PaymentMethodTypeLabels } from "@/shared/locale/types/ui";

function isPaymentMethodTypeLabelKey(key: string): key is keyof PaymentMethodTypeLabels {
  return (
    key === "mobileWallet" ||
    key === "paymentLink" ||
    key === "onlineAccount" ||
    key === "bankTransfer" ||
    key === "cash" ||
    key === "proofUpload"
  );
}

export function resolveTypeLabel(messageKey: string, typeLabels: PaymentMethodTypeLabels): string {
  const stripped = messageKey.startsWith("type.") ? messageKey.slice(5) : messageKey;
  if (isPaymentMethodTypeLabelKey(stripped)) {
    return typeLabels[stripped];
  }
  return "";
}
