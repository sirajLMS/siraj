import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentSocialLabels } from "@/shared/locale/types/dashboard/parents/social";

export const DashboardParentSocial = defineNamespace<ParentSocialLabels>("dashboard.parents.social", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/parents/social").then(module => module.dashboardParentSocialEn),
    ar: () => import("@/shared/locale/ar/dashboard/parents/social").then(module => module.dashboardParentSocialAr),
  },
});
