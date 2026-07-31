import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { TeacherOnboardingLabels } from "@/shared/locale/types/dashboard/teachers/onboarding";

export const DashboardTeacherOnboarding = defineNamespace<TeacherOnboardingLabels>("dashboard.teachers.onboarding", {
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/teachers/onboarding").then(module => module.dashboardTeacherOnboardingEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/teachers/onboarding").then(module => module.dashboardTeacherOnboardingAr),
  },
});
