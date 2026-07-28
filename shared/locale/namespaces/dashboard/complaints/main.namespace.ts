import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ComplaintsLabels } from "@/shared/locale/types/dashboard/complaints";

export const DashboardComplaints = defineNamespace<ComplaintsLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/complaints/main").then(module => module.dashboardComplaintsEn),
    ar: () => import("@/shared/locale/ar/dashboard/complaints/main").then(module => module.dashboardComplaintsAr),
  },
});
