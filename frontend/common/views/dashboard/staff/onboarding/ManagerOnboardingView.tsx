"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ManagerOnboardingViewModel,
  type UseManagerOnboardingViewModelProps,
  useManagerOnboardingViewModel,
} from "@/frontend/common/views/dashboard/staff/onboarding/useManagerOnboardingViewModel";

const lazyViews = createLazyView<ManagerOnboardingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/staff/onboarding/managerOnboarding.mobile").then(m => ({
      default: m.ManagerOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/staff/onboarding/managerOnboarding.desktop").then(m => ({
      default: m.ManagerOnboardingDesktopView,
    }))
);

export function ManagerOnboardingView(props: Readonly<UseManagerOnboardingViewModelProps>) {
  const viewModel = useManagerOnboardingViewModel(props);
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}
export type { ManagerOnboardingViewModel, UseManagerOnboardingViewModelProps };
