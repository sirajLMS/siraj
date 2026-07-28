"use client";

import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  type ManagerOnboardingContainerViewModel,
  type UseManagerOnboardingContainerViewModelProps,
  useManagerOnboardingContainerViewModel,
} from "@/frontend/common/views/dashboard/staff/onboarding/useManagerOnboardingContainerViewModel";

const lazyViews = createLazyView<ManagerOnboardingContainerViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/staff/onboarding/managerOnboarding.mobile").then(m => ({
      default: m.ManagerOnboardingMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/staff/onboarding/managerOnboarding.desktop").then(m => ({
      default: m.ManagerOnboardingDesktopView,
    }))
);

export function ManagerOnboardingContainer(props: UseManagerOnboardingContainerViewModelProps) {
  const viewModel = useManagerOnboardingContainerViewModel(props);

  return (
    <RequirePermission permissions={[AppPermission.StaffCreate]} fallback={null}>
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}

export type { ManagerOnboardingContainerViewModel, UseManagerOnboardingContainerViewModelProps };
