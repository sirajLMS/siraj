import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PaymentMethodLabels } from "@/shared/locale/types/ui";

export const UiPaymentMethod = defineNamespace<PaymentMethodLabels>("ui.paymentMethod", {
  load: {
    en: () => import("@/shared/locale/en/ui/paymentMethod").then(module => module.uiPaymentMethodEn),
    ar: () => import("@/shared/locale/ar/ui/paymentMethod").then(module => module.uiPaymentMethodAr),
  },
});
