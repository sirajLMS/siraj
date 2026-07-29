import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentQuotaLabels } from "@/shared/locale/types/dashboard/students/quota";

export const DashboardStudentQuota = defineNamespace<StudentQuotaLabels>({
  load: {
    en: () => import("@/shared/locale/en/dashboard/students/quota").then(module => module.dashboardStudentQuotaEn),
    ar: () => import("@/shared/locale/ar/dashboard/students/quota").then(module => module.dashboardStudentQuotaAr),
  },
});
