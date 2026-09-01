"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherOnboardingViewModel,
  useTeacherOnboardingViewModel,
} from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";

const lazyViews = createLazyView<TeacherOnboardingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/teachers/onboarding/teacherOnboardingView.mobile").then(m => ({
      default: m.TeacherOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/teachers/onboarding/teacherOnboardingView.desktop").then(m => ({
      default: m.TeacherOnboardingDesktopView,
    }))
);

export function TeacherOnboardingContainer() {
  const viewModel = useTeacherOnboardingViewModel();

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
