import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CreditAdjustmentLabels } from "@/shared/locale/types/dashboard/billing/creditAdjustment";

export const DashboardBillingCreditAdjustment = defineNamespace<CreditAdjustmentLabels>(
  "dashboard.billing.creditAdjustment",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/billing/creditAdjustment").then(
          module => module.dashboardBillingCreditAdjustmentEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/billing/creditAdjustment").then(
          module => module.dashboardBillingCreditAdjustmentAr
        ),
    },
  }
);
