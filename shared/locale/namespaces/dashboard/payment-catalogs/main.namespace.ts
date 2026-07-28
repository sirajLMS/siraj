import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PaymentCatalogsLabels } from "@/shared/locale/types/dashboard/payment-catalogs/main";

export const DashboardPaymentCatalogs = defineNamespace<PaymentCatalogsLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/payment-catalogs/main").then(module => module.dashboardPaymentCatalogsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/payment-catalogs/main").then(module => module.dashboardPaymentCatalogsAr),
  },
});
