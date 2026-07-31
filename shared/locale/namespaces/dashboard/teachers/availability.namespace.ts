import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherAvailabilityLabels } from "@/shared/locale/types/dashboard/teachers/availability";

export const DashboardTeacherAvailability = defineNamespace<TeacherAvailabilityLabels>(
  "dashboard.teachers.availability",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/teachers/availability").then(
          module => module.dashboardTeacherAvailabilityEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/teachers/availability").then(
          module => module.dashboardTeacherAvailabilityAr
        ),
    },
  }
);
