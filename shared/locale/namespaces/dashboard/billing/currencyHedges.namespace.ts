import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CurrencyHedgesLabels } from "@/shared/locale/types/dashboard/billing/currencyHedges";

export const DashboardBillingCurrencyHedges = defineNamespace<CurrencyHedgesLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/billing/currencyHedges").then(
        module => module.dashboardBillingCurrencyHedgesEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/billing/currencyHedges").then(
        module => module.dashboardBillingCurrencyHedgesAr
      ),
  },
});
