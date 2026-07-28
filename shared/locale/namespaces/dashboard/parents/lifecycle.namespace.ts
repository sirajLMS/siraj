import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentLifecycleLabels } from "@/shared/locale/types/dashboard/parents/lifecycle";

export const DashboardParentLifecycle = defineNamespace<ParentLifecycleLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/parents/lifecycle").then(module => module.dashboardParentLifecycleEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/parents/lifecycle").then(module => module.dashboardParentLifecycleAr),
  },
});
