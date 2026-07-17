"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ManagerOnboardingContainerViewModel } from "@/frontend/common/views/dashboard/managers/onboarding/useManagerOnboardingContainerViewModel";

const lazyViews = createLazyView<ManagerOnboardingContainerViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/managers/onboarding/managerOnboarding.mobile").then(m => ({
      default: m.ManagerOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/managers/onboarding/managerOnboarding.desktop").then(m => ({
      default: m.ManagerOnboardingDesktopView,
    }))
);

export function ManagerOnboardingView(props: Readonly<ManagerOnboardingContainerViewModel>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
export type { ManagerOnboardingContainerViewModel };
