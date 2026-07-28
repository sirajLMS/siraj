import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SearchScheduleLabels } from "@/shared/locale/types/dashboard/core";

export const DashboardCoreSearchSchedule = defineNamespace<SearchScheduleLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/core/searchSchedule").then(module => module.dashboardCoreSearchScheduleEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/core/searchSchedule").then(module => module.dashboardCoreSearchScheduleAr),
  },
});
