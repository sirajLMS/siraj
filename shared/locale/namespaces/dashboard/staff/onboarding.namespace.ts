import { defineNamespace } from "@/shared/locale/namespaces/define-namespace";
import type { StaffOnboardingLabels } from "@/shared/locale/types/dashboard/staff/onboarding";

export const DashboardStaffOnboarding = defineNamespace<StaffOnboardingLabels>("dashboard.staff.onboarding", {
  load: {
    en: () => import("@/shared/locale/en/dashboard/staff/onboarding").then(module => module.dashboardStaffOnboardingEn),
    ar: () => import("@/shared/locale/ar/dashboard/staff/onboarding").then(module => module.dashboardStaffOnboardingAr),
  },
});
