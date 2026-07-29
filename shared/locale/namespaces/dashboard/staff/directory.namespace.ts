import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StaffDirectoryLabels } from "@/shared/locale/types/dashboard/staff/directory";

export const DashboardStaffDirectory = defineNamespace<StaffDirectoryLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/staff/directory").then(module => module.dashboardStaffDirectoryEn),
    ar: () => import("@/shared/locale/ar/dashboard/staff/directory").then(module => module.dashboardStaffDirectoryAr),
  },
});
