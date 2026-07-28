import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { ParentOnboardingLabels } from "@/shared/locale/types/dashboard/parents/onboarding";

export const DashboardParentOnboarding = defineNamespace<ParentOnboardingLabels>({
  load: {
    en: () =>
      import("@/shared/locale/en/dashboard/parents/onboarding").then(module => module.dashboardParentOnboardingEn),
    ar: () =>
      import("@/shared/locale/ar/dashboard/parents/onboarding").then(module => module.dashboardParentOnboardingAr),
  },
});
