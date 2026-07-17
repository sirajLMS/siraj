"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type TeacherOnboardingViewModel,
  type UseTeacherOnboardingViewModelProps,
  useTeacherOnboardingViewModel,
} from "@/frontend/common/views/dashboard/teachers/onboarding/useTeacherOnboardingViewModel";

export type { TeacherOnboardingViewModel };

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

export function TeacherOnboardingView(props: Readonly<UseTeacherOnboardingViewModelProps>) {
  const viewModel = useTeacherOnboardingViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
