"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type StudentOnboardingViewModel,
  type UseStudentOnboardingViewModelProps,
  useStudentOnboardingViewModel,
} from "@/frontend/common/views/dashboard/students/onboarding/useStudentOnboardingViewModel";

export type { StudentOnboardingViewModel };

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

export function StudentOnboardingView(props: Readonly<UseStudentOnboardingViewModelProps>) {
  const viewModel = useStudentOnboardingViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
