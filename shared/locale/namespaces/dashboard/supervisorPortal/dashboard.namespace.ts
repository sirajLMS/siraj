import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SupervisorDashboardLabels } from "@/shared/locale/types/dashboard/supervisorPortal/supervisorDashboard";

export const DashboardSupervisorPortalDashboard = defineNamespace<SupervisorDashboardLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/supervisorPortal/supervisorDashboard").then(
        module => module.dashboardSupervisorPortalDashboardEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/supervisorPortal/supervisorDashboard").then(
        module => module.dashboardSupervisorPortalDashboardAr
      ),
  },
});
