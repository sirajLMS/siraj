"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import {
  type ParentOnboardingViewModel,
  type UseParentOnboardingViewModelProps,
  useParentOnboardingViewModel,
} from "@/frontend/common/views/dashboard/admin/parents/onboarding/useParentOnboardingViewModel";

const lazyViews = createLazyView<ParentOnboardingViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/parents/onboarding/parentOnboarding.mobile").then(m => ({
      default: m.ParentOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/parents/onboarding/parentOnboarding.desktop").then(m => ({
      default: m.ParentOnboardingDesktopView,
    }))
);

export function ParentOnboardingContainer(_props: Readonly<UseParentOnboardingViewModelProps> = {}) {
  const viewModel = useParentOnboardingViewModel();

  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />;
}

export type { ParentOnboardingViewModel, UseParentOnboardingViewModelProps };
