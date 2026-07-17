"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ManagerOnboardingViewProps } from "@/frontend/common/views/dashboard/managers/onboarding/types";

const lazyViews = createLazyView<ManagerOnboardingViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/managers/onboarding/managerOnboarding.mobile").then(m => ({
      default: m.ManagerOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/managers/onboarding/managerOnboarding.desktop").then(m => ({
      default: m.ManagerOnboardingDesktopView,
    }))
);

export function ManagerOnboardingView(props: Readonly<ManagerOnboardingViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
