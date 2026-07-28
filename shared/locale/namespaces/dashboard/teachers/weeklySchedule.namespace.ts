import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherWeeklyScheduleLabels } from "@/shared/locale/types/dashboard/teachers/weeklySchedule";

export const DashboardTeacherWeeklySchedule = defineNamespace<TeacherWeeklyScheduleLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/weeklySchedule").then(
        module => module.dashboardTeacherWeeklyScheduleEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/weeklySchedule").then(
        module => module.dashboardTeacherWeeklyScheduleAr
      ),
  },
});
