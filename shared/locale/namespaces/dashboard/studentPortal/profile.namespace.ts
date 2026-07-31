import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentPortalProfileLabels } from "@/shared/locale/types/dashboard/studentPortal/studentProfile";

export const DashboardStudentPortalProfile = defineNamespace<StudentPortalProfileLabels>(
  "dashboard.studentPortal.profile",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/studentPortal/studentProfile").then(
          module => module.dashboardStudentPortalProfileEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/studentPortal/studentProfile").then(
          module => module.dashboardStudentPortalProfileAr
        ),
    },
  }
);
