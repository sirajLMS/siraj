import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentWeekCalendarLabels } from "@/shared/locale/types/dashboard/scheduling/student-week-calendar";

export const DashboardSchedulingStudentWeekCalendar = defineNamespace<StudentWeekCalendarLabels>(
  "dashboard.scheduling.student-week-calendar",
  {
    load: {
      en: () =>
        import("@/shared/locale/en/dashboard/scheduling/student-week-calendar").then(
          module => module.studentWeekCalendarEn
        ),
      ar: () =>
        import("@/shared/locale/ar/dashboard/scheduling/student-week-calendar").then(
          module => module.studentWeekCalendarAr
        ),
    },
  }
);
