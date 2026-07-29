import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { CreateRecurringClassLabels } from "@/shared/locale/types/dashboard/classes/createRecurringClass";

export const DashboardCreateRecurringClass = defineNamespace<CreateRecurringClassLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/classes/createRecurringClass").then(
        module => module.dashboardCreateRecurringClassEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/classes/createRecurringClass").then(
        module => module.dashboardCreateRecurringClassAr
      ),
  },
});
