"use client";

import type { PaymentMethodProfileLabels } from "@/frontend/common/views/dashboard/profile/shared/types/paymentMethodProfile.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function usePaymentMethodProfileLabels(): PaymentMethodProfileLabels {
  const paymentMethod = useAppTranslation(Translation.Ui.PaymentMethod);
  return {
    manager: paymentMethod.manager,
    type: paymentMethod,
  };
}
