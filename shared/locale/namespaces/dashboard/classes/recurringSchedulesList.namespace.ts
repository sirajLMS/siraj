import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { RecurringSchedulesListLabels } from "@/shared/locale/types/dashboard/classes/recurringSchedulesList";

export const DashboardRecurringSchedulesList = defineNamespace<RecurringSchedulesListLabels>(
  "dashboard.classes.recurringSchedulesList",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/classes/recurringSchedulesList").then(
          module => module.recurringSchedulesList
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/classes/recurringSchedulesList").then(
          module => module.recurringSchedulesList
        ),
    },
  }
);
