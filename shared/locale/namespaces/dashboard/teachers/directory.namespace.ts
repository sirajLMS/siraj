import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeachersDirectoryLabels } from "@/shared/locale/types/dashboard/teachers/directory";

export const DashboardTeachersDirectory = defineNamespace<TeachersDirectoryLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/directory").then(module => module.dashboardTeachersDirectoryEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/directory").then(module => module.dashboardTeachersDirectoryAr),
  },
});
