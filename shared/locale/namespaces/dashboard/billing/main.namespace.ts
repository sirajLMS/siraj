import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { BillingLabels } from "@/shared/locale/types/dashboard/billing/main";

export const DashboardBilling = defineNamespace<BillingLabels>("dashboard.billing.main", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/billing/main").then(module => module.dashboardBillingEn),
    ar: () => import("@/shared/locale/ar/dashboard/billing/main").then(module => module.dashboardBillingAr),
  },
});
