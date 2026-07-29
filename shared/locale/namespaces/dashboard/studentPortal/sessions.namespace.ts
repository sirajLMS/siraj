import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentPortalSessionsLabels } from "@/shared/locale/types/dashboard/studentPortal/studentSessions";

export const DashboardStudentPortalSessions = defineNamespace<StudentPortalSessionsLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/studentPortal/studentSessions").then(
        module => module.dashboardStudentPortalSessionsEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/studentPortal/studentSessions").then(
        module => module.dashboardStudentPortalSessionsAr
      ),
  },
});
