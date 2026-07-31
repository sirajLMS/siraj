import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { BillingManualLabels } from "@/shared/locale/types/dashboard/billing/manual";

export const DashboardBillingManual = defineNamespace<BillingManualLabels>("dashboard.billing.manual", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/billing/manual").then(module => module.dashboardBillingManualEn),
    ar: () => import("@/shared/locale/ar/dashboard/billing/manual").then(module => module.dashboardBillingManualAr),
  },
});
