import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import {
  PaymentDirection,
  type UserPaymentMethodFieldsFragment,
} from "@/frontend/common/graphql/generated/gql/graphql";
import type { PaymentMethodTypeLabels } from "@/frontend/common/lib/payment-method";
import type { PaymentMethodsSlot } from "@/frontend/common/views/dashboard/profile/shared/payment-methods/PaymentMethodsManager";
import type { PaymentMethodLabels } from "@/shared/locale/types/ui";

export function toRow(method: UserPaymentMethodFieldsFragment): PaymentMethodRow | null {
  if (!method.id || !method.type || !method.direction) return null;
  return {
    id: method.id,
    type: method.type,
    direction: method.direction,
    label: method.label,
    details: method.details,
    verifiedAt: method.verifiedAt,
    isDefault: method.isDefault ?? false,
  };
}

function matchesSlot(direction: PaymentDirection, slot: PaymentMethodsSlot): boolean {
  if (slot === "payin") {
    return direction === PaymentDirection.Payin || direction === PaymentDirection.Both;
  }
  return direction === PaymentDirection.Payout || direction === PaymentDirection.Both;
}

export function buildSlotDirection(slot: PaymentMethodsSlot): PaymentDirection.Payin | PaymentDirection.Payout {
  return slot === "payin" ? PaymentDirection.Payin : PaymentDirection.Payout;
}

export function buildAllowedDirections(
  slot: PaymentMethodsSlot
): readonly (PaymentDirection.Payin | PaymentDirection.Payout | PaymentDirection.Both)[] {
  return slot === "payin"
    ? [PaymentDirection.Payin, PaymentDirection.Both]
    : [PaymentDirection.Payout, PaymentDirection.Both];
}

export function filterMethodsBySlot(
  methods: readonly PaymentMethodRow[],
  slot: PaymentMethodsSlot
): PaymentMethodRow[] {
  return methods.filter(row => matchesSlot(row.direction, slot));
}

export function buildMethodMap(
  methods: readonly UserPaymentMethodFieldsFragment[] | undefined
): Map<string, UserPaymentMethodFieldsFragment> {
  const map = new Map<string, UserPaymentMethodFieldsFragment>();
  for (const method of methods ?? []) {
    if (method.id) map.set(method.id, method);
  }
  return map;
}

export function toPaymentMethodFragments(
  methods: Array<UserPaymentMethodFieldsFragment> | null | undefined
): readonly UserPaymentMethodFieldsFragment[] | undefined {
  return methods ?? undefined;
}

const PAYMENT_METHOD_TYPE_TO_LABEL_KEY: Readonly<Record<string, keyof PaymentMethodTypeLabels>> = {
  MOBILE_WALLET: "mobileWallet",
  PAYMENT_LINK: "paymentLink",
  ONLINE_ACCOUNT: "onlineAccount",
  BANK_TRANSFER: "bankTransfer",
  CASH: "cash",
};

function resolveTypeLabel(type: string, labels: PaymentMethodTypeLabels): string {
  const labelKey = PAYMENT_METHOD_TYPE_TO_LABEL_KEY[type];
  return labelKey ? labels[labelKey] : "";
}

export function buildDeleteLabel(
  deleteId: string | null,
  methods: readonly PaymentMethodRow[],
  tType: PaymentMethodLabels
): string {
  if (!deleteId) return "";
  const row = methods.find(m => m.id === deleteId);
  if (!row) return "";
  return row.label?.trim() ?? resolveTypeLabel(row.type, tType.type);
}

export function computeBusy(loading: boolean, deleting: boolean, settingDefault: boolean, verifying: boolean): boolean {
  return loading || deleting || settingDefault || verifying;
}
