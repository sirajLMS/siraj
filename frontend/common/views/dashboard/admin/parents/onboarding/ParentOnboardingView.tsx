"use client";

import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { ParentOnboardingViewProps } from "@/frontend/common/views/dashboard/admin/parents/onboarding/types";

const lazyViews = createLazyView<ParentOnboardingViewProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/parents/onboarding/parentOnboarding.mobile").then(m => ({
      default: m.ParentOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/parents/onboarding/parentOnboarding.desktop").then(m => ({
      default: m.ParentOnboardingDesktopView,
    }))
);

export function ParentOnboardingView(props: Readonly<ParentOnboardingViewProps>) {
  return <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={props} />;
}
