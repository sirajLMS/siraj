import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentDirectoryLabels } from "@/shared/locale/types/dashboard/students/directory";

export const DashboardStudentDirectory = defineNamespace<StudentDirectoryLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/students/directory").then(module => module.dashboardStudentDirectoryEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/students/directory").then(module => module.dashboardStudentDirectoryAr),
  },
});
