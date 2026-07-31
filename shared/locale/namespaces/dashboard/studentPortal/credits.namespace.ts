import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentPortalCreditsLabels } from "@/shared/locale/types/dashboard/studentPortal/studentCredits";

export const DashboardStudentPortalCredits = defineNamespace<StudentPortalCreditsLabels>(
  "dashboard.studentPortal.credits",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/studentPortal/studentCredits").then(
          module => module.dashboardStudentPortalCreditsEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/studentPortal/studentCredits").then(
          module => module.dashboardStudentPortalCreditsAr
        ),
    },
  }
);
