import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherCreateRecurringClassLabels } from "@/shared/locale/types/dashboard/teachers/createRecurringClass";

export const DashboardTeacherCreateRecurringClass = defineNamespace<TeacherCreateRecurringClassLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/createRecurringClass").then(
        module => module.dashboardTeacherCreateRecurringClassEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/createRecurringClass").then(
        module => module.dashboardTeacherCreateRecurringClassAr
      ),
  },
});
