import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PaymentMethodLabels } from "@/shared/locale/types/ui";

export const UiPaymentMethod = defineNamespace<PaymentMethodLabels>({
  load: {
    en: () => import("@/shared/locale/en/ui/payment-method").then(module => module.uiPaymentMethodEn),
    ar: () => import("@/shared/locale/ar/ui/payment-method").then(module => module.uiPaymentMethodAr),
  },
});
