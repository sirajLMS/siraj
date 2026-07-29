import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CreditLabels } from "@/shared/locale/types/dashboard/lms/credit";

export const DashboardLmsCredit = defineNamespace<CreditLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/lms/credit").then(module => module.dashboardLmsCreditEn),
    ar: () => import("@/shared/locale/ar/dashboard/lms/credit").then(module => module.dashboardLmsCreditAr),
  },
});
