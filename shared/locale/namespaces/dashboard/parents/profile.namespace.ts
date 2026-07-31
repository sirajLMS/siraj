import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentProfileLabels } from "@/shared/locale/types/dashboard/parents/profile";

export const DashboardParentProfile = defineNamespace<ParentProfileLabels>("dashboard.parents.profile", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/parents/profile").then(module => module.dashboardParentProfileEn),
    ar: () => import("@/shared/locale/ar/dashboard/parents/profile").then(module => module.dashboardParentProfileAr),
  },
});
