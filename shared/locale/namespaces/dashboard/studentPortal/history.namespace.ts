import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentPortalHistoryLabels } from "@/shared/locale/types/dashboard/studentPortal/studentHistory";

export const DashboardStudentPortalHistory = defineNamespace<StudentPortalHistoryLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/studentPortal/studentHistory").then(
        module => module.dashboardStudentPortalHistoryEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/studentPortal/studentHistory").then(
        module => module.dashboardStudentPortalHistoryAr
      ),
  },
});
