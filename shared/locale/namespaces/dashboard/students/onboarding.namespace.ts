import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StudentOnboardingLabels } from "@/shared/locale/types/dashboard/students/onboarding";

export const DashboardStudentOnboarding = defineNamespace<StudentOnboardingLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/students/onboarding").then(module => module.dashboardStudentOnboardingEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/students/onboarding").then(module => module.dashboardStudentOnboardingAr),
  },
});
