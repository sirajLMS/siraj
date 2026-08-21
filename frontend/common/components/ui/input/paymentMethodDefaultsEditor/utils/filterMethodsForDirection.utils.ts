// NEW FOR PLAN v5 (lifted from frontend/mobile/components/ui/input/paymentMethodDefaultsEditor/paymentMethodDefaultsEditor.mobile.tsx and frontend/desktop/.../paymentMethodDefaultsEditor.desktop.tsx — byte-identical pure-data helper)

import type { PaymentMethodRow } from "@/frontend/common/components/ui/display/paymentMethod/types";
import { PaymentDirection } from "@/frontend/common/graphql/generated/gql/graphql";

export function filterMethodsForDirection(
  methods: readonly PaymentMethodRow[],
  direction: "payin" | "payout"
): readonly PaymentMethodRow[] {
  return methods.filter(method => {
    if (!method.direction) return false;
    if (method.direction === PaymentDirection.Both) return true;
    return direction === "payin"
      ? method.direction === PaymentDirection.Payin
      : method.direction === PaymentDirection.Payout;
  });
}
