import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentsDirectoryLabels } from "@/shared/locale/types/dashboard/parents/directory";

export const DashboardParentsDirectory = defineNamespace<ParentsDirectoryLabels>("dashboard.parents.directory", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/parents/directory").then(module => module.dashboardParentsDirectoryEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/parents/directory").then(module => module.dashboardParentsDirectoryAr),
  },
});
