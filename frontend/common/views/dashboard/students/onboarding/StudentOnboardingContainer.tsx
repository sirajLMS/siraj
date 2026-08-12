"use client";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentOnboardingViewModel,
  useStudentOnboardingViewModel,
} from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";

const lazyViews = createLazyView<StudentOnboardingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/students/onboarding/studentOnboarding.mobile").then(m => ({
      default: m.StudentOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/students/onboarding/studentOnboarding.desktop").then(m => ({
      default: m.StudentOnboardingDesktopView,
    }))
);

export function StudentOnboardingView() {
  const viewModel = useStudentOnboardingViewModel({});

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
