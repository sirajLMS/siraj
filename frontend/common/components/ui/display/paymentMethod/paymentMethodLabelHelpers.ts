import type { PaymentMethodDirectionLabels, PaymentMethodTypeLabels } from "@/shared/locale/types/ui";

//#region Label key type guards (module-scoped)

type PaymentMethodTypeLabelKey = keyof PaymentMethodTypeLabels;
type PaymentDirectionLabelKey = keyof PaymentMethodDirectionLabels;

const PAYMENT_METHOD_TYPE_LABEL_KEYS: readonly PaymentMethodTypeLabelKey[] = [
  "mobileWallet",
  "paymentLink",
  "onlineAccount",
  "bankTransfer",
  "cash",
  "proofUpload",
];
const PAYMENT_DIRECTION_LABEL_KEYS: readonly PaymentDirectionLabelKey[] = ["in", "out", "both"];

export function isPaymentMethodTypeLabelKey(value: string): value is PaymentMethodTypeLabelKey {
  return (PAYMENT_METHOD_TYPE_LABEL_KEYS as readonly string[]).includes(value);
}

export function isPaymentDirectionLabelKey(value: string): value is PaymentDirectionLabelKey {
  return (PAYMENT_DIRECTION_LABEL_KEYS as readonly string[]).includes(value);
}

//#endregion
