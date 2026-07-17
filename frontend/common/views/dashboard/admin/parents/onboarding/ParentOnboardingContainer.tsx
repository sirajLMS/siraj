"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

  return (
    <RequirePermission permissions={[AppPermission.ParentsCreate]}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { ParentOnboardingViewModel, UseParentOnboardingViewModelProps };
