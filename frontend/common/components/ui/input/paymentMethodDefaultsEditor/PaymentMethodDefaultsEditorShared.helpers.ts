import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { getPaymentMethodDirectionLabel, getPaymentMethodTypeLabel } from "@/frontend/common/lib/payment-method";

const TYPE_LABEL_KEYS = ["mobileWallet", "paymentLink", "onlineAccount", "bankTransfer", "cash"] as const;
const DIRECTION_LABEL_KEYS = ["in", "out", "both"] as const;

type TypeLabelKey = (typeof TYPE_LABEL_KEYS)[number];
type DirectionLabelKey = (typeof DIRECTION_LABEL_KEYS)[number];

function isTypeLabelKey(key: string): key is TypeLabelKey {
  return (TYPE_LABEL_KEYS as readonly string[]).includes(key);
}

function isDirectionLabelKey(key: string): key is DirectionLabelKey {
  return (DIRECTION_LABEL_KEYS as readonly string[]).includes(key);
}

type PaymentMethodLabelSource = {
  readonly type: Record<TypeLabelKey, string>;
  readonly direction: Record<DirectionLabelKey, string>;
};

export function createFormatMethodLabel(t: PaymentMethodLabelSource): (method: PaymentMethodRow) => string {
  return method => {
    const typeLabel = getPaymentMethodTypeLabel(method.type, key => {
      const shortKey = key.slice("type.".length);
      return isTypeLabelKey(shortKey) ? t.type[shortKey] : "";
    });
    const directionLabel = getPaymentMethodDirectionLabel(method.direction, key => {
      const shortKey = key.slice("direction.".length);
      return isDirectionLabelKey(shortKey) ? t.direction[shortKey] : "";
    });
    const base = method.label?.trim() ?? method.catalogSlug ?? typeLabel;
    return directionLabel ? `${base} (${directionLabel})` : base;
  };
}
