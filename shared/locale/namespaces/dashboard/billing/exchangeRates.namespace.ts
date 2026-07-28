import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ExchangeRatesLabels } from "@/shared/locale/types/dashboard/billing/exchangeRates";

export const DashboardBillingExchangeRates = defineNamespace<ExchangeRatesLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/billing/exchangeRates").then(
        module => module.dashboardBillingExchangeRatesEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/billing/exchangeRates").then(
        module => module.dashboardBillingExchangeRatesAr
      ),
  },
});
