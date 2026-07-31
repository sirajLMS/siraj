import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SupervisorPortalProfileLabels } from "@/shared/locale/types/dashboard/supervisorPortal/profile";

export const DashboardSupervisorPortalProfile = defineNamespace<SupervisorPortalProfileLabels>(
  "dashboard.supervisorPortal.profile",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/supervisorPortal/profile").then(
          module => module.dashboardSupervisorPortalProfileEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/supervisorPortal/profile").then(
          module => module.dashboardSupervisorPortalProfileAr
        ),
    },
  }
);
