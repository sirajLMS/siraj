import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SupportedCurrenciesLabels } from "@/shared/locale/types/dashboard/billing/supportedCurrencies";

export const DashboardBillingSupportedCurrencies = defineNamespace<SupportedCurrenciesLabels>(
  "dashboard.billing.supportedCurrencies",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/billing/supportedCurrencies").then(
          module => module.dashboardBillingSupportedCurrenciesEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/billing/supportedCurrencies").then(
          module => module.dashboardBillingSupportedCurrenciesAr
        ),
    },
  }
);
