import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentPortalDashboardLabels } from "@/shared/locale/types/dashboard/studentPortal/studentDashboard";

export const DashboardStudentPortalDashboard = defineNamespace<StudentPortalDashboardLabels>(
  "dashboard.studentPortal.dashboard",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/studentPortal/studentDashboard").then(
          module => module.dashboardStudentPortalDashboardEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/studentPortal/studentDashboard").then(
          module => module.dashboardStudentPortalDashboardAr
        ),
    },
  }
);
