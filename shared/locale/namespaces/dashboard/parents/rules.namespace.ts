import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentRulesLabels } from "@/shared/locale/types/dashboard/parents/rules";

export const DashboardParentRules = defineNamespace<ParentRulesLabels>("dashboard.parents.rules", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/parents/rules").then(module => module.dashboardParentRulesEn),
    ar: () => import("@/shared/locale/ar/dashboard/parents/rules").then(module => module.dashboardParentRulesAr),
  },
});
