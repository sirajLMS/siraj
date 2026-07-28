import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

export const DashboardTeacherFutureSchedule = defineNamespace<TeacherFutureScheduleLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/futureSchedule").then(
        module => module.dashboardTeacherFutureScheduleEn
      ),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/futureSchedule").then(
        module => module.dashboardTeacherFutureScheduleAr
      ),
  },
});
