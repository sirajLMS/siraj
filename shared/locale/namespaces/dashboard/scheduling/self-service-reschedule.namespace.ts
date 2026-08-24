import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { SelfServiceRescheduleLabels } from "@/shared/locale/types/dashboard/scheduling/self-service-reschedule";

export const DashboardSchedulingSelfServiceReschedule = defineNamespace<SelfServiceRescheduleLabels>(
  "dashboard.scheduling.self-service-reschedule",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/scheduling/self-service-reschedule").then(
          module => module.selfServiceRescheduleEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/scheduling/self-service-reschedule").then(
          module => module.selfServiceRescheduleAr
        ),
    },
  }
);
