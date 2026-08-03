import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { QuotaLabels } from "@/shared/locale/types/dashboard/billing/quota";

export const DashboardBillingQuota = defineNamespace<QuotaLabels>("dashboard.billing.quota", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/billing/quota").then(module => module.quotaEn),
    ar: () => import("@/shared/locale/ar/dashboard/billing/quota").then(module => module.quotaAr),
  },
});
