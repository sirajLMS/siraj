import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { RescheduleFormLabels } from "@/shared/locale/types/dashboard/classes/rescheduleForm";

export const DashboardRescheduleForm = defineNamespace<RescheduleFormLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/classes/rescheduleForm").then(module => module.dashboardRescheduleFormEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/classes/rescheduleForm").then(module => module.dashboardRescheduleFormAr),
  },
});
