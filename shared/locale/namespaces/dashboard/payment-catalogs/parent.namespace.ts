import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { PaymentCatalogsParentLabels } from "@/shared/locale/types/dashboard/payment-catalogs/parent";

export const DashboardPaymentCatalogsParent = defineNamespace<PaymentCatalogsParentLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/payment-catalogs/parent").then(
        module => module.dashboardPaymentCatalogsParentEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/payment-catalogs/parent").then(
        module => module.dashboardPaymentCatalogsParentAr
      ),
  },
});
