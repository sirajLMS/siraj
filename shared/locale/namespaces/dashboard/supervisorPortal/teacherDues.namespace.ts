import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SupervisorTeacherDuesLabels } from "@/shared/locale/types/dashboard/supervisorPortal/teacherDues";

export const DashboardSupervisorPortalTeacherDues = defineNamespace<SupervisorTeacherDuesLabels>(
  "dashboard.supervisorPortal.teacherDues",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/supervisorPortal/teacherDues").then(
          module => module.dashboardSupervisorPortalTeacherDuesEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/supervisorPortal/teacherDues").then(
          module => module.dashboardSupervisorPortalTeacherDuesAr
        ),
    },
  }
);
