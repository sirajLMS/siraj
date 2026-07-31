import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { LessonReportLabels } from "@/shared/locale/types/dashboard/lms/lessonReports";

export const DashboardLmsLessonReports = defineNamespace<LessonReportLabels>("dashboard.lms.lessonReports", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/lms/lessonReports").then(module => module.dashboardLmsLessonReportsEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/lms/lessonReports").then(module => module.dashboardLmsLessonReportsAr),
  },
});
